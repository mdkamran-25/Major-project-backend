#!/bin/sh
# Railway startup script — run DB migrations then start the server

echo "⏳ Regenerating Prisma client..."
npx prisma generate

echo "⏳ Running Prisma migrations..."
if npx prisma migrate deploy; then
  echo "✅ Migrations completed successfully"
else
  echo "⚠️  Migrations failed, attempting to reset..."
  npx prisma migrate resolve --rolled-back 20251224062839_init || true
  npx prisma migrate deploy || true
fi

echo "🚀 Starting Tsunami Alert Backend..."
exec node dist/index.js
