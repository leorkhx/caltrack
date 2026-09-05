# CalTrack — Frontend

React + TypeScript + Material UI (v7), Vite, React Router, TanStack Query,
MUI X Date Pickers (dayjs adapter).

## Setup

```bash
cd frontend
pnpm install
pnpm dev                  # http://localhost:3000
```

`frontend/.env` is git-ignored; on a fresh clone create it with:

```
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=CalTrack
```

The backend must be running on http://localhost:8000 (see `../backend/README.md`).

## Auth

There is no signup — per the assignment, auth is a predefined per-user bearer
token, not a real account system. The sign-in page (`pages/SignIn`) *looks*
like a normal username/password login, but the "password" field's value is
literally the bearer token (the user's `email` is the "username"). On submit
it's validated against `GET /api/users/me`, checked against the entered
username, and stored in `localStorage` (`auth/accounts.ts`) so it's attached
to every API request. To demo a different user or role, sign out (bottom of
the sidebar) and sign back in with different credentials — the backend is the actual
authority on who's allowed to see what, a non-admin token still gets a 403
from `/api/admin/*` regardless of what the frontend shows.

## Data fetching / caching

All server data goes through **TanStack Query** (`api/queryClient.ts` sets up
the `QueryClient` + a `queryKeys` factory), not manual `useState`/`useEffect`.
This fixes two things a hand-rolled fetch-on-mount pattern doesn't:

- **No loading-spinner flicker on repeat navigation** — cached data renders
  instantly while a background refetch confirms it's still fresh
  (`staleTime: 15s`), instead of unmounting to a spinner every time.
- **Prefetching** — hovering "All entries" or "Reports" in the sidebar
  (`components/SidebarContent.tsx`) fires the query before you even click, so
  the page is often already cached by the time you land on it.

Per-resource hooks live in `hooks/` (`useMyEntries`, `useAdminEntries` +
`useAdminUsers`, `useReports`) — queries for reads, mutations for
create/update/delete, each mutation invalidating the relevant query key on
success. `queryClient.clear()` is called on sign-out so a different user's
data can't leak into the next session's cache.

## Structure

```
src/
├── api/         axios client (attaches bearer token), typed calls per resource,
│                queryClient.ts (TanStack Query client + query key factory)
├── auth/        localStorage-backed active-token storage, RequireAdmin route guard
├── components/  Sidebar (responsive: persistent panel on desktop, app bar +
│                drawer on mobile) / SidebarContent, EntryDialog (FDC
│                autocomplete + validation), EntryRow, CalorieRing, StatCard,
│                FiltersBar
├── pages/
│   ├── SignIn/          Token-paste "sign in" (not a real login/signup)
│   ├── FoodEntries/     "My day" — own entries, date filter, log/edit/delete
│   ├── Admin/           All-entries CRUD table + Reports dashboard
│   ├── Settings/        Daily limit, macro targets (with diet-type presets +
│   │                    a visual breakdown bar), body metrics -> estimated BMR
├── hooks/       useCurrentUser, useMyEntries, useAdminEntries, useReports,
│                useDebouncedValue — all TanStack Query-backed
├── types/       shared API types
└── theme.ts     MUI theme (indigo accent, rounded cards, soft shadows)
```

## Build

```bash
pnpm build   # tsc -b && vite build
```
