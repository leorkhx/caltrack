# CalTrack

A calorie-tracking app. "CalTrack" is
just the default display name — it's set via `APP_NAME` (backend) and
`VITE_APP_NAME` (frontend) env vars, so rebranding is a one-line edit, no code
changes.

- **Backend**: FastAPI + SQLAlchemy + Alembic + Pydantic v2, REST API, Swagger docs.
- **Frontend**: React + TypeScript + Material UI, Vite, React Router.
- **Database**: SQLite by default (zero setup); swap `DATABASE_URL` for Postgres/Supabase with no code changes.
- **Auth**: predefined per-user Bearer tokens (no signup/login), trivially changeable via env vars.
- **Autocomplete**: USDA FoodData Central (FDC) API, proxied server-side via `FDC_API_KEY`.

## Run it

```bash
# Terminal 1 — backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# create backend/.env (git-ignored) — see backend/README.md for required vars
alembic upgrade head
uvicorn app.main:app --reload --port 8000
# Swagger UI: http://localhost:8000/docs

# Terminal 2 — frontend
cd frontend
# create frontend/.env (git-ignored) — see frontend/README.md
pnpm install
pnpm dev
# App: http://localhost:3000
```

Full details (tokens, per-user calorie limits, Postgres setup) are in
`backend/README.md` and `frontend/README.md`.

### Run both at once

Once the backend venv is created (steps above, one-time), you can start both
apps together from the repo root:

```bash
pnpm install        # installs `concurrently`, only needed once at the root
pnpm dev:all         # backend on :8000 + frontend on :3000, logs interleaved
```

This does **not** replace the one-time backend setup (venv, `pip install`,
`alembic upgrade head`) — it just launches `uvicorn --reload` and `vite` side
by side afterwards. See `backend/dev.sh` and the root `package.json` if you
want to see exactly what it runs.

## Connecting to the database

By default `DATABASE_URL` in `backend/.env` is `sqlite:///./app.db`, which
creates a single file at `backend/app.db`. To inspect it directly:

```bash
# CLI
sqlite3 backend/app.db
sqlite> .tables
sqlite> select * from users;
sqlite> select * from food_entries limit 10;
```

Or open `backend/app.db` in any SQLite GUI (DB Browser for SQLite, TablePlus,
DBeaver, the SQLite extension in VS Code, etc.) — no server or credentials
needed, it's just a file.

To point the app at Postgres/Supabase instead (e.g. for the demo, or because
you want a persistent shared DB instead of a local file):

1. Get your connection string from Supabase (Project Settings → Database →
   Connection string → URI), which looks like:
   `postgresql://postgres:[password]@[host]:5432/postgres`
2. Set it in `backend/.env`:
   ```
   DATABASE_URL=postgresql://postgres:your-password@your-project.supabase.co:5432/postgres
   ```
3. Install the Postgres driver and run migrations:
   ```bash
   cd backend
   pip install psycopg2-binary
   alembic upgrade head
   ```

No application code changes are needed either way — `app/database.py` reads
`DATABASE_URL` and only special-cases SQLite's `connect_args`, everything else
(models, migrations, queries) is portable between the two.

### Creating users

There is no seed script and no signup flow. After `alembic upgrade head`,
insert user rows yourself — see `backend/README.md` → "Setup" for the exact
SQL (a `token_hash` is the SHA-256 hex digest of the plaintext bearer token).

## Requirements checklist

| Requirement | Where |
|---|---|
| Add food entries (date/time, name, calories) | `POST /api/food-entries`, `EntryDialog.tsx` |
| First screen = list of existing entries | `FoodEntriesPage.tsx` at `/` |
| 2,100 kcal/day threshold, visible per day, easy to change per user | `users.daily_calorie_limit` column, default in `backend/.env` (`DEFAULT_DAILY_LIMIT`); shown via the calorie ring + red/green day chips |
| Admin role: view/manage all users' entries | `GET/POST/PUT/DELETE /api/admin/food-entries`, `AllEntriesPage.tsx`, enforced server-side by `require_admin` (403 for regular users) |
| Admin reporting: entries last 7 days vs. previous 7, avg kcal/user | `GET /api/admin/reports`, `ReportsPage.tsx` |
| Token auth, easy to change | `USER_TOKEN` / `USER2_TOKEN` / `ADMIN_TOKEN` in `backend/.env` |
| Food/calorie autocomplete via FDC API, manual fallback | `GET /api/foods/search`, `fdc_service.py`, `EntryDialog.tsx` |
| Filter entries by date range | `date_from`/`date_to` params on both the user and admin entry lists, `FiltersBar.tsx` |
| Data validation (no invalid entries) | Client-side (`utils/validation.ts`) mirrors server-side Pydantic validation (name length, positive/whole/bounded calories, no future dates) |

## Notes

- `Calorie Tracker.html` (design reference) and `interview/` are excluded from
  version control (see `.gitignore`) — kept locally only.
- No deployment is required or attempted; the app is demoed locally per the
  assignment's instructions.
