from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

ENERGY_NUTRIENT_NUMBER = "208"  # kcal, per USDA FDC nutrient dictionary
PROTEIN_NUTRIENT_NUMBER = "203"  # g
FAT_NUTRIENT_NUMBER = "204"  # g, "Total lipid (fat)"
CARBS_NUTRIENT_NUMBER = "205"  # g, "Carbohydrate, by difference"

# USDA's FDC API is flaky under its own rate limiting: the same request can
# alternate between 200 and a bare 400/429/5xx from one call to the next with
# no discernible pattern. A short retry-with-backoff turns most of those
# transient failures into a successful result instead of "no data at all".
MAX_ATTEMPTS = 3
RETRY_STATUS_CODES = {400, 429, 500, 502, 503, 504}
RETRY_DELAYS_SECONDS = (0.3, 0.8)


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


def _extract_nutrient_grams(food: dict[str, Any], number: str) -> int | None:
    for nutrient in food.get("foodNutrients", []):
        if str(nutrient.get("nutrientNumber") or "") == number:
            value = nutrient.get("value")
            if value is None:
                continue
            return round(float(value))
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

    data: dict[str, Any] | None = None
    async with httpx.AsyncClient(timeout=5.0) as client:
        for attempt in range(MAX_ATTEMPTS):
            try:
                resp = await client.get(settings.fdc_base_url, params=params)
                if resp.status_code in RETRY_STATUS_CODES and attempt < MAX_ATTEMPTS - 1:
                    logger.info(
                        "FDC search got %s for query=%r, retrying (attempt %d/%d)",
                        resp.status_code, query, attempt + 1, MAX_ATTEMPTS,
                    )
                    await asyncio.sleep(RETRY_DELAYS_SECONDS[attempt])
                    continue
                resp.raise_for_status()
                data = resp.json()
                break
            except Exception as exc:  # noqa: BLE001 - deliberately broad, must never crash the request
                if attempt < MAX_ATTEMPTS - 1:
                    logger.info("FDC search error for query=%r, retrying: %s", query, exc)
                    await asyncio.sleep(RETRY_DELAYS_SECONDS[attempt])
                    continue
                logger.warning("FDC search failed for query=%r after %d attempts: %s", query, MAX_ATTEMPTS, exc)
                return []

    if data is None:
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
                "protein_g": _extract_nutrient_grams(food, PROTEIN_NUTRIENT_NUMBER),
                "carbs_g": _extract_nutrient_grams(food, CARBS_NUTRIENT_NUMBER),
                "fat_g": _extract_nutrient_grams(food, FAT_NUTRIENT_NUMBER),
                "meta": {
                    "fdcId": food.get("fdcId"),
                    "dataType": food.get("dataType"),
                    "brandOwner": food.get("brandOwner"),
                    "servingUnit": "kcal per 100g / serving as reported by FDC",
                },
            }
        )
    return results[:page_size]
