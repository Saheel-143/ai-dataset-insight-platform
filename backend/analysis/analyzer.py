"""
Dataset Analysis Engine using Pandas and NumPy
Performs comprehensive statistical, structural, and quality analysis on any uploaded dataset.
"""
import math
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple
from backend.models.schemas import ColumnStat, DatasetOverview, DataPreviewResponse, DatasetMetadata

def _clean_val(v: Any) -> Any:
    """Ensure value is JSON serializable (no NaN, Inf, or numpy types)"""
    if v is None:
        return None
    if isinstance(v, (np.floating, float)):
        if math.isnan(v) or math.isinf(v):
            return None
        return round(float(v), 4)
    if isinstance(v, (np.integer, int)):
        return int(v)
    if isinstance(v, (np.bool_, bool)):
        return bool(v)
    if isinstance(v, (pd.Timestamp, np.datetime64)):
        return str(v)
    return str(v)

class DatasetAnalyzer:
    @staticmethod
    def classify_columns(df: pd.DataFrame) -> Tuple[List[str], List[str], List[str], List[str], List[str]]:
        numeric_cols = []
        categorical_cols = []
        datetime_cols = []
        id_cols = []
        constant_cols = []

        total_rows = len(df)

        for col in df.columns:
            # Check constant
            if df[col].nunique(dropna=False) <= 1:
                constant_cols.append(col)

            # Check potential ID
            col_lower = str(col).lower()
            is_id_name = any(id_word in col_lower for id_word in ["_id", "id_", "identifier", "uuid", "guid", "code"])
            if (is_id_name and df[col].nunique() > total_rows * 0.7) or (df[col].nunique() == total_rows and total_rows > 20):
                id_cols.append(col)

            # Check datetime
            if pd.api.types.is_datetime64_any_dtype(df[col]):
                datetime_cols.append(col)
                continue
            elif df[col].dtype == object or pd.api.types.is_string_dtype(df[col]):
                # Try small sample parsing
                sample = df[col].dropna().head(20)
                if len(sample) > 0 and any(date_word in col_lower for date_word in ["date", "time", "year", "month", "day", "created", "timestamp"]):
                    try:
                        pd.to_datetime(sample, errors="raise")
                        datetime_cols.append(col)
                        continue
                    except Exception:
                        pass

            # Check numeric
            if pd.api.types.is_numeric_dtype(df[col]):
                if col not in id_cols:
                    numeric_cols.append(col)
            else:
                categorical_cols.append(col)

        return numeric_cols, categorical_cols, datetime_cols, id_cols, constant_cols

    @staticmethod
    def analyze_dataset(df: pd.DataFrame, meta_dict: Dict[str, Any]) -> DatasetOverview:
        total_rows = len(df)
        total_cols = len(df.columns)
        total_missing = int(df.isna().sum().sum())
        total_duplicates = int(df.duplicated().sum())
        memory_bytes = int(df.memory_usage(deep=True).sum())

        num_cols, cat_cols, date_cols, id_cols, const_cols = DatasetAnalyzer.classify_columns(df)

        column_stats: List[ColumnStat] = []

        for col in df.columns:
            series = df[col]
            missing_count = int(series.isna().sum())
            missing_pct = round((missing_count / total_rows * 100), 2) if total_rows > 0 else 0.0
            unique_count = int(series.nunique(dropna=True))

            # Determine semantic type
            if col in id_cols:
                semantic_type = "id"
            elif col in const_cols:
                semantic_type = "constant"
            elif col in date_cols:
                semantic_type = "datetime"
            elif col in num_cols:
                semantic_type = "numerical"
            else:
                semantic_type = "categorical"

            # Sample values
            sample_vals = [_clean_val(x) for x in series.dropna().head(5).tolist()]

            stat = ColumnStat(
                name=str(col),
                dtype=str(series.dtype),
                semantic_type=semantic_type,
                unique_count=unique_count,
                missing_count=missing_count,
                missing_pct=missing_pct,
                is_constant=(col in const_cols),
                is_id=(col in id_cols),
                sample_values=sample_vals
            )

            # Numerical stats
            if pd.api.types.is_numeric_dtype(series) and not series.dropna().empty:
                valid_num = series.dropna().astype(float)
                mean_val = float(valid_num.mean())
                median_val = float(valid_num.median())
                mode_series = valid_num.mode()
                mode_val = float(mode_series.iloc[0]) if not mode_series.empty else None
                std_val = float(valid_num.std()) if len(valid_num) > 1 else 0.0
                var_val = float(valid_num.var()) if len(valid_num) > 1 else 0.0
                min_val = float(valid_num.min())
                max_val = float(valid_num.max())
                q25 = float(valid_num.quantile(0.25))
                q75 = float(valid_num.quantile(0.75))
                iqr = q75 - q25

                # Outlier detection using 1.5 * IQR
                lower_bound = q25 - 1.5 * iqr
                upper_bound = q75 + 1.5 * iqr
                outliers_count = int(((valid_num < lower_bound) | (valid_num > upper_bound)).sum())

                stat.mean = _clean_val(mean_val)
                stat.median = _clean_val(median_val)
                stat.mode = _clean_val(mode_val)
                stat.std = _clean_val(std_val)
                stat.variance = _clean_val(var_val)
                stat.min = _clean_val(min_val)
                stat.max = _clean_val(max_val)
                stat.q25 = _clean_val(q25)
                stat.q75 = _clean_val(q75)
                stat.iqr = _clean_val(iqr)
                stat.outliers_count = outliers_count
            else:
                # Mode for categorical
                mode_series = series.dropna().mode()
                stat.mode = _clean_val(mode_series.iloc[0]) if not mode_series.empty else None

            # Top categories for categorical / discrete columns
            if unique_count <= 50 and not series.dropna().empty:
                vc = series.value_counts().head(8)
                top_cats = []
                for val, cnt in vc.items():
                    top_cats.append({
                        "category": str(val),
                        "count": int(cnt),
                        "percentage": round(float(cnt / total_rows * 100), 2) if total_rows > 0 else 0
                    })
                stat.top_categories = top_cats

            column_stats.append(stat)

        # Correlation matrix for numerical columns
        corr_matrix = {}
        if len(num_cols) >= 2:
            try:
                sub_df = df[num_cols].dropna()
                if len(sub_df) > 2:
                    corr_df = sub_df.corr()
                    for r_col in corr_df.index:
                        corr_matrix[r_col] = {}
                        for c_col in corr_df.columns:
                            val = corr_df.loc[r_col, c_col]
                            corr_matrix[r_col][c_col] = round(float(val), 4) if not math.isnan(val) else 0.0
            except Exception as e:
                print(f"[DatasetAnalyzer] Correlation error: {e}")

        # Compute overall data quality score (0 - 100)
        total_cells = total_rows * total_cols
        missing_penalty = (total_missing / total_cells * 45) if total_cells > 0 else 0
        dup_penalty = (total_duplicates / total_rows * 25) if total_rows > 0 else 0
        const_penalty = (len(const_cols) / total_cols * 15) if total_cols > 0 else 0
        quality_score = max(10.0, round(100.0 - (missing_penalty + dup_penalty + const_penalty), 1))

        meta = DatasetMetadata(
            id=meta_dict["id"],
            name=meta_dict["name"],
            filename=meta_dict["filename"],
            file_type=meta_dict["file_type"],
            size_bytes=meta_dict.get("size_bytes", memory_bytes),
            row_count=total_rows,
            col_count=total_cols,
            missing_total=total_missing,
            duplicate_rows=total_duplicates,
            created_at=meta_dict.get("created_at", ""),
            updated_at=meta_dict.get("updated_at", ""),
            user_id=meta_dict.get("user_id", "default_user"),
            is_cleaned=meta_dict.get("is_cleaned", False),
            source_dataset_id=meta_dict.get("source_dataset_id"),
            storage_key=meta_dict.get("storage_key", ""),
            quality_score=quality_score
        )

        return DatasetOverview(
            metadata=meta,
            columns=column_stats,
            numeric_columns=num_cols,
            categorical_columns=cat_cols,
            datetime_columns=date_cols,
            id_columns=id_cols,
            constant_columns=const_cols,
            memory_usage_bytes=memory_bytes,
            correlation_matrix=corr_matrix if corr_matrix else None,
            quality_score=quality_score
        )

    @staticmethod
    def get_preview(df: pd.DataFrame, page: int = 1, page_size: int = 15, search: str = "") -> DataPreviewResponse:
        filtered_df = df
        if search:
            search_lower = search.lower()
            mask = filtered_df.astype(str).apply(lambda row: row.str.lower().str.contains(search_lower, regex=False).any(), axis=1)
            filtered_df = filtered_df[mask]

        total_rows = len(filtered_df)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size

        page_df = filtered_df.iloc[start_idx:end_idx]

        records = []
        for _, row in page_df.iterrows():
            record = {}
            for col in page_df.columns:
                val = row[col]
                record[str(col)] = _clean_val(val)
            records.append(record)

        return DataPreviewResponse(
            total_rows=total_rows,
            page=page,
            page_size=page_size,
            columns=[str(c) for c in df.columns],
            data=records
        )

