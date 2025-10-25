#!/bin/bash
set -e

if [ -z "$1" ]; then
    echo "Usage: ./generate_migration.sh \"migration message\""
    exit 1
fi

MESSAGE="$1"

echo "Generating migration: $MESSAGE"
DATABASE_URL=postgresql://astation_user:astation_password123@localhost:5432/mydatabase alembic revision --autogenerate -m "$MESSAGE"
echo "Done! Review the file in alembic/versions/"