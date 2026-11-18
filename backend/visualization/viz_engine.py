"""
Visualization Data Engine
Generates chart recommendations and computes aggregated, binned, and matrix datasets for Recharts.
Supports Bar, Line, Pie, Donut, Histogram, Scatter, Boxplot, Area, and Heatmap.
"""
import math
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from backend.models.schemas import ChartRecommendation, ChartDataRequest, ChartDataResponse

class VisualizationEngine:
    @staticmethod
    def recommend_charts(df: pd.DataFrame) -> List[ChartRecommendation]:
        recommendations: List[ChartRecommendation] = []
        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()
        date_cols = [c for c in cat_cols if any(k in c.lower() for k in ["date", "time", "year", "month", "day", "created"])]

        # 1. Bar Chart recommendation: Categorical with reasonable cardinality + major numerical
        candidate_cats = [c for c in cat_cols if 2 <= df[c].nunique() <= 20 and c not in date_cols]
        if candidate_cats and num_cols:
            best_cat = candidate_cats[0]
            best_num = num_cols[0]
            recommendations.append(ChartRecommendation(
                title=f"Total {best_num} by {best_cat}",
                chart_type="bar",
                x_axis=best_cat,
                y_axis=best_num,
                aggregation="sum",
                reason=f"Compares the distribution of {best_num} across distinct {best_cat} categories."
            ))

        # 2. Line Chart / Area Chart: Date column + numerical
        if date_cols and num_cols:
            recommendations.append(ChartRecommendation(
                title=f"{num_cols[0]} Trend Over Time",
                chart_type="line",
                x_axis=date_cols[0],
                y_axis=num_cols[0],
                aggregation="sum",
                reason=f"Shows chronological trajectory and seasonality of {num_cols[0]}."
            ))

        # 3. Pie / Donut: Low cardinality category (3-8 values)
        pie_cats = [c for c in cat_cols if 3 <= df[c].nunique() <= 8 and c not in date_cols]
        if pie_cats:
            pie_cat = pie_cats[0]
            pie_val = num_cols[0] if num_cols else None
            recommendations.append(ChartRecommendation(
                title=f"{pie_cat} Share Breakdown",
                chart_type="donut",
                x_axis=pie_cat,
                y_axis=pie_val,
                aggregation="sum" if pie_val else "count",
                reason=f"Visualizes proportional breakdown across {df[pie_cat].nunique()} segments."
            ))

        # 4. Histogram: Primary continuous numerical column
        if num_cols:
            recommendations.append(ChartRecommendation(
                title=f"Distribution of {num_cols[0]}",
                chart_type="histogram",
                x_axis=num_cols[0],
                reason=f"Highlights frequency distribution, skewness, and density of {num_cols[0]}."
            ))

        # 5. Scatter Plot: Two continuous numerical columns
        if len(num_cols) >= 2:
            recommendations.append(ChartRecommendation(
                title=f"{num_cols[0]} vs {num_cols[1]} Relationship",
                chart_type="scatter",
                x_axis=num_cols[0],
                y_axis=num_cols[1],
                reason=f"Reveals correlation, clustering, and outliers between {num_cols[0]} and {num_cols[1]}."
            ))

        # 6. Box Plot: Categorical + Numerical
        if candidate_cats and num_cols:
            recommendations.append(ChartRecommendation(
                title=f"{num_cols[0]} Variance by {candidate_cats[0]}",
                chart_type="boxplot",
                x_axis=candidate_cats[0],
                y_axis=num_cols[0],
                reason=f"Displays median, quartiles, and dispersion across {candidate_cats[0]}."
            ))

        # 7. Correlation Heatmap if at least 3 numerical columns
        if len(num_cols) >= 3:
            recommendations.append(ChartRecommendation(
                title="Multivariate Correlation Matrix",
                chart_type="heatmap",
                reason="Evaluates pairwise Pearson correlation coefficients across numerical attributes."
            ))

        return recommendations

    @staticmethod
    def prepare_chart_data(df: pd.DataFrame, req: ChartDataRequest) -> ChartDataResponse:
        work_df = df.copy()

        # Apply optional filter
        if req.filter_column and req.filter_column in work_df.columns and req.filter_value is not None:
            op = req.filter_operator or "=="
            val = req.filter_value
            try:
                if op == "==":
                    work_df = work_df[work_df[req.filter_column].astype(str) == str(val)]
                elif op == "!=":
                    work_df = work_df[work_df[req.filter_column].astype(str) != str(val)]
                elif op == ">":
                    work_df = work_df[pd.to_numeric(work_df[req.filter_column], errors="coerce") > float(val)]
                elif op == "<":
                    work_df = work_df[pd.to_numeric(work_df[req.filter_column], errors="coerce") < float(val)]
                elif op == "contains":
                    work_df = work_df[work_df[req.filter_column].astype(str).str.contains(str(val), case=False, na=False)]
            except Exception as e:
                print(f"[VisualizationEngine] Filter error: {e}")

        chart_type = req.chart_type.lower()
        title = f"{chart_type.capitalize()} Analysis"

        # 1. HEATMAP
        if chart_type == "heatmap":
            num_cols = work_df.select_dtypes(include=[np.number]).columns.tolist()
            if len(num_cols) < 2:
                raise ValueError("Heatmap requires at least two numerical columns.")
            corr_df = work_df[num_cols].dropna().corr()
            heatmap_data = []
            for r in corr_df.index:
                row_item = {"variable": str(r)}
                for c in corr_df.columns:
                    val = corr_df.loc[r, c]
                    row_item[str(c)] = round(float(val), 3) if not math.isnan(val) else 0.0
                heatmap_data.append(row_item)
            return ChartDataResponse(
                chart_type="heatmap",
                title="Correlation Heatmap",
                data=heatmap_data,
                meta={"columns": [str(c) for c in corr_df.columns]}
            )

        # 2. HISTOGRAM
        if chart_type == "histogram":
            x_col = req.x_axis or (work_df.select_dtypes(include=[np.number]).columns.tolist()[0] if not work_df.empty else None)
            if not x_col or x_col not in work_df.columns:
                raise ValueError(f"Valid numerical column required for histogram.")
            clean_series = pd.to_numeric(work_df[x_col], errors="coerce").dropna()
            bins = max(5, min(req.bins or 10, 30))
            counts, bin_edges = np.histogram(clean_series, bins=bins)
            hist_data = []
            for i in range(len(counts)):
                label = f"{round(bin_edges[i], 1)} - {round(bin_edges[i+1], 1)}"
                hist_data.append({
                    "bin": label,
                    "count": int(counts[i]),
                    "min": round(float(bin_edges[i]), 2),
                    "max": round(float(bin_edges[i+1]), 2)
                })
            return ChartDataResponse(
                chart_type="histogram",
                title=f"Histogram of {x_col}",
                x_axis="bin",
                y_axis="count",
                data=hist_data,
                meta={"total_samples": len(clean_series)}
            )

        # 3. SCATTER PLOT
        if chart_type == "scatter":
            x_col = req.x_axis
            y_col = req.y_axis
            if not x_col or not y_col or x_col not in work_df.columns or y_col not in work_df.columns:
                raise ValueError("Scatter plot requires valid X and Y axes.")
            sub_df = work_df[[x_col, y_col]].dropna()
            # Sample if large
            if len(sub_df) > 500:
                sub_df = sub_df.sample(500, random_state=42)
            scatter_data = []
            for _, row in sub_df.iterrows():
                try:
                    scatter_data.append({
                        "x": round(float(row[x_col]), 2),
                        "y": round(float(row[y_col]), 2)
                    })
                except Exception:
                    continue
            return ChartDataResponse(
                chart_type="scatter",
                title=f"{x_col} vs {y_col}",
                x_axis=x_col,
                y_axis=y_col,
                data=scatter_data
            )

        # 4. BOX PLOT
        if chart_type == "boxplot":
            x_col = req.x_axis
            y_col = req.y_axis
            if not y_col or y_col not in work_df.columns:
                raise ValueError("Boxplot requires a numerical Y axis.")
            box_data = []
            if x_col and x_col in work_df.columns:
                groups = work_df[x_col].dropna().unique()[:10]  # top 10 categories
                for grp in groups:
                    grp_series = pd.to_numeric(work_df[work_df[x_col] == grp][y_col], errors="coerce").dropna()
                    if len(grp_series) > 3:
                        q25 = float(grp_series.quantile(0.25))
                        q75 = float(grp_series.quantile(0.75))
                        box_data.append({
                            "category": str(grp),
                            "min": round(float(grp_series.min()), 2),
                            "q25": round(q25, 2),
                            "median": round(float(grp_series.median()), 2),
                            "q75": round(q75, 2),
                            "max": round(float(grp_series.max()), 2),
                            "mean": round(float(grp_series.mean()), 2)
                        })
            else:
                all_s = pd.to_numeric(work_df[y_col], errors="coerce").dropna()
                box_data.append({
                    "category": y_col,
                    "min": round(float(all_s.min()), 2),
                    "q25": round(float(all_s.quantile(0.25)), 2),
                    "median": round(float(all_s.median()), 2),
                    "q75": round(float(all_s.quantile(0.75)), 2),
                    "max": round(float(all_s.max()), 2),
                    "mean": round(float(all_s.mean()), 2)
                })
            return ChartDataResponse(
                chart_type="boxplot",
                title=f"Box Plot of {y_col}" + (f" by {x_col}" if x_col else ""),
                x_axis="category",
                y_axis=y_col,
                data=box_data
            )

        # 5. AGGREGATED CHARTS: BAR, LINE, AREA, PIE, DONUT
        x_col = req.x_axis or work_df.columns[0]
        y_col = req.y_axis
        agg = (req.aggregation or "sum").lower()
        limit = req.limit or 20

        # If grouping column specified
        if req.group_by and req.group_by in work_df.columns and req.group_by != x_col:
            # Pivot table
            if y_col and pd.api.types.is_numeric_dtype(work_df[y_col]):
                piv = work_df.pivot_table(index=x_col, columns=req.group_by, values=y_col, aggfunc=agg, fill_value=0)
            else:
                piv = work_df.pivot_table(index=x_col, columns=req.group_by, aggfunc="size", fill_value=0)
            
            piv = piv.head(limit)
            result_data = []
            for idx, row in piv.iterrows():
                item = {x_col: str(idx)}
                for col_name in piv.columns:
                    item[str(col_name)] = round(float(row[col_name]), 2)
                result_data.append(item)

            return ChartDataResponse(
                chart_type=chart_type,
                title=f"{agg.capitalize()} of {y_col or 'Count'} by {x_col} & {req.group_by}",
                x_axis=x_col,
                y_axis=y_col or "count",
                data=result_data,
                meta={"groups": [str(c) for c in piv.columns]}
            )

        # Standard aggregation
        if y_col and y_col in work_df.columns and pd.api.types.is_numeric_dtype(work_df[y_col]):
            if agg == "avg" or agg == "mean":
                grouped = work_df.groupby(x_col)[y_col].mean().reset_index()
            elif agg == "count":
                grouped = work_df.groupby(x_col)[y_col].count().reset_index()
            elif agg == "max":
                grouped = work_df.groupby(x_col)[y_col].max().reset_index()
            elif agg == "min":
                grouped = work_df.groupby(x_col)[y_col].min().reset_index()
            else:
                grouped = work_df.groupby(x_col)[y_col].sum().reset_index()
            grouped = grouped.sort_values(by=y_col, ascending=False).head(limit)
        else:
            # Simple value counts
            grouped = work_df[x_col].value_counts().reset_index().head(limit)
            grouped.columns = [x_col, "count"]
            y_col = "count"

        chart_data = []
        for _, row in grouped.iterrows():
            val = row[y_col]
            chart_data.append({
                x_col: str(row[x_col]),
                y_col: round(float(val), 2) if isinstance(val, (int, float, np.number)) else str(val)
            })

        return ChartDataResponse(
            chart_type=chart_type,
            title=f"{agg.capitalize()} of {y_col} by {x_col}",
            x_axis=x_col,
            y_axis=y_col,
            data=chart_data
        )

