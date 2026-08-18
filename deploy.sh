#!/bin/bash
# ============================================================
#  Run this script on EC2 from inside ~/3tier-app/
#  Usage: bash deploy.sh
# ============================================================
set -e
echo "scripting is goin to start"

DOCKERHUB_USER="massey123"

echo "========================================"
echo "  Step 1 — Build frontend image"
echo "========================================"
docker build -t ${DOCKERHUB_USER}/3tier-frontend:latest ./frontend

echo "========================================"
echo "  Step 2 — Build backend image"
echo "========================================"
docker build -t ${DOCKERHUB_USER}/3tier-backend:latest ./backend

echo "========================================"
echo "  Step 3 — Push images to DockerHub"
echo "========================================"
docker push ${DOCKERHUB_USER}/3tier-frontend:latest
docker push ${DOCKERHUB_USER}/3tier-backend:latest

echo "========================================"
echo "  Step 4 — Stop old containers"
echo "========================================"
docker-compose down --remove-orphans || true

echo "========================================"
echo "  Step 5 — Start all 3 tiers"
echo "========================================"
docker-compose up -d

echo "========================================"
echo "  Step 6 — Waiting 20s for DB to ready"
echo "========================================"
sleep 20

echo "========================================"
echo "  Step 7 — Container status"
echo "========================================"
docker-compose ps

echo ""
echo "========================================"
echo "  Done! App is running."
echo "  Frontend : http://$(curl -s ifconfig.me)"
echo "  Backend  : http://$(curl -s ifconfig.me):5000/health"
echo "========================================"
