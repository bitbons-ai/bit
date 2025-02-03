#!/bin/sh

# Create superuser if not exists
/pb/pocketbase superuser upsert "${SUPERUSER_EMAIL}" "${SUPERUSER_PASSWORD}" || true

# Start PocketBase
exec /pb/pocketbase serve --http=0.0.0.0:8090
