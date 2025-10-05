#!/bin/bash
set -e
echo "Waiting for PostgreSQL..."
while ! nc -z db 5432; do
  sleep 1
done
echo "PostgreSQL started"

# Wait a bit more to ensure PostgreSQL is fully ready
sleep 2

echo "Making migrations for all apps..."
python manage.py makemigrations --noinput
# Run migrations
echo "Running migrations..."
python manage.py migrate

echo "Collecting static files..."
python manage.py collectstatic --noinput --clear || true

# Start server
echo "Starting server..."
exec python manage.py runserver 0.0.0.0:8000