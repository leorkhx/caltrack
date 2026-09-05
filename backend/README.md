# CalTrack — Backend

FastAPI + SQLAlchemy + Alembic + Pydantic v2 REST API.

## Setup

```bash
cd backend
python3 -m venv .venv          # any Python 3.9+ interpreter works
source .venv/bin/activate
pip install -r requirements.txt
# Only if you point DATABASE_URL at Postgres/Supabase:
# pip install psycopg2-binary

alembic upgrade head           # create tables (backend/.env already has working defaults)

uvicorn app.main:app --reload --port 8000
```

`backend/.env` is git-ignored, so on a fresh clone create it yourself with:

```
APP_NAME=CalTrack
DATABASE_URL=sqlite:///./app.db
USER_TOKEN=user-token-luiza
USER2_TOKEN=user-token-marco
ADMIN_TOKEN=admin-token-super-secret
USER_EMAIL=luiza@example.com
USER2_EMAIL=marco@example.com
ADMIN_EMAIL=admin@example.com
FDC_API_KEY=DEMO_KEY
DEFAULT_DAILY_LIMIT=2100
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

`USER_EMAIL`/`USER2_EMAIL`/`ADMIN_EMAIL` are reference-only — the app never
reads them. They document which email ("username" on the frontend's sign-in
form) each token ("password") belongs to. The actual value the app checks is
each user's `email` column in the DB; keep these two in sync manually.

Swagger UI: http://localhost:8000/docs.

There is no seed/signup step. Users are plain rows in the `users` table —
insert them yourself (e.g. via `sqlite3 app.db` or a DB GUI). `token_hash` is
SHA-256 of the plaintext token:

```sql
INSERT INTO users (name, email, role, token_hash, daily_calorie_limit)
VALUES ('Luiza Alves', 'luiza@example.com', 'user',
        lower(hex(sha256('user-token-luiza'))), 2100);
```

(SQLite has no built-in `sha256()` — compute the hex digest in Python instead:
`python3 -c "import hashlib; print(hashlib.sha256(b'user-token-luiza').hexdigest())"`
and paste the result into `token_hash` directly.)

## Auth tokens (change these easily)

Auth is predefined bearer tokens, no signup/login — the frontend's sign-in
page just presents it as username (`email`) + password (the token) so it
looks like a normal login. The token itself only ever lives in `backend/.env`
(`USER_TOKEN`, `USER2_TOKEN`, `ADMIN_TOKEN` — these are documentation of what
you intend to hand out, not enforced by the app); what actually authenticates
a request is the matching `token_hash` in the `users` table (see above). To
change a token, update the row's `token_hash` to the SHA-256 hex digest of the
new value. Tokens are never stored in plaintext. To change a "username,"
update that user's `email` column instead.

## Per-user daily calorie limit (change these easily)

Default limit: `DEFAULT_DAILY_LIMIT` in `.env`. Per-user overrides are just the
`daily_calorie_limit` column — e.g.
`UPDATE users SET daily_calorie_limit = 1800 WHERE id = 1;` — read directly by
every endpoint via `app/schemas/user.py` / `app/api/users.py::get_me`.

## Database

Defaults to SQLite (`sqlite:///./app.db`), zero setup. To use Postgres/Supabase,
set `DATABASE_URL=postgresql://...` in `.env` and `pip install psycopg2-binary`.
No SQLite-only types are used, so the same models and migrations work
unmodified against Postgres.

## Structure

```
app/
├── main.py            FastAPI app, CORS, router registration
├── config.py           pydantic-settings (env vars)
├── database.py          engine / session / Base / get_db
├── models/              SQLAlchemy models (User, FoodEntry)
├── schemas/             Pydantic request/response schemas
├── api/                 thin routers: users, food_entries, admin, reports, foods
├── services/             business logic: food_entry_service, report_service, fdc_service
└── dependencies/auth.py  bearer-token -> User resolution, require_admin
alembic/                  migrations (initial revision creates users + food_entries)
tests/                    pytest suite (auth, isolation, admin, validation, report math)
```

## Tests

```bash
pytest -q
```

27 tests covering: unauthenticated/invalid token rejection (401), per-user data
isolation (a user can't see/edit/delete another user's entries — 404), admin-only
endpoints returning 403 for regular users, server-side validation (negative /
zero / >5000 calories, <2 char names, future dates all rejected with 422), and
the last-7-days-vs-previous-7-days report date-window boundary math.

## API surface

All endpoints are under `/api` and require `Authorization: Bearer <token>`
except `/health`. See `/docs` for the full interactive schema. Highlights:

- `GET/POST /api/food-entries`, `PUT|PATCH|DELETE /api/food-entries/{id}` — the
  caller's own entries only.
- `GET /api/users/me` — current user profile incl. role, daily_calorie_limit,
  macro targets.
- `PATCH /api/users/me` — self-service update of daily_calorie_limit
  (800–10000) and protein/carbs/fat targets in grams (0–1000, or null to
  clear). Used by the frontend's Settings page.
- `GET /api/foods/search?q=` — USDA FDC-backed autocomplete (any authenticated
  user). Returns `{results: [{name, calories, meta}]}`; returns an empty list
  (never an error) if FDC is unreachable or the key is rate-limited.
- Admin-only (403 otherwise, enforced by `require_admin` dependency, not just
  hidden client-side):
  - `GET/POST /api/admin/food-entries`, `PUT|PATCH|DELETE /api/admin/food-entries/{id}`
    — full CRUD across all users, with `user_id`/`date_from`/`date_to` filters
    and `page`/`page_size` pagination.
  - `GET /api/admin/users` — user list for pickers/reports.
  - `GET /api/admin/reports` — last-7-days vs previous-7-days entry counts, and
    per-user + overall average daily calories over the last 7 days.
