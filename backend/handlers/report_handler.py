"""
PDF Report Generation API Handlers
"""
import os
import uuid
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from backend.models.schemas import UserProfile
from backend.services.storage_service import storage_service
from backend.services.database_service import db_service
from backend.analysis.analyzer import DatasetAnalyzer
from backend.reports.pdf_generator import pdf_generator
from backend.handlers.auth_handler import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/{dataset_id}/generate")
def generate_pdf_report(dataset_id: str, user: UserProfile = Depends(get_current_user)):
    meta = db_service.get_dataset(dataset_id)
    if not meta or meta.get("user_id") != user.id:
        raise HTTPException(status_code=404, detail="Dataset not found or unauthorized.")

    try:
        df = storage_service.load_dataframe(meta["storage_key"], meta["filename"])
        overview = DatasetAnalyzer.analyze_dataset(df, meta)

        report_filename = f"Report_{meta['name'].replace(' ', '_')}_{uuid.uuid4().hex[:6]}.pdf"
        report_path = os.path.join(storage_service.reports_dir, report_filename)

        pdf_generator.generate_report(overview.model_dump(), report_path)

        return FileResponse(
            report_path,
            media_type="application/pdf",
            filename=report_filename
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

