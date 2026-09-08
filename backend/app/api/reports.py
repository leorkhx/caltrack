from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.report import ReportsOut
from app.schemas.top_food import TopFoodsOut
from app.services.report_service import build_reports, build_top_foods

router = APIRouter(prefix="/api/admin", tags=["reports"])


@router.get("/reports", response_model=ReportsOut)
def get_reports(
    days: Optional[int] = Query(7, ge=1, le=3650),
    all_time: bool = Query(False, alias="all"),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    return build_reports(db, days=None if all_time else days)


@router.get("/foods/top", response_model=TopFoodsOut)
def get_top_foods(
    days: Optional[int] = Query(None, ge=1, le=3650),
    all_time: bool = Query(False, alias="all"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    return build_top_foods(db, days=None if all_time else days, page=page, page_size=page_size)
