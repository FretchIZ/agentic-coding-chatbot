#!/bin/bash
set -euo pipefail

ENV=${1:-development}
COMPOSE_FILE="infrastructure/docker/docker-compose.yml"
MONITORING_FILE="infrastructure/monitoring/docker-compose.monitoring.yml"

echo "Starting Learning Platform in $ENV mode..."

if [ "$ENV" = "production" ]; then
  docker compose -f "$COMPOSE_FILE" up -d --build
  docker compose -f "$MONITORING_FILE" up -d
elif [ "$ENV" = "monitoring" ]; then
  docker compose -f "$MONITORING_FILE" up -d
else
  docker compose -f "$COMPOSE_FILE" up -d --build
fi

echo "Learning Platform started successfully"
echo "  Web:      http://localhost:3000"
echo "  Admin:    http://localhost:3001"
echo "  API:      http://localhost:8000"
echo "  AI Agent: http://localhost:8001"