from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.report import ReportsOut
from app.services.report_service import build_reports

router = APIRouter(prefix="/api/admin", tags=["reports"])


@router.get("/reports", response_model=ReportsOut)
def get_reports(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    return build_reports(db)
