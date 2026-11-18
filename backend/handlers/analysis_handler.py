"""
Dataset Analysis API Handlers
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from backend.models.schemas import DatasetOverview, DataPreviewResponse, UserProfile
from backend.services.storage_service import storage_service
from backend.services.database_service import db_service
from backend.analysis.analyzer import DatasetAnalyzer
from backend.handlers.auth_handler import get_current_user

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])

@router.get("/{dataset_id}", response_model=DatasetOverview)
def get_dataset_analysis(dataset_id: str, user: UserProfile = Depends(get_current_user)):
    meta = db_service.get_dataset(dataset_id)
    if not meta or meta.get("user_id") != user.id:
        raise HTTPException(status_code=404, detail="Dataset not found or unauthorized.")

    try:
        df = storage_service.load_dataframe(meta["storage_key"], meta["filename"])
        overview = DatasetAnalyzer.analyze_dataset(df, meta)

        # Update quality score in database if changed
        if overview.quality_score != meta.get("quality_score"):
            meta["quality_score"] = overview.quality_score
            db_service.save_dataset(meta)

        return overview
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/{dataset_id}/preview", response_model=DataPreviewResponse)
def get_dataset_preview(
    dataset_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    search: str = Query("", max_length=100),
    user: UserProfile = Depends(get_current_user)
):
    meta = db_service.get_dataset(dataset_id)
    if not meta or meta.get("user_id") != user.id:
        raise HTTPException(status_code=404, detail="Dataset not found or unauthorized.")

    try:
        df = storage_service.load_dataframe(meta["storage_key"], meta["filename"])
        return DatasetAnalyzer.get_preview(df, page=page, page_size=page_size, search=search)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preview failed: {str(e)}")

