#!/bin/sh
set -e
echo "Waiting for PostgreSQL..."
while ! nc -z db 5432; do
  sleep 1
done
echo "PostgreSQL started"

echo "Apply database migrations"
alembic upgrade head

echo "Starting server"
uvicorn app.main:app --host 0.0.0.0 --port 8000
