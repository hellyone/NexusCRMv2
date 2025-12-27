#!/bin/bash

# Deployment Script for Nexus OS

echo "🚀 Starting Deployment..."

# 1. Pull latest changes
echo "📥 Pulling latest Code..."
git pull origin main

# 2. Rebuild and restart containers
echo "🐳 Rebuilding Containers..."
docker compose down
docker compose up -d --build

# 3. Apply Database Migrations
echo "🔄 Running Database Migrations..."
sleep 5 # Wait for DB to be ready
docker compose exec -T nexus-os npx prisma migrate deploy

# 3. Cleanup unused images to save space
echo "🧹 Cleaning up..."
docker image prune -f

echo "✅ Deployment Complete! Nexus OS is running."
