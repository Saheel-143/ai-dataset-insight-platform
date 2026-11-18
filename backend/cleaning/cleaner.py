"""
Data Cleaning Engine
Executes configurable cleaning operations without ever overwriting the original dataset.
Calculates before-and-after quality metrics and comprehensive operation audit log.
"""
import uuid
import datetime
import numpy as np
import pandas as pd
from typing import Tuple, List, Dict, Any
from backend.models.schemas import CleaningOperation, QualityComparison, DatasetMetadata

class DataCleaner:
    @staticmethod
    def calculate_quality_score(df: pd.DataFrame) -> float:
        total_rows = len(df)
        total_cols = len(df.columns)
        if total_rows == 0 or total_cols == 0:
            return 0.0
        total_cells = total_rows * total_cols
        total_missing = int(df.isna().sum().sum())
        total_duplicates = int(df.duplicated().sum())

        missing_penalty = (total_missing / total_cells * 50)
        dup_penalty = (total_duplicates / total_rows * 30)
        score = max(10.0, round(100.0 - (missing_penalty + dup_penalty), 1))
        return score

    @classmethod
    def clean(cls, df: pd.DataFrame, ops: CleaningOperation) -> Tuple[pd.DataFrame, QualityComparison]:
        # Work on deep copy - NEVER mutate original
        cleaned_df = df.copy(deep=True)
        actions: List[str] = []

        before_rows = len(df)
        before_cols = len(df.columns)
        before_missing = int(df.isna().sum().sum())
        before_duplicates = int(df.duplicated().sum())
        before_score = cls.calculate_quality_score(df)

        # 1. Rename columns
        if ops.rename_columns:
            valid_renames = {k: v for k, v in ops.rename_columns.items() if k in cleaned_df.columns and v.strip()}
            if valid_renames:
                cleaned_df = cleaned_df.rename(columns=valid_renames)
                actions.append(f"Renamed {len(valid_renames)} column(s): {', '.join(f'{k} -> {v}' for k, v in valid_renames.items())}")

        # 2. Drop unnecessary columns
        if ops.columns_to_drop:
            existing_drop = [c for c in ops.columns_to_drop if c in cleaned_df.columns]
            if existing_drop:
                cleaned_df = cleaned_df.drop(columns=existing_drop)
                actions.append(f"Removed {len(existing_drop)} column(s): {', '.join(existing_drop)}")

        # 3. Remove duplicate rows
        if ops.remove_duplicates and before_duplicates > 0:
            dup_count = int(cleaned_df.duplicated().sum())
            cleaned_df = cleaned_df.drop_duplicates().reset_index(drop=True)
            actions.append(f"Removed {dup_count} duplicate row(s)")

        # 4. Impute missing numerical values
        num_cols = cleaned_df.select_dtypes(include=[np.number]).columns.tolist()
        if ops.impute_numerical and num_cols:
            for col in num_cols:
                missing_cnt = int(cleaned_df[col].isna().sum())
                if missing_cnt > 0:
                    if ops.impute_numerical == "mean":
                        fill_val = round(float(cleaned_df[col].mean()), 2)
                        cleaned_df[col] = cleaned_df[col].fillna(fill_val)
                        actions.append(f"Filled {missing_cnt} missing values in '{col}' with column mean ({fill_val})")
                    elif ops.impute_numerical == "median":
                        fill_val = round(float(cleaned_df[col].median()), 2)
                        cleaned_df[col] = cleaned_df[col].fillna(fill_val)
                        actions.append(f"Filled {missing_cnt} missing values in '{col}' with column median ({fill_val})")
                    elif ops.impute_numerical == "mode":
                        mode_s = cleaned_df[col].mode()
                        if not mode_s.empty:
                            fill_val = mode_s.iloc[0]
                            cleaned_df[col] = cleaned_df[col].fillna(fill_val)
                            actions.append(f"Filled {missing_cnt} missing values in '{col}' with column mode ({fill_val})")
                    elif ops.impute_numerical == "constant":
                        val = ops.numerical_custom_val if ops.numerical_custom_val is not None else 0.0
                        cleaned_df[col] = cleaned_df[col].fillna(val)
                        actions.append(f"Filled {missing_cnt} missing values in '{col}' with custom value ({val})")
                    elif ops.impute_numerical == "ffill":
                        cleaned_df[col] = cleaned_df[col].ffill().bfill()
                        actions.append(f"Forward/backward filled {missing_cnt} missing values in '{col}'")
                    elif ops.impute_numerical == "drop":
                        cleaned_df = cleaned_df.dropna(subset=[col]).reset_index(drop=True)
                        actions.append(f"Dropped {missing_cnt} rows with missing values in '{col}'")

        # 5. Impute missing categorical values
        cat_cols = cleaned_df.select_dtypes(exclude=[np.number]).columns.tolist()
        if ops.impute_categorical and cat_cols:
            for col in cat_cols:
                missing_cnt = int(cleaned_df[col].isna().sum())
                if missing_cnt > 0:
                    if ops.impute_categorical == "mode":
                        mode_s = cleaned_df[col].mode()
                        fill_val = str(mode_s.iloc[0]) if not mode_s.empty else "Unknown"
                        cleaned_df[col] = cleaned_df[col].fillna(fill_val)
                        actions.append(f"Filled {missing_cnt} missing values in '{col}' with mode ('{fill_val}')")
                    elif ops.impute_categorical == "unknown":
                        cleaned_df[col] = cleaned_df[col].fillna("Unknown")
                        actions.append(f"Filled {missing_cnt} missing values in '{col}' with label 'Unknown'")
                    elif ops.impute_categorical == "constant":
                        fill_val = ops.categorical_custom_val if ops.categorical_custom_val else "N/A"
                        cleaned_df[col] = cleaned_df[col].fillna(fill_val)
                        actions.append(f"Filled {missing_cnt} missing values in '{col}' with custom label '{fill_val}'")
                    elif ops.impute_categorical == "drop":
                        cleaned_df = cleaned_df.dropna(subset=[col]).reset_index(drop=True)
                        actions.append(f"Dropped {missing_cnt} rows with missing values in '{col}'")

        # 6. Type conversions
        if ops.type_conversions:
            for col, target_type in ops.type_conversions.items():
                if col in cleaned_df.columns:
                    try:
                        if target_type == "int":
                            cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors="coerce").fillna(0).astype(int)
                            actions.append(f"Converted column '{col}' to integer")
                        elif target_type == "float":
                            cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors="coerce")
                            actions.append(f"Converted column '{col}' to float")
                        elif target_type == "string":
                            cleaned_df[col] = cleaned_df[col].astype(str)
                            actions.append(f"Converted column '{col}' to text")
                        elif target_type == "datetime":
                            cleaned_df[col] = pd.to_datetime(cleaned_df[col], errors="coerce")
                            actions.append(f"Parsed column '{col}' as datetime")
                    except Exception as e:
                        actions.append(f"Could not convert '{col}' to {target_type}: {str(e)}")

        # 7. Outlier handling using IQR method
        if ops.handle_outliers and ops.outlier_columns:
            for col in ops.outlier_columns:
                if col in cleaned_df.columns and pd.api.types.is_numeric_dtype(cleaned_df[col]):
                    series = cleaned_df[col].dropna()
                    if len(series) > 4:
                        q25 = float(series.quantile(0.25))
                        q75 = float(series.quantile(0.75))
                        iqr = q75 - q25
                        lower = q25 - 1.5 * iqr
                        upper = q75 + 1.5 * iqr

                        outlier_mask = (cleaned_df[col] < lower) | (cleaned_df[col] > upper)
                        outliers_found = int(outlier_mask.sum())

                        if outliers_found > 0:
                            if ops.handle_outliers == "cap":
                                cleaned_df[col] = cleaned_df[col].clip(lower=lower, upper=upper)
                                actions.append(f"Capped {outliers_found} outlier(s) in '{col}' to IQR boundaries [{round(lower,2)}, {round(upper,2)}]")
                            elif ops.handle_outliers == "remove":
                                cleaned_df = cleaned_df[~outlier_mask].reset_index(drop=True)
                                actions.append(f"Removed {outliers_found} row(s) containing outliers in '{col}'")

        if not actions:
            actions.append("No modifications were required; dataset is already clean.")

        after_rows = len(cleaned_df)
        after_cols = len(cleaned_df.columns)
        after_missing = int(cleaned_df.isna().sum().sum())
        after_duplicates = int(cleaned_df.duplicated().sum())
        after_score = cls.calculate_quality_score(cleaned_df)

        comparison = QualityComparison(
            before_rows=before_rows,
            after_rows=after_rows,
            before_cols=before_cols,
            after_cols=after_cols,
            before_missing=before_missing,
            after_missing=after_missing,
            before_duplicates=before_duplicates,
            after_duplicates=after_duplicates,
            before_quality_score=before_score,
            after_quality_score=after_score,
            actions_taken=actions
        )

        return cleaned_df, comparison

