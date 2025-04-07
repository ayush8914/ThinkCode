#!/bin/bash

set -e

echo "📦 Deploying ThinkCode applications..."

# Deploy applications
kubectl apply -f k8s/judge-api/
kubectl apply -f k8s/judge-worker/
kubectl apply -f k8s/web/

# Wait for deployments
echo "Waiting for deployments to be ready..."
kubectl wait --namespace thinkcode \
  --for=condition=available \
  --selector=app=judge-api \
  --timeout=120s deployment

kubectl wait --namespace thinkcode \
  --for=condition=available \
  --selector=app=judge-worker \
  --timeout=120s deployment

kubectl wait --namespace thinkcode \
  --for=condition=available \
  --selector=app=web \
  --timeout=120s deployment

# Get service URLs
echo -e "\n✅ Deployment complete!"
echo -e "\n🌐 Access URLs:"
echo "Web Application: http://localhost:30000"
echo "Judge API: http://localhost:30001 (via port-forward)"
echo -e "\n📊 Monitoring Commands:"
echo "kubectl get pods -n thinkcode"
echo "kubectl logs -f -l app=judge-worker -n thinkcode"
echo "kubectl port-forward -n thinkcode svc/judge-api 3001:3001"