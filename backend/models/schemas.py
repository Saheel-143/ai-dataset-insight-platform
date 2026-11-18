"""
Pydantic Data Models and API Schemas for AI Dataset Insight Platform
"""
from typing import Dict, List, Any, Optional, Union
from pydantic import BaseModel, Field

# --- Authentication Models ---
class UserRegister(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    confirmation_code: str
    new_password: str

class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    created_at: str
    role: str = "user"

class AuthResponse(BaseModel):
    token: str
    user: UserProfile
    auth_mode: str = "local"  # "local" or "cognito"

# --- Dataset Models ---
class ColumnStat(BaseModel):
    name: str
    dtype: str
    semantic_type: str  # numerical, categorical, datetime, boolean, id, constant
    unique_count: int
    missing_count: int
    missing_pct: float
    is_constant: bool = False
    is_id: bool = False
    sample_values: List[Any] = []
    # Numerical statistics
    mean: Optional[float] = None
    median: Optional[float] = None
    mode: Optional[Any] = None
    std: Optional[float] = None
    variance: Optional[float] = None
    min: Optional[Any] = None
    max: Optional[Any] = None
    q25: Optional[float] = None
    q75: Optional[float] = None
    iqr: Optional[float] = None
    outliers_count: Optional[int] = None
    # Categorical statistics
    top_categories: Optional[List[Dict[str, Any]]] = None

class DatasetMetadata(BaseModel):
    id: str
    name: str
    filename: str
    file_type: str  # csv, xls, xlsx
    size_bytes: int
    row_count: int
    col_count: int
    missing_total: int
    duplicate_rows: int
    created_at: str
    updated_at: str
    user_id: str
    is_cleaned: bool = False
    source_dataset_id: Optional[str] = None
    storage_key: str
    quality_score: Optional[float] = 100.0

class DatasetOverview(BaseModel):
    metadata: DatasetMetadata
    columns: List[ColumnStat]
    numeric_columns: List[str]
    categorical_columns: List[str]
    datetime_columns: List[str]
    id_columns: List[str]
    constant_columns: List[str]
    memory_usage_bytes: int
    correlation_matrix: Optional[Dict[str, Dict[str, float]]] = None
    quality_score: float

class DataPreviewResponse(BaseModel):
    total_rows: int
    page: int
    page_size: int
    columns: List[str]
    data: List[Dict[str, Any]]

# --- Data Cleaning Models ---
class CleaningOperation(BaseModel):
    remove_duplicates: bool = False
    impute_numerical: Optional[str] = None  # None, "mean", "median", "mode", "constant", "ffill"
    numerical_custom_val: Optional[float] = None
    impute_categorical: Optional[str] = None  # None, "mode", "unknown", "constant"
    categorical_custom_val: Optional[str] = None
    columns_to_drop: List[str] = []
    rename_columns: Dict[str, str] = {}
    type_conversions: Dict[str, str] = {}  # col_name: "int", "float", "string", "datetime"
    handle_outliers: Optional[str] = None  # None, "cap", "remove"
    outlier_columns: List[str] = []

class QualityComparison(BaseModel):
    before_rows: int
    after_rows: int
    before_cols: int
    after_cols: int
    before_missing: int
    after_missing: int
    before_duplicates: int
    after_duplicates: int
    before_quality_score: float
    after_quality_score: float
    actions_taken: List[str]

class CleanResponse(BaseModel):
    cleaned_dataset: DatasetMetadata
    quality_comparison: QualityComparison
    message: str

# --- Visualization Models ---
class ChartRecommendation(BaseModel):
    title: str
    chart_type: str  # bar, line, pie, donut, histogram, scatter, boxplot, area, heatmap
    x_axis: Optional[str] = None
    y_axis: Optional[str] = None
    group_by: Optional[str] = None
    aggregation: Optional[str] = "sum"  # sum, avg, count, min, max
    reason: str

class ChartDataRequest(BaseModel):
    dataset_id: str
    chart_type: str
    x_axis: Optional[str] = None
    y_axis: Optional[str] = None
    group_by: Optional[str] = None
    aggregation: Optional[str] = "sum"
    bins: Optional[int] = 10
    limit: Optional[int] = 20
    filter_column: Optional[str] = None
    filter_operator: Optional[str] = None  # ==, !=, >, <, contains
    filter_value: Optional[Any] = None

class ChartDataResponse(BaseModel):
    chart_type: str
    title: str
    x_axis: Optional[str] = None
    y_axis: Optional[str] = None
    data: List[Dict[str, Any]]
    meta: Dict[str, Any] = {}

# --- Chatbot Models ---
class ChatMessageRequest(BaseModel):
    dataset_id: str
    message: str
    conversation_id: Optional[str] = None

class ChartSpec(BaseModel):
    chart_type: str
    title: str
    x_axis: str
    y_axis: str
    data: List[Dict[str, Any]]

class ChatMessageResponse(BaseModel):
    id: str
    conversation_id: str
    dataset_id: str
    user_message: str
    reply: str
    intent: str
    computed_value: Optional[Any] = None
    table_data: Optional[List[Dict[str, Any]]] = None
    chart: Optional[ChartSpec] = None
    suggested_followups: List[str] = []
    created_at: str

class ChatHistoryItem(BaseModel):
    id: str
    conversation_id: str
    dataset_id: str
    user_message: str
    reply: str
    intent: Optional[str] = None
    chart: Optional[Dict[str, Any]] = None
    created_at: str

