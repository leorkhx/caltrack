from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.models.user import BiologicalSex, UserRole

MIN_DAILY_LIMIT = 800
MAX_DAILY_LIMIT = 10000
MAX_MACRO_GRAMS = 1000
MIN_HEIGHT_CM = 100
MAX_HEIGHT_CM = 250
MIN_WEIGHT_KG = 30
MAX_WEIGHT_KG = 300
MIN_AGE = 10
MAX_AGE = 120


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: UserRole
    daily_calorie_limit: int
    protein_target_g: Optional[int] = None
    carbs_target_g: Optional[int] = None
    fat_target_g: Optional[int] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    age: Optional[int] = None
    sex: Optional[BiologicalSex] = None

    @computed_field  # type: ignore[misc]
    @property
    def basal_metabolic_rate_kcal(self) -> Optional[int]:
        """Mifflin-St Jeor BMR — only computable once height, weight, age and sex are all set."""
        if self.height_cm is None or self.weight_kg is None or self.age is None or self.sex is None:
            return None
        base = 10 * self.weight_kg + 6.25 * self.height_cm - 5 * self.age
        base += 5 if self.sex == BiologicalSex.male else -161
        return round(base)


class UserSettingsUpdate(BaseModel):
    daily_calorie_limit: Optional[int] = Field(None, ge=MIN_DAILY_LIMIT, le=MAX_DAILY_LIMIT)
    protein_target_g: Optional[int] = Field(None, ge=0, le=MAX_MACRO_GRAMS)
    carbs_target_g: Optional[int] = Field(None, ge=0, le=MAX_MACRO_GRAMS)
    fat_target_g: Optional[int] = Field(None, ge=0, le=MAX_MACRO_GRAMS)
    height_cm: Optional[float] = Field(None, ge=MIN_HEIGHT_CM, le=MAX_HEIGHT_CM)
    weight_kg: Optional[float] = Field(None, ge=MIN_WEIGHT_KG, le=MAX_WEIGHT_KG)
    age: Optional[int] = Field(None, ge=MIN_AGE, le=MAX_AGE)
    sex: Optional[BiologicalSex] = None
