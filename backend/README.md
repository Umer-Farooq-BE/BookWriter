# BookWriterPro — Backend (FastAPI)

Step‑by‑step guide for new developers to clone, set up, run locally, and run with Docker Compose.

---

## Prerequisites

- Git
- Python 3.12 (we use `uv` to manage Python and venvs)
- `uv` (Astral's tool)
- Docker Desktop with WSL2 enabled (for Windows users)

---

## 1) Clone & enter the repo

```bash
git clone https://github.com/mohsin-zaheer/BookWriterPro.git
cd BookWriterPro
```

> If your Windows user folder contains spaces, wrap the path in quotes when `cd`-ing.

---

## 2) Install `uv` (Astral)

**mac / linux**

```bash
curl -LsSf https://astral.sh/uv/install.sh | less
```

**Windows**

```powershell
pip install uv
```

Docs: [https://docs.astral.sh/uv/getting-started/installation/](https://docs.astral.sh/uv/getting-started/installation/)

---

## 3) Install Python using `uv`

```bash
uv python install 3.12
```

---

## 4) Install backend dependencies (local development)

```bash
cd backend
# activate the environment
.venv\Scripts\activate   # Windows
# or
source .venv/bin/activate  # Linux / WSL

# install deps
uv sync
```

If `pyproject.toml` changed, update the lockfile before building images:

```bash
uv lock
```

---

## 5) Run the development server locally (from repo root)

```bash
cd backend/src/app
uvicorn main:app --reload
```

Open the docs:

```
http://127.0.0.1:8000/docs
```

---

## 6) Run with Docker & Docker Compose (recommended)

### Where to put Docker files

- Put **`Dockerfile`**, **`docker-compose.yml`** and **`.dockerignore`** in the **repo root** (`BookWriterPro/`).

### Quick commands

From the repo root:

- **First time: build and start (rebuild image and attach logs):**

```powershell
docker compose up --build
```

- **First time: build and start in background (detached):**

```powershell
docker compose up --build -d
```

- **Start later (images already built):**

```powershell
docker compose up -d
```

- **Stop (keep containers but stop them):**

```powershell
docker compose stop
```

- **Stop and remove containers & network (clean shutdown):**

```powershell
docker compose down
```

- **Stop, remove containers and volumes (destructive, deletes data):**

```powershell
docker compose down -v
```

- **Rebuild images (no cache):**

```powershell
docker compose build --no-cache
```

- **View logs (follow):**

```powershell
docker compose logs -f
```

- **Check status:**

```powershell
docker compose ps
```

### Example `docker-compose.yml` (development)

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: bookwriterpro-backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend/src/app:/app/backend/src/app # optional - enables live reload for dev
    environment:
      - ENV=development
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

> Use the `volumes` mapping only for development. For production remove the volume and run without `--reload`.

---

## 7) Recommended `.dockerignore`

```
__pycache__/
*.pyc
*.pyo
*.pyd
*.db
*.sqlite3
.env
.git
.gitignore
Dockerfile
docker-compose.yml
.venv/
```

This keeps your build context small and avoids copying local environment files into the image.

---

## 8) Troubleshooting tips

- **`docker` not found** — make sure Docker Desktop is installed and running; restart your shell.
- **Windows path spaces** — wrap paths in quotes. Example: `cd "C:\Users\FASTECH LAPTOP\Desktop\nexus_xpert\BookWriterPro"`.
- **If dependencies changed** — run `uv lock` locally, commit the updated `uv.lock`, then rebuild images with `docker compose build --no-cache`.
- **`ImportError: cannot import name 'SON' from 'bson'`** — remove the `bson` PyPI package from your `pyproject.toml` and keep only `pymongo`. Then update lockfile and rebuild.

---

## 9) Useful Docker Compose workflows

- **Start fresh build & run:**

```powershell
docker compose down -v
docker compose up --build -d
```

- **Update code only (dev with volume):**

```powershell
# update code locally, then
docker compose up -d
# or view logs
docker compose logs -f
```

- **Recreate a single service:**

```powershell
docker compose up -d --no-deps --build backend
```

---
