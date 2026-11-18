"""
Data Visualization API Handlers
"""
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from backend.models.schemas import ChartRecommendation, ChartDataRequest, ChartDataResponse, UserProfile
from backend.services.storage_service import storage_service
from backend.services.database_service import db_service
from backend.visualization.viz_engine import VisualizationEngine
from backend.handlers.auth_handler import get_current_user

router = APIRouter(prefix="/api/visualization", tags=["Visualization"])

@router.get("/{dataset_id}/recommendations", response_model=List[ChartRecommendation])
def get_chart_recommendations(dataset_id: str, user: UserProfile = Depends(get_current_user)):
    meta = db_service.get_dataset(dataset_id)
    if not meta or meta.get("user_id") != user.id:
        raise HTTPException(status_code=404, detail="Dataset not found or unauthorized.")

    try:
        df = storage_service.load_dataframe(meta["storage_key"], meta["filename"])
        return VisualizationEngine.recommend_charts(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")

@router.post("/data", response_model=ChartDataResponse)
def get_chart_data(req: ChartDataRequest, user: UserProfile = Depends(get_current_user)):
    meta = db_service.get_dataset(req.dataset_id)
    if not meta or meta.get("user_id") != user.id:
        raise HTTPException(status_code=404, detail="Dataset not found or unauthorized.")

    try:
        df = storage_service.load_dataframe(meta["storage_key"], meta["filename"])
        return VisualizationEngine.prepare_chart_data(df, req)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to prepare chart data: {str(e)}")

