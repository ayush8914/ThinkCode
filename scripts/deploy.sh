#!/bin/bash

set -e

#creating cluster
echo "Creating Kubernetes cluster with kind..."
kind create cluster --name thinkcode --config k8s/kind/kind-config.yml
echo "Cluster created successfully."


#deploying redis
echo "Deploying Redis..."
kubectl apply -f k8s/redis/redis-configmap.yml
kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.26/deploy/local-path-storage.yaml
kubectl patch storageclass local-path -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
kubectl patch storageclass standard -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"false"}}}'
kubectl apply -f k8s/redis/redis-pvc.yml
kubectl apply -f k8s/redis/redis-deployment.yml
kubectl apply -f k8s/redis/redis-service.yml
kubectl get pvc redis-pvc
echo "Redis deployed successfully."


#deploying postgres
echo "Deploying PostgreSQL..."
kubectl apply -f k8s/postgres/postgres-all.yml
kubectl get pvc postgres-pvc
echo "PostgreSQL deployed successfully."


#deploying judge-api
echo "Deploying Judge API..."
kubectl apply -f k8s/judge-api/deployment.yml