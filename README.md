# CalTrack

This is a simple project I worked on: a calorie-tracking app where you log
food entries and see your daily totals against a calorie limit.

## Features

- Add, edit and delete food entries (date/time, name, calories)
- Daily calorie limit with a per-day indicator
- Food autocomplete with manual fallback
- Filter entries by date range
- Admin view to manage all entries and see basic reports

## Stack

- **Backend**: FastAPI, SQLAlchemy, Alembic, SQLite
- **Frontend**: React, TypeScript, Material UI, Vite

## Run it

```bash
# Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
pnpm install
pnpm dev
```

The app runs at http://localhost:3000 and the API docs at http://localhost:8000/docs.

## Tests

```bash
# Backend
cd backend && PYTHONPATH=. .venv/bin/python -m pytest tests/

# Frontend
cd frontend && pnpm test
```
