export interface UserProfile {
  id: string;
  email: string;
  name: string;
  created_at: string;
  role: string;
}

export interface DatasetMetadata {
  id: string;
  name: string;
  filename: string;
  file_type: string;
  size_bytes: number;
  row_count: number;
  col_count: number;
  missing_total: number;
  duplicate_rows: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_cleaned: boolean;
  source_dataset_id?: string | null;
  storage_key: string;
  quality_score: number;
}

export interface ColumnStat {
  name: string;
  dtype: string;
  semantic_type: 'numerical' | 'categorical' | 'datetime' | 'boolean' | 'id' | 'constant';
  unique_count: number;
  missing_count: number;
  missing_pct: number;
  is_constant: boolean;
  is_id: boolean;
  sample_values: any[];
  mean?: number | null;
  median?: number | null;
  mode?: any | null;
  std?: number | null;
  variance?: number | null;
  min?: any | null;
  max?: any | null;
  q25?: number | null;
  q75?: number | null;
  iqr?: number | null;
  outliers_count?: number | null;
  top_categories?: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

export interface DatasetOverview {
  metadata: DatasetMetadata;
  columns: ColumnStat[];
  numeric_columns: string[];
  categorical_columns: string[];
  datetime_columns: string[];
  id_columns: string[];
  constant_columns: string[];
  memory_usage_bytes: number;
  correlation_matrix?: Record<string, Record<string, number>> | null;
  quality_score: number;
}

export interface DataPreviewResponse {
  total_rows: number;
  page: number;
  page_size: number;
  columns: string[];
  data: Record<string, any>[];
}

export interface CleaningOperation {
  remove_duplicates: boolean;
  impute_numerical?: string | null;
  numerical_custom_val?: number | null;
  impute_categorical?: string | null;
  categorical_custom_val?: string | null;
  columns_to_drop: string[];
  rename_columns: Record<string, string>;
  type_conversions: Record<string, string>;
  handle_outliers?: string | null;
  outlier_columns: string[];
}

export interface QualityComparison {
  before_rows: number;
  after_rows: number;
  before_cols: number;
  after_cols: number;
  before_missing: number;
  after_missing: number;
  before_duplicates: number;
  after_duplicates: number;
  before_quality_score: number;
  after_quality_score: number;
  actions_taken: string[];
}

export interface CleanResponse {
  cleaned_dataset: DatasetMetadata;
  quality_comparison: QualityComparison;
  message: string;
}

export interface ChartRecommendation {
  title: string;
  chart_type: string;
  x_axis?: string;
  y_axis?: string;
  group_by?: string;
  aggregation?: string;
  reason: string;
}

export interface ChartDataRequest {
  dataset_id: string;
  chart_type: string;
  x_axis?: string;
  y_axis?: string;
  group_by?: string;
  aggregation?: string;
  bins?: number;
  limit?: number;
  filter_column?: string;
  filter_operator?: string;
  filter_value?: any;
}

export interface ChartDataResponse {
  chart_type: string;
  title: string;
  x_axis?: string;
  y_axis?: string;
  data: Record<string, any>[];
  meta?: Record<string, any>;
}

export interface ChartSpec {
  chart_type: string;
  title: string;
  x_axis: string;
  y_axis: string;
  data: Record<string, any>[];
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  dataset_id: string;
  user_message: string;
  reply: string;
  intent?: string;
  computed_value?: any;
  table_data?: Record<string, any>[];
  chart?: ChartSpec | null;
  suggested_followups?: string[];
  created_at: string;
}

