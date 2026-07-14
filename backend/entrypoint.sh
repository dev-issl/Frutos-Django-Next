#!/bin/bash
set -e

echo "Starting Django..."

python manage.py migrate --noinput

if [ "$DJANGO_SETTINGS_MODULE" = "backend.settings" ]; then
    python manage.py collectstatic --noinput
fi

exec "$@"