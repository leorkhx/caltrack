from fastapi import APIRouter, Depends, Query

from app.dependencies.auth import get_current_user
from app.models.user import User
from app.services.fdc_service import search_foods

router = APIRouter(prefix="/api/foods", tags=["foods"])


@router.get("/search")
async def search(q: str = Query(..., min_length=1), current_user: User = Depends(get_current_user)):
    results = await search_foods(q)
    return {"results": results}
