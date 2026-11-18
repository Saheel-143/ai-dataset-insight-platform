"""
Deterministic, Zero-Budget Natural Language Dataset Question-Answering Engine
Uses Pandas, NumPy, and Scipy for dynamic column matching, intent detection,
computation execution, context tracking, and automated Recharts chart synthesis.
"""
import re
import math
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
import pandas as pd

from backend.models.schemas import ChatMessageResponse, ChartSpec
from backend.services.database_service import db_service

# Synonym hints to assist dynamic column resolution across diverse domains
SYNONYMS_MAP = {
    "sales": ["revenue", "sales", "turnover", "units_sold", "global_sales_m"],
    "revenue": ["revenue", "sales", "turnover", "income"],
    "profit": ["profit", "net_margin", "earnings", "profit_margin_pct"],
    "cost": ["cost", "expense", "treatment_cost", "total_treatment_cost"],
    "price": ["unit_price", "price", "rate", "cost"],
    "units": ["units_sold", "quantity", "count", "volume"],
    "rating": ["customer_rating", "rating", "user_score", "critic_score", "score"],
    "score": ["score", "math_score", "reading_score", "science_score", "gpa", "overall_gpa", "critic_score", "user_score", "credit_score"],
    "hours": ["weekly_study_hours", "study_hours", "hours", "time"],
    "attendance": ["attendance_rate_pct", "attendance", "presence"],
    "grade": ["overall_gpa", "passed", "grade", "score"],
    "marks": ["math_score", "reading_score", "science_score", "score"],
    "salary": ["estimated_annual_salary", "salary", "compensation", "income"],
    "balance": ["account_balance", "balance", "funds"],
    "tenure": ["tenure_years", "tenure", "experience"],
    "age": ["age", "patient_age"],
    "bp": ["blood_pressure_systolic", "blood_pressure", "bp"],
    "blood pressure": ["blood_pressure_systolic", "blood_pressure"],
    "sugar": ["fasting_glucose_mg_dl", "glucose"],
    "glucose": ["fasting_glucose_mg_dl", "glucose"],
    "cholesterol": ["cholesterol_mg_dl", "cholesterol"],
    "diagnosis": ["primary_diagnosis", "diagnosis", "condition", "disease"],
    "hospital": ["length_of_stay_days", "department", "admission_type"],
    "stay": ["length_of_stay_days", "days"],
    "genre": ["genre", "category", "type"],
    "platform": ["platform", "device", "console"],
    "publisher": ["publisher", "company", "studio", "developer"],
    "region": ["region", "country", "geography", "territory"],
    "country": ["geography", "country", "region", "nation"],
    "product": ["product", "title", "item", "game_id", "product_name"],
    "game": ["title", "game_id", "game_name"],
    "churn": ["churn_status", "churned", "churn_risk", "churn"],
    "customer": ["customer_id", "patient_id", "student_id", "client"]
}

# In-memory session store for conversation follow-ups
_SESSION_MEMORY: Dict[str, Dict[str, Any]] = {}

