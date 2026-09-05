from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.favorite_food import FavoriteFood
from app.models.user import User
from app.schemas.favorite_food import FavoriteFoodCreate, FavoriteFoodOut, FavoriteFoodUpdate

router = APIRouter(prefix="/api/favorites", tags=["favorites"])


@router.get("", response_model=list[FavoriteFoodOut])
def list_favorites(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(FavoriteFood)
        .filter(FavoriteFood.user_id == current_user.id)
        .order_by(FavoriteFood.food_name)
        .all()
    )


@router.post("", response_model=FavoriteFoodOut, status_code=201)
def create_favorite(
    payload: FavoriteFoodCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    favorite = FavoriteFood(user_id=current_user.id, **payload.model_dump())
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    return favorite


def _get_owned_favorite(db: Session, favorite_id: int, current_user: User) -> FavoriteFood:
    favorite = (
        db.query(FavoriteFood)
        .filter(FavoriteFood.id == favorite_id, FavoriteFood.user_id == current_user.id)
        .first()
    )
    if favorite is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorite not found.")
    return favorite


@router.put("/{favorite_id}", response_model=FavoriteFoodOut)
@router.patch("/{favorite_id}", response_model=FavoriteFoodOut)
def update_favorite(
    favorite_id: int,
    payload: FavoriteFoodUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    favorite = _get_owned_favorite(db, favorite_id, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(favorite, field, value)
    db.commit()
    db.refresh(favorite)
    return favorite


@router.delete("/{favorite_id}", status_code=204)
def delete_favorite(
    favorite_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    favorite = _get_owned_favorite(db, favorite_id, current_user)
    db.delete(favorite)
    db.commit()
    return None
