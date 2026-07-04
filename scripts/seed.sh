#!/bin/bash
set -euo pipefail

echo "Seeding database..."
npx prisma db seed
echo "Creating initial admin user..."
npx ts-node scripts/seed-admin.ts
echo "Database seeded successfully"