#!/bin/bash

# Exit on error
set -e

echo "--- Daily Word Game Deployment ---"

# 1. Check for game.db
if [ ! -f "backend/game.db" ]; then
    echo "Error: backend/game.db not found!"
    echo "Please run 'python setup_game.py' locally first to generate the game database."
    exit 1
fi

# 2. Configuration
read -p "Enter Google Cloud Project ID: " PROJECT_ID
read -p "Enter Cloud Run Region (e.g., us-central1): " REGION

if [ -z "$PROJECT_ID" ] || [ -z "$REGION" ]; then
    echo "Error: Project ID and Region are required."
    exit 1
fi

IMAGE_NAME="gcr.io/$PROJECT_ID/wordle-app"
SERVICE_NAME="wordle-app"

echo "Using Project: $PROJECT_ID"
echo "Using Region: $REGION"
echo "Image: $IMAGE_NAME"

# 3. Build and Push
echo "Building Docker image..."
gcloud builds submit --tag "$IMAGE_NAME" . --project "$PROJECT_ID"

# 4. Deploy
echo "Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
    --image "$IMAGE_NAME" \
    --platform managed \
    --allow-unauthenticated \
    --region "$REGION" \
    --project "$PROJECT_ID" \
    --port 8080

echo "--- Deployment Complete! ---"
