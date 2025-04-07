#!/bin/bash

# Port forward services for local access
echo "🔗 Setting up port forwarding..."

# Forward Judge API
kubectl port-forward -n thinkcode svc/judge-api 3001:3001 &
PID1=$!

# Forward Redis (optional, for debugging)
kubectl port-forward -n thinkcode svc/redis 6379:6379 &
PID2=$!

echo "✅ Port forwarding active!"
echo "Judge API: http://localhost:3001"
echo "Redis: localhost:6379"
echo ""
echo "Press Ctrl+C to stop all port forwards"

# Cleanup on exit
trap "kill $PID1 $PID2" EXIT

# Wait
wait