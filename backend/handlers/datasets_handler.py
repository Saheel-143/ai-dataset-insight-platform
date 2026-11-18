"""
Dataset Management API Handlers
Supports file uploads (CSV, XLS, XLSX), metadata registration, S3/local presigned URLs,
file downloads, deletion, and sample dataset seeding.
"""
import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional
import pandas as pd
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.responses import FileResponse, Response

from backend.models.schemas import DatasetMetadata, UserProfile
from backend.services.storage_service import storage_service
from backend.services.database_service import db_service
from backend.handlers.auth_handler import get_current_user

router = APIRouter(prefix="/api/datasets", tags=["Datasets"])

@router.get("", response_model=List[DatasetMetadata])
def list_datasets(user: UserProfile = Depends(get_current_user)):
    items = db_service.list_user_datasets(user.id)
    return [DatasetMetadata(**d) for d in items]

@router.post("/upload", response_model=DatasetMetadata)
async def upload_dataset(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    user: UserProfile = Depends(get_current_user)
):
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".csv", ".xls", ".xlsx"]:
        raise HTTPException(status_code=400, detail="Invalid file format. Only CSV, XLS, and XLSX are supported.")

    content = await file.read()
    size_bytes = len(content)

    # 50MB limit check
    if size_bytes > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum allowed limit of 50MB.")

    storage_key, _ = storage_service.save_upload(content, filename)

    # Parse and inspect shape
    try:
        df = storage_service.load_dataframe(storage_key, filename)
    except Exception as e:
        storage_service.delete_file(storage_key)
        raise HTTPException(status_code=400, detail=f"Failed to parse dataset file: {str(e)}")

    row_count = len(df)
    col_count = len(df.columns)
    missing_total = int(df.isna().sum().sum())
    dup_rows = int(df.duplicated().sum())
    now = datetime.now(timezone.utc).isoformat()

    dataset_id = f"ds-{uuid.uuid4().hex[:12]}"
    display_name = name.strip() if name and name.strip() else os.path.splitext(filename)[0].replace("_", " ").title()

    meta = {
        "id": dataset_id,
        "user_id": user.id,
        "name": display_name,
        "filename": filename,
        "file_type": ext.lstrip("."),
        "size_bytes": size_bytes,
        "row_count": row_count,
        "col_count": col_count,
        "missing_total": missing_total,
        "duplicate_rows": dup_rows,
        "is_cleaned": False,
        "source_dataset_id": None,
        "storage_key": storage_key,
        "quality_score": 100.0,
        "created_at": now,
        "updated_at": now
    }

    db_service.save_dataset(meta)
    return DatasetMetadata(**meta)

@router.post("/presigned-url")
def get_presigned_url(filename: str = Query(...), user: UserProfile = Depends(get_current_user)):
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".csv", ".xls", ".xlsx"]:
        raise HTTPException(status_code=400, detail="Invalid file type.")
    return storage_service.get_presigned_upload_url(filename)

@router.get("/{dataset_id}", response_model=DatasetMetadata)
def get_dataset(dataset_id: str, user: UserProfile = Depends(get_current_user)):
    item = db_service.get_dataset(dataset_id)
    if not item or item.get("user_id") != user.id:
        raise HTTPException(status_code=404, detail="Dataset not found or unauthorized.")
    return DatasetMetadata(**item)

@router.delete("/{dataset_id}")
def delete_dataset(dataset_id: str, user: UserProfile = Depends(get_current_user)):
    item = db_service.get_dataset(dataset_id)
    if not item or item.get("user_id") != user.id:
        raise HTTPException(status_code=404, detail="Dataset not found or unauthorized.")

    storage_service.delete_file(item["storage_key"])
    db_service.delete_dataset(dataset_id, user.id)
    return {"message": "Dataset deleted successfully."}

@router.get("/download/{storage_key}")
def download_dataset(storage_key: str, filename: Optional[str] = Query(None)):
    # Local download endpoint
    file_path = os.path.join(storage_service.uploads_dir, storage_key)
    if not os.path.exists(file_path):
        file_path = os.path.join(storage_service.cleaned_dir, storage_key)
    if not os.path.exists(file_path):
        file_path = os.path.join(storage_service.sample_dir, storage_key)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server.")

    dl_name = filename or storage_key
    return FileResponse(file_path, filename=dl_name)

@router.post("/seed-samples", response_model=List[DatasetMetadata])
def seed_samples(user: UserProfile = Depends(get_current_user)):
    """Seeds the 5 pre-generated sample datasets into the active user's workspace"""
    sample_dir = storage_service.sample_dir
    sample_files = [
        ("sales_data.csv", "Retail Sales & Profitability Dataset"),
        ("student_performance.xlsx", "Student Academic Performance & Attendance"),
        ("video_game_sales.csv", "Global Video Game Sales & Critic Scores"),
        ("healthcare_patients.csv", "Hospital Healthcare Patients & Diagnostics"),
        ("customer_churn.csv", "Banking Customer Churn & Financial Indicators")
    ]

    seeded = []
    now = datetime.now(timezone.utc).isoformat()

    for fname, dname in sample_files:
        src = os.path.join(sample_dir, fname)
        if not os.path.exists(src):
            continue

        ext = os.path.splitext(fname)[1].lower()
        with open(src, "rb") as f:
            content = f.read()

        storage_key, _ = storage_service.save_upload(content, fname)
        df = storage_service.load_dataframe(storage_key, fname)

        dataset_id = f"ds-sample-{uuid.uuid4().hex[:8]}"
        meta = {
            "id": dataset_id,
            "user_id": user.id,
            "name": dname,
            "filename": fname,
            "file_type": ext.lstrip("."),
            "size_bytes": len(content),
            "row_count": len(df),
            "col_count": len(df.columns),
            "missing_total": int(df.isna().sum().sum()),
            "duplicate_rows": int(df.duplicated().sum()),
            "is_cleaned": False,
            "source_dataset_id": None,
            "storage_key": storage_key,
            "quality_score": 100.0,
            "created_at": now,
            "updated_at": now
        }
        db_service.save_dataset(meta)
        seeded.append(DatasetMetadata(**meta))

    return seeded

