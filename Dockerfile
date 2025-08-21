# ---- Builder stage ----
FROM python:3.12-slim AS builder

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set working directory
WORKDIR /app

# Copy dependency files first
COPY backend/pyproject.toml backend/uv.lock ./backend/

# Install dependencies into venv (no source code yet)
RUN --mount=type=cache,target=/root/.cache/uv \
    cd backend && uv sync --locked --no-install-project --no-editable

# Copy full source code
COPY . /app

# Install project (so your app code gets linked into venv)
RUN --mount=type=cache,target=/root/.cache/uv \
    cd backend && uv sync --locked --no-editable


# ---- Runtime stage ----
FROM python:3.12-slim

# Create non-root user for security
RUN useradd -m app
WORKDIR /app

# Copy virtual environment
COPY --from=builder --chown=app:app /app/backend/.venv /app/.venv

# Copy project source
COPY --from=builder --chown=app:app /app /app

# Use venv by default
ENV PATH="/app/.venv/bin:$PATH"

# Expose FastAPI default port
EXPOSE 8000

# Set working directory to app
WORKDIR /app/backend/src/app

# Run FastAPI with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
