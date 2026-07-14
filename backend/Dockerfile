# Stage 1: Base — common dependencies
FROM python:3.13-alpine AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# System dependencies
RUN apk add --no-cache \
    gcc \
    python3-dev \
    musl-dev \
    jpeg-dev \
    zlib-dev \
    libffi-dev \
    openssl-dev \
    cargo \
    bash \
    mysql-dev \
    mariadb-connector-c-dev

# Stage 2: Builder — install packages
FROM base AS builder

WORKDIR /app

# requirements আগে copy করো (cache এর জন্য)
# এই file না বদলালে পরের build এ pip install skip হবে
COPY requirements.txt .

RUN pip install --upgrade pip && \
    pip install --prefix=/install -r requirements.txt

# Stage 3: Development
FROM base AS development

WORKDIR /app

# Builder থেকে installed packages নাও
COPY --from=builder /install /usr/local

# Code copy করো
COPY . .

# Non-root user
RUN addgroup -g 1001 -S django && \
    adduser -u 1001 -S django -G django && \
    chown -R django:django /app

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && \
    chown django:django /entrypoint.sh

USER django
EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# Stage 4: Production
FROM base AS production

WORKDIR /app

# Builder থেকে শুধু installed packages নাও
COPY --from=builder /install /usr/local

# Code copy করো
COPY . .

# Static এবং Media folders বানাও
RUN mkdir -p /app/staticfiles /app/mediafiles

# Non-root user
RUN addgroup -g 1001 -S django && \
    adduser -u 1001 -S django -G django && \
    chown -R django:django /app /app/staticfiles /app/mediafiles

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && \
    chown django:django /entrypoint.sh

USER django
EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "backend.wsgi:application"]



     