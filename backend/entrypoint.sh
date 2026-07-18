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

# Run migrations
su-exec django python manage.py migrate --noinput

# Always collect static files in production container
su-exec django python manage.py collectstatic --noinput --clear

# Run the main command as django user
exec su-exec django "$@"