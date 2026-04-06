FROM python:3.13-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    POETRY_VERSION=2.2.0\
    POETRY_HOME="/opt/poetry" \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    PYTHONPATH=/app

ENV PATH="$POETRY_HOME/bin:$PATH"

RUN apt-get update && apt-get install -y \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/* \
    && curl -sSL https://install.python-poetry.org | python3 -

WORKDIR /app

COPY pyproject.toml poetry.lock ./

RUN poetry install --no-root --only main

COPY . .

ENV DJANGO_SETTINGS_MODULE=config.settings \
    STATIC_ROOT=/app/static \
    SECRET_KEY=temp-secret-key-for-build

RUN mkdir -p /app/static && \
    if [ ! -f /app/config.json ]; then \
        echo '{"allowed_hosts": ["localhost"], "media_root": "./media"}' > /app/config.json; \
    fi && \
    python manage.py collectstatic --noinput


RUN echo '#!/bin/sh\n\
set -e\n\
echo "Running database migrations..."\n\
python manage.py migrate --noinput\n\
echo "Ensuring superuser exists..."\n\
python manage.py ensure_superuser\n\
echo "Starting daphne..."\n\
exec daphne -b 0.0.0.0 -p 8000 config.asgi:application\n' > /entrypoint.sh && \
    chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]