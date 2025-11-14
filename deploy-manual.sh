#!/bin/bash

# ============================================================================
# MANUAL STEP-BY-STEP AZURE DEPLOYMENT
# Policy Intelligence Platform - Strategy& PWC
# ============================================================================
# This script allows manual deployment in phases:
# 1. Create infrastructure
# 2. Deploy backend (get URL)
# 3. Deploy frontend (with backend URL)
# ============================================================================

set -e

# Load configuration
if [ ! -f ".env.azure" ]; then
    echo "❌ ERROR: .env.azure file not found!"
    exit 1
fi

set -a
source .env.azure
set +a

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

# Helper functions
print_header() {
    echo -e "\n${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${BLUE}$1${NC}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_step() {
    echo -e "${GREEN}${BOLD}▶${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# ============================================================================
# STEP 1: CREATE INFRASTRUCTURE
# ============================================================================
step1_create_infrastructure() {
    print_header "STEP 1: Creating Azure Infrastructure"

    print_step "Setting Azure subscription..."
    az account set --subscription ${AZURE_SUBSCRIPTION_ID}
    print_success "Subscription set: ${AZURE_SUBSCRIPTION_ID}"

    print_step "Creating Resource Group..."
    az group create \
        --name ${AZURE_RESOURCE_GROUP} \
        --location ${AZURE_LOCATION} \
        --output none || print_warning "Resource group may already exist"
    print_success "Resource Group: ${AZURE_RESOURCE_GROUP}"

    print_step "Creating Storage Account..."
    az storage account create \
        --name ${AZURE_STORAGE_ACCOUNT_NAME} \
        --resource-group ${AZURE_RESOURCE_GROUP} \
        --location ${AZURE_LOCATION} \
        --sku Standard_LRS \
        --kind StorageV2 \
        --output none || print_warning "Storage account may already exist"
    print_success "Storage Account: ${AZURE_STORAGE_ACCOUNT_NAME}"

    print_step "Retrieving storage connection string..."
    STORAGE_CONN_STRING=$(az storage account show-connection-string \
        --name ${AZURE_STORAGE_ACCOUNT_NAME} \
        --resource-group ${AZURE_RESOURCE_GROUP} \
        --output tsv)

    if [ ! -z "$STORAGE_CONN_STRING" ]; then
        if grep -q "^AZURE_STORAGE_CONNECTION_STRING=" .env.azure 2>/dev/null; then
            sed -i.bak "s|^AZURE_STORAGE_CONNECTION_STRING=.*|AZURE_STORAGE_CONNECTION_STRING=\"${STORAGE_CONN_STRING}\"|" .env.azure && rm .env.azure.bak
            print_success "Updated .env.azure with storage connection string"
        fi
        export AZURE_STORAGE_CONNECTION_STRING="${STORAGE_CONN_STRING}"
    fi

    print_step "Creating Container Registry..."
    az acr create \
        --resource-group ${AZURE_RESOURCE_GROUP} \
        --name ${AZURE_REGISTRY_NAME} \
        --sku Basic \
        --admin-enabled true \
        --output none || print_warning "Registry may already exist"
    print_success "Container Registry: ${AZURE_REGISTRY_NAME}"

    print_step "Creating Container Apps Environment..."
    az containerapp env create \
        --name ${AZURE_ENVIRONMENT_NAME} \
        --resource-group ${AZURE_RESOURCE_GROUP} \
        --location ${AZURE_LOCATION} \
        --output none || print_warning "Environment may already exist"
    print_success "Container Apps Environment: ${AZURE_ENVIRONMENT_NAME}"

    print_header "✅ INFRASTRUCTURE CREATED SUCCESSFULLY"
    echo ""
    echo "Resources created:"
    echo "  • Resource Group: ${AZURE_RESOURCE_GROUP}"
    echo "  • Storage Account: ${AZURE_STORAGE_ACCOUNT_NAME}"
    echo "  • Container Registry: ${AZURE_REGISTRY_NAME}"
    echo "  • Container Environment: ${AZURE_ENVIRONMENT_NAME}"
    echo ""
}

# ============================================================================
# STEP 2: BUILD AND DEPLOY BACKEND
# ============================================================================
step2_deploy_backend() {
    print_header "STEP 2: Building and Deploying Backend"

    # Generate image tag
    DEPLOYMENT_TIMESTAMP=$(date +%s)
    GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    IMAGE_TAG="${DEPLOYMENT_TIMESTAMP}-${GIT_HASH}"

    print_info "Image tag: ${IMAGE_TAG}"

    # Get registry login server
    REGISTRY_LOGIN_SERVER=$(az acr show \
        --name ${AZURE_REGISTRY_NAME} \
        --resource-group ${AZURE_RESOURCE_GROUP} \
        --query loginServer \
        --output tsv)

    print_step "Logging into Container Registry..."
    az acr login --name ${AZURE_REGISTRY_NAME}
    print_success "Logged in to ${REGISTRY_LOGIN_SERVER}"

    print_step "Building backend Docker image..."
    docker build --platform linux/amd64 -f Dockerfile.backend \
        -t ${REGISTRY_LOGIN_SERVER}/policy-backend:${IMAGE_TAG} \
        -t ${REGISTRY_LOGIN_SERVER}/policy-backend:latest .
    print_success "Backend image built"

    print_step "Pushing backend image to registry..."
    docker push ${REGISTRY_LOGIN_SERVER}/policy-backend:${IMAGE_TAG}
    docker push ${REGISTRY_LOGIN_SERVER}/policy-backend:latest
    print_success "Backend image pushed"

    print_step "Deploying backend container app..."
    print_info "CPU: ${BACKEND_CPU}, Memory: ${BACKEND_MEMORY}"

    # Get registry credentials
    REGISTRY_USERNAME=$(az acr credential show --name ${AZURE_REGISTRY_NAME} --query username --output tsv)
    REGISTRY_PASSWORD=$(az acr credential show --name ${AZURE_REGISTRY_NAME} --query "passwords[0].value" --output tsv)

    # Check if container app exists
    if az containerapp show --name "${AZURE_CONTAINER_APP_NAME}-backend" \
        --resource-group ${AZURE_RESOURCE_GROUP} &>/dev/null; then

        print_info "Updating existing backend container app..."
        az containerapp update \
            --name "${AZURE_CONTAINER_APP_NAME}-backend" \
            --resource-group ${AZURE_RESOURCE_GROUP} \
            --image ${REGISTRY_LOGIN_SERVER}/policy-backend:${IMAGE_TAG} \
            --set-env-vars AZURE_STORAGE_CONNECTION_STRING=secretref:azure-storage-connection \
                          OPENAI_API_KEY=secretref:openai-api-key \
                          POLICY_DRAFTER_PASSWORD="${POLICY_DRAFTER_PASSWORD}" \
                          PYTHONUNBUFFERED="1" \
            --no-wait \
            --output none
    else
        print_info "Creating new backend container app..."
        az containerapp create \
            --name "${AZURE_CONTAINER_APP_NAME}-backend" \
            --resource-group ${AZURE_RESOURCE_GROUP} \
            --environment ${AZURE_ENVIRONMENT_NAME} \
            --image ${REGISTRY_LOGIN_SERVER}/policy-backend:latest \
            --target-port ${BACKEND_PORT} \
            --ingress external \
            --min-replicas ${BACKEND_MIN_REPLICAS} \
            --max-replicas ${BACKEND_MAX_REPLICAS} \
            --cpu ${BACKEND_CPU} \
            --memory ${BACKEND_MEMORY} \
            --secrets azure-storage-connection="${AZURE_STORAGE_CONNECTION_STRING}" \
                     openai-api-key="${OPENAI_API_KEY}" \
            --env-vars AZURE_STORAGE_CONNECTION_STRING=secretref:azure-storage-connection \
                      OPENAI_API_KEY=secretref:openai-api-key \
                      POLICY_DRAFTER_PASSWORD="${POLICY_DRAFTER_PASSWORD}" \
                      PYTHONUNBUFFERED="1" \
            --registry-server ${REGISTRY_LOGIN_SERVER} \
            --registry-username ${REGISTRY_USERNAME} \
            --registry-password ${REGISTRY_PASSWORD} \
            --no-wait \
            --output none
    fi

    print_info "Backend deployment initiated (running in background)"
    print_info "Waiting for backend to be ready..."
    sleep 30  # Give it time to start provisioning

    print_step "Retrieving backend URL..."
    BACKEND_URL=$(az containerapp show \
        --name "${AZURE_CONTAINER_APP_NAME}-backend" \
        --resource-group ${AZURE_RESOURCE_GROUP} \
        --query properties.configuration.ingress.fqdn \
        --output tsv)

    # Configure BACKEND_URL on the backend container itself (for HTML visualization generation)
    if [ ! -z "$BACKEND_URL" ]; then
        print_step "Configuring BACKEND_URL environment variable on backend container..."
        az containerapp update \
            --name "${AZURE_CONTAINER_APP_NAME}-backend" \
            --resource-group ${AZURE_RESOURCE_GROUP} \
            --set-env-vars BACKEND_URL="https://${BACKEND_URL}" \
            --output none
        print_success "Backend URL configured: https://${BACKEND_URL}"
    fi

    print_header "✅ BACKEND DEPLOYED SUCCESSFULLY"
    echo ""
    echo -e "${BOLD}Backend URL:${NC} ${GREEN}https://${BACKEND_URL}${NC}"
    echo -e "${BOLD}API Docs:${NC}    ${GREEN}https://${BACKEND_URL}/docs${NC}"
    echo -e "${BOLD}Health:${NC}      ${GREEN}https://${BACKEND_URL}/health${NC}"
    echo ""

    # Update .env.azure with backend URL
    if [ ! -z "$BACKEND_URL" ]; then
        if grep -q "^BACKEND_URL=" .env.azure 2>/dev/null; then
            sed -i.bak "s|^BACKEND_URL=.*|BACKEND_URL=\"https://${BACKEND_URL}\"|" .env.azure && rm .env.azure.bak
        else
            echo "" >> .env.azure
            echo "# Auto-discovered backend URL" >> .env.azure
            echo "BACKEND_URL=\"https://${BACKEND_URL}\"" >> .env.azure
        fi
        print_success "Updated .env.azure with backend URL"
    fi

    # Export for next step
    export BACKEND_URL_FULL="https://${BACKEND_URL}"

    print_warning "⏸  Pausing before frontend deployment..."
    echo ""
    echo "Backend is now deployed. Before deploying frontend:"
    echo "1. Test backend health: curl https://${BACKEND_URL}/health"
    echo "2. Check backend logs if needed"
    echo "3. When ready, run: $0 step3"
    echo ""
}

# ============================================================================
# STEP 3: BUILD AND DEPLOY FRONTEND
# ============================================================================
step3_deploy_frontend() {
    print_header "STEP 3: Building and Deploying Frontend"

    # Reload .env.azure to get updated BACKEND_URL
    set -a
    source .env.azure
    set +a

    if [ -z "$BACKEND_URL" ]; then
        print_error "Backend URL not found in .env.azure!"
        print_info "Please run step2 first or manually set BACKEND_URL in .env.azure"
        exit 1
    fi

    print_info "Backend URL: ${BACKEND_URL}"

    # Generate image tag
    DEPLOYMENT_TIMESTAMP=$(date +%s)
    GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    IMAGE_TAG="${DEPLOYMENT_TIMESTAMP}-${GIT_HASH}"

    print_info "Image tag: ${IMAGE_TAG}"

    # Get registry login server
    REGISTRY_LOGIN_SERVER=$(az acr show \
        --name ${AZURE_REGISTRY_NAME} \
        --resource-group ${AZURE_RESOURCE_GROUP} \
        --query loginServer \
        --output tsv)

    print_step "Logging into Container Registry..."
    az acr login --name ${AZURE_REGISTRY_NAME}

    print_step "Building frontend Docker image with backend URL..."
    docker build --platform linux/amd64 -f Dockerfile.frontend \
        --build-arg BACKEND_URL="${BACKEND_URL}" \
        -t ${REGISTRY_LOGIN_SERVER}/policy-frontend:${IMAGE_TAG} \
        -t ${REGISTRY_LOGIN_SERVER}/policy-frontend:latest .
    print_success "Frontend image built"

    print_step "Pushing frontend image to registry..."
    docker push ${REGISTRY_LOGIN_SERVER}/policy-frontend:${IMAGE_TAG}
    docker push ${REGISTRY_LOGIN_SERVER}/policy-frontend:latest
    print_success "Frontend image pushed"

    print_step "Deploying frontend container app..."
    print_info "CPU: ${FRONTEND_CPU}, Memory: ${FRONTEND_MEMORY}"

    # Get registry credentials
    REGISTRY_USERNAME=$(az acr credential show --name ${AZURE_REGISTRY_NAME} --query username --output tsv)
    REGISTRY_PASSWORD=$(az acr credential show --name ${AZURE_REGISTRY_NAME} --query "passwords[0].value" --output tsv)

    # Check if container app exists
    if az containerapp show --name "${AZURE_CONTAINER_APP_NAME}-frontend" \
        --resource-group ${AZURE_RESOURCE_GROUP} &>/dev/null; then

        print_info "Updating existing frontend container app..."
        az containerapp update \
            --name "${AZURE_CONTAINER_APP_NAME}-frontend" \
            --resource-group ${AZURE_RESOURCE_GROUP} \
            --image ${REGISTRY_LOGIN_SERVER}/policy-frontend:${IMAGE_TAG} \
            --set-env-vars NEXT_PUBLIC_API_BASE_URL="${BACKEND_URL}" \
            --no-wait \
            --output none
    else
        print_info "Creating new frontend container app..."
        az containerapp create \
            --name "${AZURE_CONTAINER_APP_NAME}-frontend" \
            --resource-group ${AZURE_RESOURCE_GROUP} \
            --environment ${AZURE_ENVIRONMENT_NAME} \
            --image ${REGISTRY_LOGIN_SERVER}/policy-frontend:latest \
            --target-port ${FRONTEND_PORT} \
            --ingress external \
            --min-replicas ${FRONTEND_MIN_REPLICAS} \
            --max-replicas ${FRONTEND_MAX_REPLICAS} \
            --cpu ${FRONTEND_CPU} \
            --memory ${FRONTEND_MEMORY} \
            --env-vars NODE_ENV="production" \
                      NEXT_PUBLIC_API_BASE_URL="${BACKEND_URL}" \
            --registry-server ${REGISTRY_LOGIN_SERVER} \
            --registry-username ${REGISTRY_USERNAME} \
            --registry-password ${REGISTRY_PASSWORD} \
            --no-wait \
            --output none
    fi

    print_info "Frontend deployment initiated (running in background)"
    print_info "Waiting for frontend to be ready..."
    sleep 30  # Give it time to start provisioning

    print_step "Retrieving frontend URL..."
    FRONTEND_URL=$(az containerapp show \
        --name "${AZURE_CONTAINER_APP_NAME}-frontend" \
        --resource-group ${AZURE_RESOURCE_GROUP} \
        --query properties.configuration.ingress.fqdn \
        --output tsv)

    print_header "🎉 DEPLOYMENT INITIATED SUCCESSFULLY!"
    echo ""
    echo -e "${BOLD}⏳ Deployments are running in the background to avoid timeout issues.${NC}"
    echo -e "${BOLD}   It may take 2-3 minutes for the apps to be fully ready.${NC}"
    echo ""
    echo -e "${BOLD}🌐 Your Policy Intelligence Platform URLs:${NC}"
    echo ""
    echo -e "  ${BOLD}Frontend:${NC}  ${GREEN}https://${FRONTEND_URL}${NC}"
    echo -e "  ${BOLD}Backend:${NC}   ${GREEN}${BACKEND_URL}${NC}"
    echo -e "  ${BOLD}API Docs:${NC}  ${GREEN}${BACKEND_URL}/docs${NC}"
    echo ""
    echo -e "${BOLD}📊 Azure Resources:${NC}"
    echo "  Subscription: ${AZURE_SUBSCRIPTION_ID}"
    echo "  Resource Group: ${AZURE_RESOURCE_GROUP}"
    echo "  Location: ${AZURE_LOCATION}"
    echo ""
    echo -e "${BOLD}💡 Next Steps:${NC}"
    echo "  1. Wait 2-3 minutes for deployments to complete"
    echo "  2. Test backend health: curl ${BACKEND_URL}/health"
    echo "  3. Visit your frontend URL to access the platform"
    echo "  4. View deployment status: az containerapp show --name ca-policy-backend --resource-group ${AZURE_RESOURCE_GROUP}"
    echo "  5. View logs: az containerapp logs show --name ca-policy-backend --resource-group ${AZURE_RESOURCE_GROUP} --follow"
    echo ""
}

# ============================================================================
# STEP 4: VIEW STATUS
# ============================================================================
step4_status() {
    print_header "Current Deployment Status"

    echo -e "${BOLD}Resource Group:${NC}"
    az group show --name ${AZURE_RESOURCE_GROUP} -o table 2>/dev/null || echo "Not found"

    echo -e "\n${BOLD}Storage Account:${NC}"
    az storage account show --name ${AZURE_STORAGE_ACCOUNT_NAME} --resource-group ${AZURE_RESOURCE_GROUP} -o table 2>/dev/null || echo "Not found"

    echo -e "\n${BOLD}Container Apps:${NC}"
    az containerapp list --resource-group ${AZURE_RESOURCE_GROUP} -o table 2>/dev/null || echo "Not found"

    echo -e "\n${BOLD}Backend URL:${NC}"
    BACKEND_URL=$(az containerapp show --name "${AZURE_CONTAINER_APP_NAME}-backend" --resource-group ${AZURE_RESOURCE_GROUP} --query properties.configuration.ingress.fqdn --output tsv 2>/dev/null)
    if [ ! -z "$BACKEND_URL" ]; then
        echo "https://${BACKEND_URL}"
    else
        echo "Not deployed yet"
    fi

    echo -e "\n${BOLD}Frontend URL:${NC}"
    FRONTEND_URL=$(az containerapp show --name "${AZURE_CONTAINER_APP_NAME}-frontend" --resource-group ${AZURE_RESOURCE_GROUP} --query properties.configuration.ingress.fqdn --output tsv 2>/dev/null)
    if [ ! -z "$FRONTEND_URL" ]; then
        echo "https://${FRONTEND_URL}"
    else
        echo "Not deployed yet"
    fi
}

# ============================================================================
# MAIN MENU
# ============================================================================
show_menu() {
    print_header "Manual Azure Deployment - Policy Intelligence Platform"
    echo ""
    echo "Choose a deployment step:"
    echo ""
    echo "  1) Create Infrastructure (Resource Group, Storage, Registry, Environment)"
    echo "  2) Deploy Backend (and get backend URL)"
    echo "  3) Deploy Frontend (requires backend URL from step 2)"
    echo "  4) View Current Status"
    echo "  5) Run All Steps (1 → 2 → 3)"
    echo ""
    echo "  q) Quit"
    echo ""
}

# Main execution
case "${1}" in
    step1|1)
        step1_create_infrastructure
        ;;
    step2|2)
        step2_deploy_backend
        ;;
    step3|3)
        step3_deploy_frontend
        ;;
    step4|status|4)
        step4_status
        ;;
    all|5)
        step1_create_infrastructure
        echo ""
        read -p "Press Enter to continue to backend deployment..."
        step2_deploy_backend
        echo ""
        read -p "Press Enter to continue to frontend deployment..."
        step3_deploy_frontend
        ;;
    *)
        show_menu
        read -p "Select option: " choice
        case $choice in
            1) step1_create_infrastructure ;;
            2) step2_deploy_backend ;;
            3) step3_deploy_frontend ;;
            4) step4_status ;;
            5) $0 all ;;
            q|Q) exit 0 ;;
            *) echo "Invalid option" ;;
        esac
        ;;
esac
