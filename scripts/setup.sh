#!/usr/bin/env bash
set -euo pipefail

echo "→ Installing dependencies..."
npm install

if [ ! -f .env ]; then
  cp .env.example .env
  echo "→ Created .env from .env.example"
  echo "  ⚠  Fill in secrets before running: JWT_SECRET, SMTP_*, NOTIFY_EMAIL"
else
  echo "→ .env already exists, skipping"
fi

echo ""
echo "Setup complete. Run: npm run dev"
