"""Application configuration, read from environment variables / .env file.

To change auth tokens for a demo/interview session: edit USER_TOKEN, USER2_TOKEN,
ADMIN_TOKEN below (or set them as real env vars) and restart the server. No code
changes or redeploy needed.
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "CalTrack"

    database_url: str = "sqlite:///./app.db"

    user_token: str = "user-token-luiza"
    user2_token: str = "user-token-marco"
    admin_token: str = "admin-token-super-secret"

    fdc_api_key: str = "DEMO_KEY"
    fdc_base_url: str = "https://api.nal.usda.gov/fdc/v1/foods/search"

    default_daily_limit: int = 2100

    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