class ChatbotEngine:
    @staticmethod
    def _clean_str(text: str) -> str:
        return re.sub(r"[^a-zA-Z0-9\s]", " ", text).lower().strip()

    @classmethod
    def resolve_columns(cls, query: str, df: pd.DataFrame) -> Tuple[List[str], List[str]]:
        """
        Dynamically matches tokens in the query to actual columns in df.
        Returns: (matched_columns, candidate_clarifications)
        """
        query_norm = cls._clean_str(query)
        words = query_norm.split()
        cols = list(df.columns)
        matched = []

        # 1. Direct case-insensitive column name match (longest first)
        sorted_cols = sorted(cols, key=lambda c: len(c), reverse=True)
        for col in sorted_cols:
            col_clean = cls._clean_str(col)
            # Match whole column name or parts
            if col_clean in query_norm or col.lower() in query.lower():
                if col not in matched:
                    matched.append(col)

        # 2. Check synonyms
        for word in words:
            if word in SYNONYMS_MAP:
                targets = SYNONYMS_MAP[word]
                for target in targets:
                    for col in cols:
                        if target in col.lower() and col not in matched:
                            matched.append(col)

        # 3. Check partial token overlap if still no match
        if not matched:
            for col in cols:
                parts = cls._clean_str(col).split()
                if any(p in words for p in parts if len(p) >= 3):
                    if col not in matched:
                        matched.append(col)

        # Check if query is asking for a column that has multiple close matches
        clarifications = []
        if len(matched) > 2 and any(k in query_norm for k in ["average", "mean", "sum", "highest", "lowest", "max", "min"]):
            clarifications = matched[:4]

        return matched, clarifications

    @classmethod
    def get_session(cls, conv_id: str) -> Dict[str, Any]:
        if conv_id not in _SESSION_MEMORY:
            _SESSION_MEMORY[conv_id] = {
                "last_num_col": None,
                "last_cat_col": None,
                "last_metric": None,
                "last_table": None,
                "last_top_k": None,
                "dataset_id": None
            }
        return _SESSION_MEMORY[conv_id]

    @classmethod
    def process_query(cls, df: pd.DataFrame, dataset_meta: Dict[str, Any], query: str, conversation_id: str, user_id: str) -> ChatMessageResponse:
        session = cls.get_session(conversation_id)
        session["dataset_id"] = dataset_meta.get("id")

        q_lower = query.lower().strip()
        matched_cols, clarifications = cls.resolve_columns(query, df)

        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()
        date_cols = [c for c in cat_cols if any(k in c.lower() for k in ["date", "time", "year", "month", "day", "created"])]

        # Contextual column fallback for follow-up questions
        active_num_col = None
        active_cat_col = None

        for c in matched_cols:
            if c in num_cols and not active_num_col:
                active_num_col = c
            elif c in cat_cols and not active_cat_col:
                active_cat_col = c

        # Context carry-over: if user asks "Show the top five" or "What is its average?"
        if not active_num_col and session.get("last_num_col") and session["last_num_col"] in df.columns:
            active_num_col = session["last_num_col"]
        if not active_cat_col and session.get("last_cat_col") and session["last_cat_col"] in df.columns:
            active_cat_col = session["last_cat_col"]

        total_rows = len(df)
        total_cols = len(df.columns)

        reply = ""
        intent = "general"
        computed_value = None
        table_data = None
        chart = None
        suggested_followups = []

        # =========================================================
        # 1. OVERVIEW & SUMMARY
        # =========================================================
        if any(w in q_lower for w in ["what is this dataset about", "tell me about this dataset", "summarize", "summary", "overview", "describe dataset"]):
            intent = "overview"
            missing_total = int(df.isna().sum().sum())
            dups = int(df.duplicated().sum())
            reply = (
                f"**Dataset Summary: {dataset_meta.get('name', 'Active Dataset')}**\n\n"
                f"• **Dimensions:** {total_rows:,} rows across {total_cols} columns\n"
                f"• **Data Types:** {len(num_cols)} numerical, {len(cat_cols)} categorical/text, and {len(date_cols)} temporal columns\n"
                f"• **Data Cleanliness:** {missing_total:,} missing values, {dups} duplicate records\n"
                f"• **Key Metrics Available:** {', '.join(num_cols[:4]) if num_cols else 'None'}\n"
                f"• **Primary Categorical Fields:** {', '.join([c for c in cat_cols if c not in date_cols][:4]) if cat_cols else 'None'}\n\n"
                f"You can ask me to calculate averages, find top performers, plot charts, detect outliers, or inspect specific columns."
            )
            suggested_followups = [
                f"What is the average {num_cols[0]}?" if num_cols else "Show first 5 records",
                f"Which {cat_cols[0]} has the highest count?" if cat_cols else "Are there missing values?",
                "Suggest useful visualizations"
            ]

        # =========================================================
        # 2. DIMENSIONS / ROWS / COLUMNS COUNT
        # =========================================================
        elif any(w in q_lower for w in ["how many rows", "how many columns", "number of rows", "number of columns", "dataset shape", "how many records", "how big"]):
            intent = "dimensions"
            reply = (
                f"Your dataset contains **{total_rows:,} rows (records)** and **{total_cols} columns (features)**.\n"
                f"There are **{len(num_cols)}** numerical columns and **{len(cat_cols)}** categorical/text columns."
            )
            computed_value = {"rows": total_rows, "columns": total_cols}
            suggested_followups = ["What are the column names?", "Show first 5 records", "Are there missing values?"]

        # =========================================================
        # 3. LIST COLUMN NAMES
        # =========================================================
        elif any(w in q_lower for w in ["what are the column names", "list columns", "column names", "available columns", "what fields"]):
            intent = "columns_list"
            col_list_md = "\n".join([f"- **`{c}`** ({df[c].dtype})" for c in df.columns])
            reply = f"Here are the **{total_cols} columns** present in this dataset:\n\n{col_list_md}"
            suggested_followups = ["Show first 5 records", "Summarize this dataset"]

        # =========================================================
        # 4. PREVIEW / FIRST FIVE RECORDS
        # =========================================================
        elif any(w in q_lower for w in ["show the first", "first five", "first 5", "head", "preview records", "sample records", "show records"]):
            intent = "preview"
            sample_df = df.head(5)
            table_data = sample_df.fillna("None").to_dict(orient="records")
            reply = f"Here are the first **5 records** from the dataset across {min(total_cols, 6)} displayed attributes:"
            suggested_followups = ["How many duplicate records exist?", "Are there missing values?", "What is the average value?"]

        # =========================================================
        # 5. MISSING VALUES ANALYSIS
        # =========================================================
        elif any(w in q_lower for w in ["missing value", "null value", "empty cells", "nan value", "are there missing"]):
            intent = "missing_values"
            missing_series = df.isna().sum()
            missing_cols = missing_series[missing_series > 0]
            if missing_cols.empty:
                reply = "✅ Excellent! **No missing values** were detected anywhere in this dataset. All columns are 100% complete."
                computed_value = 0
            else:
                top_missing_col = missing_cols.idxmax()
                top_missing_cnt = int(missing_cols.max())
                total_miss = int(missing_cols.sum())
                breakdown = "\n".join([f"• **`{col}`**: {cnt:,} missing ({round(cnt/total_rows*100, 2)}%)" for col, cnt in missing_cols.items()])
                reply = (
                    f"There are **{total_miss:,} total missing values** across {len(missing_cols)} column(s).\n\n"
                    f"**Column with most missing values:** `{top_missing_col}` ({top_missing_cnt:,} missing, {round(top_missing_cnt/total_rows*100, 2)}%).\n\n"
                    f"**Breakdown:**\n{breakdown}\n\n"
                    f"*Tip: You can use the Data Cleaning module to impute these with mean, median, or mode.*"
                )
                computed_value = {"total_missing": total_miss, "worst_column": top_missing_col}
            suggested_followups = ["How many duplicate records exist?", "Clean this dataset", "What is the dataset quality score?"]

        # =========================================================
        # 6. DUPLICATE RECORDS ANALYSIS
        # =========================================================
        elif any(w in q_lower for w in ["duplicate", "duplicated", "repeated rows"]):
            intent = "duplicates"
            dups = int(df.duplicated().sum())
            if dups == 0:
                reply = "✅ There are **0 duplicate rows** in this dataset. Every single row is unique."
                computed_value = 0
            else:
                pct = round(dups / total_rows * 100, 2)
                reply = (
                    f"Found **{dups:,} duplicate row(s)** in the dataset, representing **{pct}%** of all records.\n"
                    f"You can remove these duplicate records anytime using the **Data Cleaning** tab."
                )
                computed_value = dups
            suggested_followups = ["Are there missing values?", "Summarize this dataset"]

        # =========================================================
        # 7. AVERAGE / MEAN
        # =========================================================
        elif any(w in q_lower for w in ["average", "mean"]) and not any(w in q_lower for w in ["top", "highest", "lowest", "plot", "chart"]):
            intent = "average"
            target_col = active_num_col
            if not target_col and num_cols:
                target_col = num_cols[0]
            if not target_col:
                reply = "No numerical column could be identified for calculating an average. Please specify a numerical column."
            else:
                session["last_num_col"] = target_col
                valid_series = df[target_col].dropna().astype(float)
                count_valid = len(valid_series)
                avg_val = round(float(valid_series.mean()), 2)
                computed_value = avg_val

                # Format appropriately
                val_formatted = f"{avg_val:,.2f}"
                reply = (
                    f"The average **{target_col}** is **{val_formatted}**.\n\n"
                    f"Calculated using `{target_col}` across **{count_valid:,} valid non-null records** "
                    f"(Min: {valid_series.min():,.2f}, Max: {valid_series.max():,.2f}, Median: {valid_series.median():,.2f})."
                )
                suggested_followups = [
                    f"What is the maximum {target_col}?",
                    f"What is the total {target_col}?",
                    f"Show distribution of {target_col}"
                ]

        # =========================================================
        # 8. TOTAL / SUM
        # =========================================================
        elif any(w in q_lower for w in ["total of", "sum of", "calculate the total", "sum ", "total "]) and not any(w in q_lower for w in ["rows", "columns", "missing"]):
            intent = "sum"
            target_col = active_num_col
            if not target_col and num_cols:
                target_col = num_cols[0]
            if not target_col:
                reply = "Please specify which numerical column you would like to sum."
            else:
                session["last_num_col"] = target_col
                valid_series = df[target_col].dropna().astype(float)
                total_val = round(float(valid_series.sum()), 2)
                computed_value = total_val
                reply = (
                    f"The total sum of **{target_col}** is **{total_val:,.2f}**, "
                    f"accumulated across {len(valid_series):,} records."
                )
                suggested_followups = [
                    f"What is the average {target_col}?",
                    f"Which {cat_cols[0] if cat_cols else 'item'} has the highest {target_col}?",
                    f"Plot bar chart of {target_col}"
                ]

        # =========================================================
        # 9. MINIMUM / MAXIMUM
        # =========================================================
        elif any(w in q_lower for w in ["maximum", "max value", "highest value", "minimum", "min value", "lowest value"]):
            intent = "min_max"
            target_col = active_num_col or (num_cols[0] if num_cols else None)
            if not target_col:
                reply = "Please select or name a numerical column to find minimum and maximum values."
            else:
                session["last_num_col"] = target_col
                valid_series = df[target_col].dropna().astype(float)
                min_val = round(float(valid_series.min()), 2)
                max_val = round(float(valid_series.max()), 2)
                avg_val = round(float(valid_series.mean()), 2)

                is_max_query = any(w in q_lower for w in ["maximum", "max", "highest"])
                if is_max_query:
                    reply = (
                        f"The **maximum value** for **{target_col}** is **{max_val:,.2f}** "
                        f"(Minimum: {min_val:,.2f}, Average: {avg_val:,.2f})."
                    )
                    computed_value = max_val
                else:
                    reply = (
                        f"The **minimum value** for **{target_col}** is **{min_val:,.2f}** "
                        f"(Maximum: {max_val:,.2f}, Average: {avg_val:,.2f})."
                    )
                    computed_value = min_val
                suggested_followups = [
                    f"Which record has the maximum {target_col}?",
                    f"What is the average {target_col}?",
                    f"Are there outliers in {target_col}?"
                ]

        # =========================================================
        # 10. TOP N / HIGHEST ENTITY / RANKING
        # =========================================================
        elif any(w in q_lower for w in ["which", "who", "top", "highest", "lowest", "bottom", "best", "worst"]) and (cat_cols or num_cols):
            intent = "ranking"
            # Find category column and metric column
            target_cat = active_cat_col or (cat_cols[0] if cat_cols else None)
            target_num = active_num_col or (num_cols[0] if num_cols else None)

            # Determine N
            n_match = re.search(r"\b(top|first|bottom|lowest|highest)\s+(\d+)\b", q_lower)
            n = int(n_match.group(2)) if n_match else (5 if any(w in q_lower for w in ["top", "bottom"]) else 1)
            is_bottom = any(w in q_lower for w in ["bottom", "lowest", "worst", "least"])

            if target_cat and target_num:
                session["last_cat_col"] = target_cat
                session["last_num_col"] = target_num

                # Group by target_cat and sum/mean target_num
                grouped = df.groupby(target_cat)[target_num].sum().reset_index()
                grouped = grouped.sort_values(by=target_num, ascending=is_bottom).reset_index(drop=True)

                if n == 1:
                    top_item = grouped.iloc[0]
                    top_name = str(top_item[target_cat])
                    top_score = round(float(top_item[target_num]), 2)
                    computed_value = {target_cat: top_name, target_num: top_score}

                    reply = (
                        f"**{top_name}** has the {'lowest' if is_bottom else 'highest'} total **{target_num}**, "
                        f"with a value of **{top_score:,.2f}**."
                    )
                    suggested_followups = [
                        f"Show the top 5 {target_cat}",
                        f"What is the average {target_num}?",
                        f"Plot a bar chart of {target_cat} by {target_num}"
                    ]
                else:
                    top_df = grouped.head(n)
                    table_data = top_df.to_dict(orient="records")
                    chart_data = [{"category": str(r[target_cat]), "value": round(float(r[target_num]), 2)} for _, r in top_df.iterrows()]
                    chart = ChartSpec(
                        chart_type="bar",
                        title=f"{'Bottom' if is_bottom else 'Top'} {n} {target_cat} by {target_num}",
                        x_axis="category",
                        y_axis="value",
                        data=chart_data
                    )
                    reply = (
                        f"Here are the **{'bottom' if is_bottom else 'top'} {n} {target_cat}** ranked by **{target_num}**:\n\n"
                        f"1. **{top_df.iloc[0][target_cat]}**: {top_df.iloc[0][target_num]:,.2f}\n"
                        f"2. **{top_df.iloc[1][target_cat]}**: {top_df.iloc[1][target_num]:,.2f}" if len(top_df) > 1 else ""
                    )
                    suggested_followups = [
                        f"What is the average {target_num}?",
                        f"Show distribution of {target_cat}",
                        f"Find correlation between {target_num} and {num_cols[1] if len(num_cols)>1 else target_num}"
                    ]
            elif target_cat:
                # Rank by frequency count
                vc = df[target_cat].value_counts().reset_index()
                vc.columns = [target_cat, "count"]
                vc = vc.sort_values(by="count", ascending=is_bottom).head(n)
                table_data = vc.to_dict(orient="records")
                reply = (
                    f"**{vc.iloc[0][target_cat]}** has the {'lowest' if is_bottom else 'highest'} count "
                    f"in **{target_cat}**, appearing **{vc.iloc[0]['count']:,} times**."
                )
                suggested_followups = [f"Show the top 5 {target_cat}", f"Plot donut chart of {target_cat}"]
            else:
                reply = "Could not identify which category and metric to rank. Please specify columns like 'Which Region has highest Revenue?'."

        # =========================================================
        # 11. CATEGORICAL DISTRIBUTION / COUNT
        # =========================================================
        elif any(w in q_lower for w in ["distribution of", "breakdown of", "highest count", "most common", "how many per", "categories"]):
            intent = "distribution"
            target_cat = active_cat_col or (cat_cols[0] if cat_cols else None)
            if not target_cat:
                reply = "Please specify a categorical column to inspect its distribution."
            else:
                session["last_cat_col"] = target_cat
                vc = df[target_cat].value_counts().head(8).reset_index()
                vc.columns = [target_cat, "count"]
                table_data = vc.to_dict(orient="records")

                top_cat = vc.iloc[0][target_cat]
                top_cnt = int(vc.iloc[0]["count"])
                top_pct = round(top_cnt / total_rows * 100, 2)

                chart_data = [{"category": str(r[target_cat]), "count": int(r["count"])} for _, r in vc.iterrows()]
                chart = ChartSpec(
                    chart_type="bar",
                    title=f"Distribution of {target_cat}",
                    x_axis="category",
                    y_axis="count",
                    data=chart_data
                )

                reply = (
                    f"In **`{target_cat}`**, the most frequent category is **{top_cat}** "
                    f"with **{top_cnt:,} records ({top_pct}%)**.\n"
                    f"There are {df[target_cat].nunique()} unique categories in total."
                )
                suggested_followups = [
                    f"Plot pie chart of {target_cat}",
                    f"Calculate average for each {target_cat}",
                    "Suggest useful visualizations"
                ]

        # =========================================================
        # 12. CORRELATION ANALYSIS
        # =========================================================
        elif any(w in q_lower for w in ["correlation", "relationship between", "correlate", "correlated"]):
            intent = "correlation"
            corr_cols = [c for c in matched_cols if c in num_cols]
            if len(corr_cols) < 2 and len(num_cols) >= 2:
                # Pick top 2 numerical columns
                corr_cols = [num_cols[0], num_cols[1]]

            if len(corr_cols) >= 2:
                c1, c2 = corr_cols[0], corr_cols[1]
                sub = df[[c1, c2]].dropna()
                val = round(float(sub[c1].corr(sub[c2])), 4)
                computed_value = val

                strength = "strong positive" if val > 0.7 else ("moderate positive" if val > 0.3 else ("strong negative" if val < -0.7 else ("moderate negative" if val < -0.3 else "weak or negligible")))
                reply = (
                    f"The Pearson correlation coefficient between **`{c1}`** and **`{c2}`** is **{val:.4f}**.\n\n"
                    f"This indicates a **{strength}** linear relationship."
                )
                suggested_followups = [
                    f"Plot scatter plot of {c1} vs {c2}",
                    "Show correlation heatmap",
                    f"What is the average {c1}?"
                ]
            else:
                reply = "Correlation analysis requires at least two numerical columns in the dataset."

        # =========================================================
        # 13. OUTLIER DETECTION
        # =========================================================
        elif any(w in q_lower for w in ["outlier", "extreme value", "anomal"]):
            intent = "outliers"
            target_col = active_num_col or (num_cols[0] if num_cols else None)
            if not target_col:
                reply = "Please specify a numerical column to detect outliers."
            else:
                session["last_num_col"] = target_col
                series = pd.to_numeric(df[target_col], errors="coerce").dropna()
                q25 = float(series.quantile(0.25))
                q75 = float(series.quantile(0.75))
                iqr = q75 - q25
                lower = round(q25 - 1.5 * iqr, 2)
                upper = round(q75 + 1.5 * iqr, 2)
                outliers = series[(series < lower) | (series > upper)]
                cnt = len(outliers)
                pct = round(cnt / len(series) * 100, 2) if len(series) > 0 else 0

                computed_value = {"outlier_count": cnt, "lower_bound": lower, "upper_bound": upper}
                reply = (
                    f"**Outlier Analysis for `{target_col}` (IQR Method):**\n\n"
                    f"• **Outliers Detected:** **{cnt:,}** ({pct}% of values)\n"
                    f"• **Valid Normal Range:** [{lower:,.2f} to {upper:,.2f}]\n"
                    f"• **IQR:** {round(iqr, 2):,.2f} (Q1: {round(q25, 2):,.2f}, Q3: {round(q75, 2):,.2f})\n\n"
                    f"You can cap or remove these in the **Data Cleaning** module."
                )
                suggested_followups = [
                    f"What is the median {target_col}?",
                    f"Plot box plot of {target_col}",
                    "Clean this dataset"
                ]

        # =========================================================
        # 14. VISUALIZATION REQUEST / CHART GENERATION
        # =========================================================
        elif any(w in q_lower for w in ["plot", "chart", "graph", "visualize", "visualization", "histogram", "scatter", "bar chart", "line chart", "pie chart"]):
            intent = "visualization"
            chart_type = "bar"
            if "line" in q_lower:
                chart_type = "line"
            elif "pie" in q_lower or "donut" in q_lower:
                chart_type = "pie"
            elif "scatter" in q_lower:
                chart_type = "scatter"
            elif "histogram" in q_lower:
                chart_type = "histogram"
            elif "box" in q_lower:
                chart_type = "boxplot"

            target_cat = active_cat_col or (cat_cols[0] if cat_cols else None)
            target_num = active_num_col or (num_cols[0] if num_cols else None)

            if chart_type == "histogram" and target_num:
                series = df[target_num].dropna().astype(float)
                counts, edges = np.histogram(series, bins=8)
                chart_data = [{"bin": f"{round(edges[i],1)}-{round(edges[i+1],1)}", "count": int(counts[i])} for i in range(len(counts))]
                chart = ChartSpec(chart_type="histogram", title=f"Histogram of {target_num}", x_axis="bin", y_axis="count", data=chart_data)
                reply = f"Generated a histogram displaying the frequency distribution of **{target_num}** across 8 bins:"
            elif target_cat and target_num:
                grouped = df.groupby(target_cat)[target_num].sum().reset_index().sort_values(by=target_num, ascending=False).head(8)
                chart_data = [{"name": str(r[target_cat]), "value": round(float(r[target_num]), 2)} for _, r in grouped.iterrows()]
                chart = ChartSpec(chart_type=chart_type, title=f"{target_num} by {target_cat}", x_axis="name", y_axis="value", data=chart_data)
                reply = f"Generated a **{chart_type} chart** comparing **{target_num}** across top **{target_cat}** categories:"
            elif target_cat:
                vc = df[target_cat].value_counts().head(6).reset_index()
                vc.columns = [target_cat, "count"]
                chart_data = [{"name": str(r[target_cat]), "value": int(r["count"])} for _, r in vc.iterrows()]
                chart = ChartSpec(chart_type="pie", title=f"Distribution of {target_cat}", x_axis="name", y_axis="value", data=chart_data)
                reply = f"Generated a breakdown chart showing the distribution of **{target_cat}**:"
            else:
                reply = "To generate a chart, please specify the columns you want to view, for example: 'Plot bar chart of Revenue by Category'."

            suggested_followups = ["Show the top 5", "What is the average?", "Summarize this dataset"]

        # =========================================================
        # 15. FALLBACK / COLUMN CLARIFICATION / UNKNOWN
        # =========================================================
        else:
            intent = "clarification"
            if clarifications:
                cols_str = ", ".join([f"`{c}`" for c in clarifications])
                reply = (
                    f"I found multiple columns matching your query: {cols_str}.\n\n"
                    f"Which one would you like me to analyze?"
                )
            elif active_num_col:
                # Provide a quick statistical summary of that active column
                series = df[active_num_col].dropna().astype(float)
                reply = (
                    f"**Quick Stat for `{active_num_col}`:**\n"
                    f"• Mean: {series.mean():,.2f}\n"
                    f"• Median: {series.median():,.2f}\n"
                    f"• Min: {series.min():,.2f}\n"
                    f"• Max: {series.max():,.2f}\n\n"
                    f"What specific calculation would you like me to perform on this column?"
                )
            else:
                reply = (
                    f"I am ready to help you analyze **{dataset_meta.get('name', 'this dataset')}**!\n\n"
                    f"You can ask me questions like:\n"
                    f"• *'What is the average {num_cols[0]}?'* (Numerical analysis)\n"
                    f"• *'Which {cat_cols[0] if cat_cols else 'item'} has the highest {num_cols[0] if num_cols else 'value'}?'* (Top ranking)\n"
                    f"• *'Show distribution of {cat_cols[0] if cat_cols else 'records'}'* (Categorical breakdown)\n"
                    f"• *'Plot a bar chart of {cat_cols[0] if cat_cols else 'data'} by {num_cols[0] if num_cols else 'value'}'* (Visualizations)\n"
                    f"• *'Are there missing values or outliers?'* (Data Quality)"
                )
            suggested_followups = [
                f"What is the average {num_cols[0]}?" if num_cols else "Summarize this dataset",
                f"Which {cat_cols[0]} has the highest count?" if cat_cols else "How many rows and columns?",
                "Suggest useful visualizations"
            ]

        # Save to database
        message_id = f"msg-{uuid.uuid4().hex[:12]}"
        created_at = datetime.now(timezone.utc).isoformat()
        chat_record = {
            "id": message_id,
            "conversation_id": conversation_id,
            "dataset_id": dataset_meta.get("id"),
            "user_id": user_id,
            "user_message": query,
            "reply": reply,
            "intent": intent,
            "computed_value": computed_value,
            "chart": chart.model_dump() if chart else None,
            "created_at": created_at
        }
        db_service.save_chat_message(chat_record)

        return ChatMessageResponse(
            id=message_id,
            conversation_id=conversation_id,
            dataset_id=dataset_meta.get("id"),
            user_message=query,
            reply=reply,
            intent=intent,
            computed_value=computed_value,
            table_data=table_data,
            chart=chart,
            suggested_followups=suggested_followups,
            created_at=created_at
        )

# Global singleton
chatbot_engine = ChatbotEngine()

