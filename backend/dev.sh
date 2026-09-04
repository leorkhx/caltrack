#!/usr/bin/env bash
# Activates the backend venv and starts uvicorn with reload.
# Used by `pnpm dev:all` at the repo root; assumes `.venv` already exists
# (see backend/README.md for first-time setup: venv, pip install, alembic, seed).
set -e
cd "$(dirname "$0")"
source .venv/bin/activate
exec uvicorn app.main:app --reload --port 8000
