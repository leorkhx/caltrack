# Calorie Tracker — Frontend

React + TypeScript + Material UI (v7), Vite, React Router.

## Setup

```bash
cd frontend
cp .env.example .env     # set VITE_AUTH_TOKEN to match a token in backend/.env
pnpm install
pnpm dev                  # http://localhost:3000
```

The backend must be running on http://localhost:8000 (see `../backend/README.md`).

## Auth

There is no login screen. The frontend authenticates as a single predefined
user via `VITE_AUTH_TOKEN` in `.env`, matching one of the backend's
`USER_TOKEN` / `USER2_TOKEN` / `ADMIN_TOKEN` values. To demo a different user
or role, change `VITE_AUTH_TOKEN` and restart `pnpm dev`. The backend is the
actual authority on who's allowed to see what — a non-admin token gets a 403
from `/api/admin/*` regardless of what the frontend shows.

## Structure

```
src/
├── api/         axios client (attaches bearer token) + typed calls per resource
├── auth/        active-token resolution (VITE_AUTH_TOKEN), RequireAdmin route guard
├── components/  Sidebar, EntryDialog (FDC autocomplete + validation), EntryRow,
│                CalorieRing, StatCard, FiltersBar
├── pages/
│   ├── FoodEntries/   "My day" — own entries, date filter, log/edit/delete
│   ├── Admin/          All-entries CRUD table + Reports dashboard
├── hooks/       useCurrentUser, useDebouncedValue
├── types/       shared API types
└── theme.ts     MUI theme (indigo accent, rounded cards, soft shadows)
```

## Build

```bash
pnpm build   # tsc -b && vite build
```
