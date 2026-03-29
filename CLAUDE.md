# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack todo list app: React/TypeScript frontend (Bun + Vite + Bulma) + Python backend (FastAPI + SQLite via SQLAlchemy). No authentication — the app is publicly accessible.

## Development Commands

### Backend

```bash
cd backend
uv venv --python 3.14
source .venv/bin/activate
uv pip install -r requirements.txt -r requirements-dev.txt
python -m uvicorn main:app --reload --port 8000   # dev server
pytest tests/ -v                                   # run all tests
pytest tests/test_todos.py -v                     # run a single test file
mypy .                                             # type-check
```

### Frontend

```bash
cd frontend
bun install
bun run dev          # Vite dev server on :5173
bun run typecheck    # TypeScript type-check
bun run build        # production build
```

## Architecture

### Backend (`backend/`)

- `main.py` — FastAPI app, CORS middleware, mounts router. Also calls `Base.metadata.create_all` on startup to create tables.
- `database.py` — SQLAlchemy engine (`upstart.db`), `SessionLocal`, `Base`, and the `get_db` FastAPI dependency.
- `models.py` — SQLAlchemy `TodoItem` ORM model with `Mapped[]` type annotations.
- `schemas.py` — Pydantic v2 request/response models (`TodoCreate`, `TodoUpdate`, `TodoResponse`).
- `routers/todos.py` — Routes: `GET /todos`, `POST /todos`, `PATCH /todos/{id}`, `DELETE /todos/{id}`.

All DB access goes through the SQLAlchemy ORM — no raw SQL. Type hints are enforced with `mypy --strict` (configured in `mypy.ini`).

#### TodoItem model

| Field | Type | Notes |
|---|---|---|
| `id` | int | Primary key, autoincrement |
| `name` | str | Required, max 500 chars |
| `done` | bool | Default `False` |
| `priority` | int \| None | Optional, values 0–3 (0=Urgent, 1=High, 2=Medium, 3=Low) |
| `due_date` | date \| None | Optional |
| `created_at` | datetime | Auto-set on create |
| `updated_at` | datetime | Auto-updated on change |

### Frontend (`frontend/src/`)

- `App.tsx` — Thin wrapper; renders `TodoDashboard` directly.
- `api/todos.ts` — Typed `fetch` wrappers for all todo endpoints.
- `components/TodoDashboard.tsx` — Main UI: add form, sortable table, inline editing, fade-out on done, show/hide completed section.

TypeScript strict mode is enabled. `noUnusedLocals` and `noUnusedParameters` are on.

#### TodoDashboard features

- Add todos with name (required), priority (dropdown 0–3), and due date (optional)
- Priority displayed as colored Bulma tags: 0=red, 1=yellow, 2=blue, 3=green
- Sort table by created date (default, newest first) or due date — click column header to toggle
- Click name or due date cell to edit inline; blur or Enter to save, Escape to cancel
- Checkbox marks item done → fades out and moves to completed section
- "Show/hide completed" toggle button with count

### E2E tests (`frontend/e2e/`)

Run with `bun run e2e/todo.mjs` (requires both servers running).

#### Playwright patterns learned

- **Direct child selector for nested spans:** Priority cells render `<span><span>…</span></span>`. Use `td:nth-child(3) > span` not `td:nth-child(3) span` — the latter resolves to 2 elements and causes a strict-mode violation.
- **Page-scoped input waits after inline edit clicks:** After clicking a cell to trigger inline editing, wait for the input with a page-level locator (`page.locator('tbody tr td:nth-child(2) input.input')`), not scoped to the row variable — the row reference can be stale post-click.
- **Re-query the row after a rename:** A row locator filtered by old text won't match after the name changes. Assign a new variable filtered by the new text.
- **`.waitFor({ state: 'detached' })` to assert removal:** Use `page.locator('…').waitFor({ state: 'detached' })` instead of `waitForFunction` to assert a React-driven DOM removal — it's idiomatic Playwright and avoids polling fragility.

### Tests (`backend/tests/`)

`conftest.py` creates an in-memory SQLite DB and overrides the `get_db` dependency via `app.dependency_overrides`. Each test gets a fresh DB (the `reset_database` fixture is `autouse=True`).
