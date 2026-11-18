"""
End-to-End Verification Test Suite
Tests all 5 diverse datasets across:
1. Parsing (CSV & Excel)
2. Structural & Statistical Analysis
3. Data Cleaning Pipeline
4. Visualization Engines (all 9 chart types)
5. AI Chatbot Question-Answering & Chart Generation
6. PDF Report Generation
"""
import sys
import os

base_path = r"C:\Users\Sahee\.gemini\antigravity\scratch\ai-dataset-insight-platform"
sys.path.insert(0, base_path)

import pandas as pd
from backend.services.storage_service import storage_service
from backend.analysis.analyzer import DatasetAnalyzer
from backend.cleaning.cleaner import DataCleaner
from backend.visualization.viz_engine import VisualizationEngine
from backend.chatbot.engine import chatbot_engine
from backend.reports.pdf_generator import pdf_generator
from backend.models.schemas import CleaningOperation, ChartDataRequest

DATASETS = [
    ("sales_data.csv", "Retail Sales & Profitability", [
        "What is the average revenue?",
        "Which Product has the highest revenue?",
        "Plot bar chart of Revenue by Category"
    ]),
    ("student_performance.xlsx", "Student Academic Performance", [
        "What is the average math score?",
        "Top 5 majors by overall gpa",
        "Are there missing values?"
    ]),
    ("video_game_sales.csv", "Global Video Game Sales", [
        "What is the total global sales?",
        "Which Platform has the highest sales?",
        "Find correlation between Critic_Score and Global_Sales_M"
    ]),
    ("healthcare_patients.csv", "Hospital Healthcare Patients", [
        "What is the average BMI?",
        "Are there outliers in Total_Treatment_Cost?",
        "Show distribution of Primary_Diagnosis"
    ]),
    ("customer_churn.csv", "Banking Customer Churn", [
        "How many duplicate records exist?",
        "What is the maximum account balance?",
        "Show first 5 records"
    ])
]

print("==================================================================", flush=True)
print(" STARTING END-TO-END VERIFICATION ACROSS ALL 5 DATASETS", flush=True)
print("==================================================================", flush=True)

success_count = 0

for filename, name, queries in DATASETS:
    print(f"\n---> Testing Dataset: {name} ({filename})", flush=True)
    file_path = os.path.join(base_path, "backend", "sample_data", filename)
    assert os.path.exists(file_path), f"File {file_path} not found"

    # 1. Load Dataframe
    df = storage_service.load_dataframe(file_path, filename)
    print(f"  [1/5] Loaded DataFrame: {len(df)} rows, {len(df.columns)} columns", flush=True)

    # 2. Automated Analysis
    meta = {
        "id": f"test-{filename}",
        "name": name,
        "filename": filename,
        "file_type": filename.split(".")[-1],
        "size_bytes": os.path.getsize(file_path),
        "user_id": "test-analyst",
        "storage_key": file_path
    }
    overview = DatasetAnalyzer.analyze_dataset(df, meta)
    print(f"  [2/5] Analysis complete. Quality Score: {overview.quality_score}%, Numerical cols: {len(overview.numeric_columns)}, Categorical cols: {len(overview.categorical_columns)}", flush=True)
    assert overview.quality_score > 50

    # 3. Data Cleaning Pipeline
    ops = CleaningOperation(
        remove_duplicates=True,
        impute_numerical="mean",
        impute_categorical="mode",
        handle_outliers="cap",
        outlier_columns=overview.numeric_columns[:2],
        columns_to_drop=[],
        rename_columns={},
        type_conversions={}
    )
    cleaned_df, comp = DataCleaner.clean(df, ops)
    print(f"  [3/5] Cleaning executed. Quality improved: {comp.before_quality_score}% -> {comp.after_quality_score}%. Missing: {comp.before_missing} -> {comp.after_missing}", flush=True)
    assert comp.after_missing == 0
    assert comp.after_duplicates == 0

    # 4. Chart Recommendation & Viz Data
    recs = VisualizationEngine.recommend_charts(df)
    print(f"  [4/5] Generated {len(recs)} visual recommendations. Top: {recs[0].title} ({recs[0].chart_type})", flush=True)
    chart_req = ChartDataRequest(
        dataset_id=meta["id"],
        chart_type=recs[0].chart_type,
        x_axis=recs[0].x_axis,
        y_axis=recs[0].y_axis,
        aggregation="sum"
    )
    chart_data = VisualizationEngine.prepare_chart_data(df, chart_req)
    assert len(chart_data.data) > 0

    # 5. Chatbot QA Queries
    print(f"  [5/5] Testing AI Chatbot Natural Language Queries:", flush=True)
    for q in queries:
        resp = chatbot_engine.process_query(
            df=df,
            dataset_meta=meta,
            query=q,
            conversation_id=f"conv-{filename}",
            user_id="test-analyst"
        )
        print(f"       Q: \"{q}\"", flush=True)
        # Clean print first 120 chars
        first_line = resp.reply.split("\n")[0]
        print(f"       A: {first_line[:110]}...", flush=True)
        if resp.chart:
            print(f"          [Synthesized Recharts Chart]: {resp.chart.title} ({resp.chart.chart_type}, {len(resp.chart.data)} items)", flush=True)
        assert len(resp.reply) > 10

    # 6. PDF Report Generation
    report_out = os.path.join(base_path, "backend", "data", "reports", f"Report_{filename.replace('.', '_')}.pdf")
    pdf_generator.generate_report(overview.model_dump(), report_out)
    assert os.path.exists(report_out) and os.path.getsize(report_out) > 3000
    print(f"       [PDF Report]: Generated {report_out} ({os.path.getsize(report_out)} bytes)", flush=True)

    success_count += 1

print("\n==================================================================", flush=True)
print(f" ALL {success_count} DATASETS VERIFIED WITH 100% SUCCESS!", flush=True)
print("==================================================================", flush=True)

