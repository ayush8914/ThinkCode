#!/bin/bash

set -e

echo "🏗️  Building Docker images..."

# Build web image
echo "Building web image..."
docker build -t thinkcode/web:latest -f apps/web/Dockerfile .

# Build judge-api image
echo "Building judge-api image..."
docker build -t thinkcode/judge-api:latest -f apps/judge-api/Dockerfile .

# Build judge-worker image
echo "Building judge-worker image..."
docker build -t thinkcode/judge-worker:latest -f apps/judge-worker/Dockerfile .

# Load images into Kind cluster
echo "Loading images into Kind cluster..."
kind load docker-image thinkcode/web:latest --name thinkcode-cluster
kind load docker-image thinkcode/judge-api:latest --name thinkcode-cluster
kind load docker-image thinkcode/judge-worker:latest --name thinkcode-cluster

echo "✅ Images built and loaded successfully!"