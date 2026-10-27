#!/usr/bin/env bash
set -e
echo "Setting up Ethiopian Hotel Management System Monorepo..."
pnpm install
cp -n .env.example .env || true
echo "Setup complete! Run 'pnpm dev' to start."
