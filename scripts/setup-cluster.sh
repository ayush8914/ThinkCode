#!/bin/bash

set -e

echo "🚀 Setting up ThinkCode cluster..."

# Create Kind cluster
echo "Creating Kind cluster..."
kind create cluster --config k8s/kind/kind-config.yaml

# Verify cluster
kubectl cluster-info

# Create namespace
echo "Creating namespace..."
kubectl create namespace thinkcode --dry-run=client -o yaml | kubectl apply -f -

# Install NGINX Ingress Controller (optional, for production routing)
echo "Installing NGINX Ingress Controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for ingress controller
echo "Waiting for ingress controller to be ready..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s

# Deploy Redis
echo "Deploying Redis..."
kubectl apply -f k8s/redis/

# Deploy ConfigMaps and Secrets
echo "Deploying ConfigMaps and Secrets..."
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# Wait for Redis
echo "Waiting for Redis to be ready..."
kubectl wait --namespace thinkcode \
  --for=condition=ready pod \
  --selector=app=redis \
  --timeout=60s

echo "✅ Cluster setup complete!"