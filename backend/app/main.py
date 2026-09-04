from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import admin, food_entries, foods, reports, users
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title=f"{settings.app_name} API",
    description="Backend for the calorie tracking demo application.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(food_entries.router)
app.include_router(admin.router)
app.include_router(reports.router)
app.include_router(foods.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
