from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

ENERGY_NUTRIENT_NUMBER = "208"  # kcal, per USDA FDC nutrient dictionary


def _extract_calories(food: dict[str, Any]) -> float | None:
    for nutrient in food.get("foodNutrients", []):
        number = str(nutrient.get("nutrientNumber") or "")
        name = (nutrient.get("nutrientName") or "").lower()
        if number == ENERGY_NUTRIENT_NUMBER or name == "energy":
            unit = (nutrient.get("unitName") or "").lower()
            value = nutrient.get("value")
            if value is None:
                continue
            if unit in ("kcal", ""):
                return float(value)
    return None


async def search_foods(query: str, page_size: int = 10) -> list[dict[str, Any]]:
    """Query the USDA FDC API and return normalized {name, calories, meta} results.

    Never raises: on any failure (timeout, HTTP error, malformed payload) this
    returns an empty list so the frontend gracefully falls back to manual entry.
    """
    settings = get_settings()
    if not query or len(query.strip()) < 2:
        return []

    params = {
        "api_key": settings.fdc_api_key,
        "query": query.strip(),
        "pageSize": page_size,
        "dataType": ["Foundation", "SR Legacy", "Survey (FNDDS)", "Branded"],
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(settings.fdc_base_url, params=params)
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:  # noqa: BLE001 - deliberately broad, must never crash the request
        logger.warning("FDC search failed for query=%r: %s", query, exc)
        return []

    results: list[dict[str, Any]] = []
    for food in data.get("foods", []) or []:
        calories = _extract_calories(food)
        if calories is None:
            continue
        results.append(
            {
                "name": food.get("description", "").title(),
                "calories": round(calories),
                "meta": {
                    "fdcId": food.get("fdcId"),
                    "dataType": food.get("dataType"),
                    "brandOwner": food.get("brandOwner"),
                    "servingUnit": "kcal per 100g / serving as reported by FDC",
                },
            }
        )
    return results[:page_size]
