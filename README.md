# ToDo List

Full-stack todo list app. React/TypeScript frontend + Python/FastAPI backend. No authentication — publicly accessible.

## Stack

- **Frontend:** React, TypeScript, Vite, Bun, Bulma
- **Backend:** FastAPI, SQLAlchemy, SQLite

## Getting started

### Backend

```bash
cd backend

# Create and activate venv
uv venv --python 3.14
source .venv/bin/activate

# Install dependencies
uv pip install -r requirements.txt -r requirements-dev.txt

# Start dev server (http://localhost:8000)
python -m uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
bun install

# Start dev server (http://localhost:5173)
bun run dev
```

## All commands

### Backend

| Command | Description |
|---|---|
| `uv venv --python 3.14` | Create virtual environment |
| `source .venv/bin/activate` | Activate virtual environment |
| `uv pip install -r requirements.txt -r requirements-dev.txt` | Install all dependencies |
| `python -m uvicorn main:app --reload --port 8000` | Start dev server |
| `pytest tests/ -v` | Run all tests |
| `pytest tests/test_todos.py -v` | Run a single test file |
| `mypy .` | Type-check |

### Frontend

| Command | Description |
|---|---|
| `bun install` | Install dependencies |
| `bun run dev` | Start dev server |
| `bun run build` | Production build |
| `bun run typecheck` | TypeScript type-check |
| `bun run preview` | Preview production build |

## API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/todos` | List all todo items |
| `POST` | `/todos` | Create a todo item |
| `PATCH` | `/todos/{id}` | Update a todo item |
| `DELETE` | `/todos/{id}` | Delete a todo item |
