# Calorie Tracker — Frontend

React + TypeScript + Material UI (v7), Vite, React Router.

## Setup

```bash
cd frontend
pnpm install
pnpm dev                  # http://localhost:3000
```

`frontend/.env` is git-ignored; on a fresh clone create it with:

```
VITE_API_BASE_URL=http://localhost:8000
```

The backend must be running on http://localhost:8000 (see `../backend/README.md`).

## Auth

There is no signup — per the assignment, auth is a predefined per-user bearer
token, not a real account system. The sign-in page (`pages/SignIn`) is just a
thin UI over that: paste a token, it's validated against `GET /api/users/me`,
and stored in `localStorage` (`auth/accounts.ts`) so it's attached to every
API request. To demo a different user or role, sign out (bottom of the
sidebar) and sign back in with a different token — the backend is the actual
authority on who's allowed to see what, a non-admin token still gets a 403
from `/api/admin/*` regardless of what the frontend shows.

## Structure

```
src/
├── api/         axios client (attaches bearer token) + typed calls per resource
├── auth/        localStorage-backed active-token storage, RequireAdmin route guard
├── components/  Sidebar, EntryDialog (FDC autocomplete + validation), EntryRow,
│                CalorieRing, StatCard, FiltersBar
├── pages/
│   ├── SignIn/          Token-paste "sign in" (not a real login/signup)
│   ├── FoodEntries/     "My day" — own entries, date filter, log/edit/delete
│   ├── Admin/           All-entries CRUD table + Reports dashboard
├── hooks/       useCurrentUser, useDebouncedValue
├── types/       shared API types
└── theme.ts     MUI theme (indigo accent, rounded cards, soft shadows)
```

## Build

```bash
pnpm build   # tsc -b && vite build
```
