"""
Data Cleaning API Handlers
"""
import uuid
import os
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from backend.models.schemas import CleaningOperation, CleanResponse, DatasetMetadata, UserProfile
from backend.services.storage_service import storage_service
from backend.services.database_service import db_service
from backend.cleaning.cleaner import DataCleaner
from backend.handlers.auth_handler import get_current_user

router = APIRouter(prefix="/api/cleaning", tags=["Cleaning"])

@router.post("/{dataset_id}/clean", response_model=CleanResponse)
def clean_dataset(
    dataset_id: str,
    ops: CleaningOperation,
    user: UserProfile = Depends(get_current_user)
):
    original_meta = db_service.get_dataset(dataset_id)
    if not original_meta or original_meta.get("user_id") != user.id:
        raise HTTPException(status_code=404, detail="Dataset not found or unauthorized.")

    try:
        # Load original
        df = storage_service.load_dataframe(original_meta["storage_key"], original_meta["filename"])

        # Execute cleaning pipeline
        cleaned_df, quality_comparison = DataCleaner.clean(df, ops)

        # Save cleaned dataset as a NEW file (NEVER overwrite original)
        base_name = os.path.splitext(original_meta["filename"])[0]
        ext = os.path.splitext(original_meta["filename"])[1].lower()
        cleaned_filename = f"{base_name}_cleaned{ext}"

        cleaned_storage_key, _, size_bytes = storage_service.save_dataframe(
            cleaned_df, cleaned_filename, is_cleaned=True
        )

        cleaned_id = f"ds-clean-{uuid.uuid4().hex[:10]}"
        now = datetime.now(timezone.utc).isoformat()

        cleaned_meta = {
            "id": cleaned_id,
            "user_id": user.id,
            "name": f"Cleaned - {original_meta['name']}",
            "filename": cleaned_filename,
            "file_type": original_meta["file_type"],
            "size_bytes": size_bytes,
            "row_count": quality_comparison.after_rows,
            "col_count": quality_comparison.after_cols,
            "missing_total": quality_comparison.after_missing,
            "duplicate_rows": quality_comparison.after_duplicates,
            "is_cleaned": True,
            "source_dataset_id": dataset_id,
            "storage_key": cleaned_storage_key,
            "quality_score": quality_comparison.after_quality_score,
            "created_at": now,
            "updated_at": now
        }

        db_service.save_dataset(cleaned_meta)

        return CleanResponse(
            cleaned_dataset=DatasetMetadata(**cleaned_meta),
            quality_comparison=quality_comparison,
            message="Dataset cleaned successfully and saved as a new version."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleaning failed: {str(e)}")

