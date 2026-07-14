#!/bin/bash
set -e

echo "Starting Django..."

# Fix volume permissions before dropping to non-root
if [ -d "/app/mediafiles" ]; then
    chown -R django:django /app/mediafiles || true
fi
if [ -d "/app/staticfiles" ]; then
    chown -R django:django /app/staticfiles || true
fi

# Run migrations and collectstatic as django user
su-exec django python manage.py migrate --noinput

if [ "$DJANGO_SETTINGS_MODULE" = "backend.settings" ]; then
    su-exec django python manage.py collectstatic --noinput
fi

# Run the main command as django user
exec su-exec django "$@"