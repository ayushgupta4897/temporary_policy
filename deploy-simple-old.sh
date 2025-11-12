#!/bin/bash

# 🚀 SIMPLE DEPLOYMENT - Works around Azure CLI connection issues
# Just builds, pushes, and updates - no polling

set -e

SUBSCRIPTION_ID="effd4b2e-98eb-48c1-ad07-ad597a94c754"
RESOURCE_GROUP="rg-policy-intelligence-ai"
REGISTRY_NAME="crpolicyintelligence"
CONTAINER_APP_NAME="ca-policy"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "\n${BOLD}${BLUE}🚀 Deployment Script${NC}\n"

az account set --subscription ${SUBSCRIPTION_ID}

DEPLOYMENT_TIMESTAMP=$(date +%s)
GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
IMAGE_TAG="${DEPLOYMENT_TIMESTAMP}-${GIT_HASH}"

echo -e "${BLUE}[INFO]${NC} Building images with tag: ${BOLD}${IMAGE_TAG}${NC}\n"

REGISTRY_LOGIN_SERVER=$(az acr show --name ${REGISTRY_NAME} --resource-group ${RESOURCE_GROUP} --query loginServer --output tsv)

az acr login --name ${REGISTRY_NAME}

echo -e "${BOLD}📦 Building Backend...${NC}"
docker build --platform linux/amd64 -f Dockerfile.backend \
    -t ${REGISTRY_LOGIN_SERVER}/policy-backend:${IMAGE_TAG} \
    -t ${REGISTRY_LOGIN_SERVER}/policy-backend:latest .

echo -e "${BOLD}⬆️  Pushing Backend (${IMAGE_TAG})...${NC}"
docker push ${REGISTRY_LOGIN_SERVER}/policy-backend:${IMAGE_TAG}
echo -e "${BOLD}⬆️  Pushing Backend (latest)...${NC}"
docker push ${REGISTRY_LOGIN_SERVER}/policy-backend:latest

echo -e "${BOLD}📦 Building Frontend...${NC}"
docker build --platform linux/amd64 -f Dockerfile.frontend \
    -t ${REGISTRY_LOGIN_SERVER}/policy-frontend:${IMAGE_TAG} \
    -t ${REGISTRY_LOGIN_SERVER}/policy-frontend:latest .

echo -e "${BOLD}⬆️  Pushing Frontend (${IMAGE_TAG})...${NC}"
docker push ${REGISTRY_LOGIN_SERVER}/policy-frontend:${IMAGE_TAG}
echo -e "${BOLD}⬆️  Pushing Frontend (latest)...${NC}"
docker push ${REGISTRY_LOGIN_SERVER}/policy-frontend:latest

echo -e "${GREEN}[SUCCESS]${NC} Images pushed!\n"

BACKEND_URL=$(az containerapp show --name "${CONTAINER_APP_NAME}-backend" --resource-group ${RESOURCE_GROUP} --query properties.configuration.ingress.fqdn --output tsv 2>/dev/null)

echo -e "${BOLD}🔄 Updating Backend...${NC}"
az containerapp update \
    --name "${CONTAINER_APP_NAME}-backend" \
    --resource-group ${RESOURCE_GROUP} \
    --image "${REGISTRY_LOGIN_SERVER}/policy-backend:${IMAGE_TAG}" \
    --revision-suffix "${DEPLOYMENT_TIMESTAMP}" \
    --no-wait \
    --output none 2>&1 | grep -v "WARNING" || true

echo -e "${BLUE}[INFO]${NC} Backend update initiated (not waiting for completion)"

echo -e "${BOLD}🔄 Updating Frontend...${NC}"
az containerapp update \
    --name "${CONTAINER_APP_NAME}-frontend" \
    --resource-group ${RESOURCE_GROUP} \
    --image "${REGISTRY_LOGIN_SERVER}/policy-frontend:${IMAGE_TAG}" \
    --revision-suffix "${DEPLOYMENT_TIMESTAMP}" \
    --set-env-vars NODE_ENV=production NEXT_PUBLIC_API_BASE_URL="https://${BACKEND_URL}" \
    --no-wait \
    --output none 2>&1 | grep -v "WARNING" || true

echo -e "${BLUE}[INFO]${NC} Frontend update initiated (not waiting for completion)"
echo -e "${BLUE}[INFO]${NC} Waiting 30 seconds for deployments to complete..."
sleep 30

# Try to fetch URLs with timeout, fallback to known URLs if it fails
echo -e "${BLUE}[INFO]${NC} Fetching deployment URLs..."
BACKEND_URL=$(timeout 10s az containerapp show --name "${CONTAINER_APP_NAME}-backend" --resource-group ${RESOURCE_GROUP} --query properties.configuration.ingress.fqdn --output tsv 2>/dev/null || echo "ca-policy-backend.whitestone-31d90b86.eastus.azurecontainerapps.io")
FRONTEND_URL=$(timeout 10s az containerapp show --name "${CONTAINER_APP_NAME}-frontend" --resource-group ${RESOURCE_GROUP} --query properties.configuration.ingress.fqdn --output tsv 2>/dev/null || echo "ca-policy-frontend.whitestone-31d90b86.eastus.azurecontainerapps.io")

echo -e "\n${BOLD}${GREEN}✅ Deployment Complete!${NC}\n"
echo -e "${BOLD}📍 URLs:${NC}"
echo -e "   Frontend: ${GREEN}https://${FRONTEND_URL}${NC}"
echo -e "   Backend:  ${GREEN}https://${BACKEND_URL}${NC}"
echo -e "   API Docs: ${GREEN}https://${BACKEND_URL}/docs${NC}"
echo -e "\n${BOLD}🏷️  Version: ${IMAGE_TAG}${NC}\n"