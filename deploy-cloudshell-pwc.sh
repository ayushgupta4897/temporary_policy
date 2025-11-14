#!/bin/bash

# 🚀 CLOUD SHELL UPDATE DEPLOYMENT (EXISTING RESOURCES)
# Policy Intelligence Platform - Azure Container Apps
# For use when Azure resources already exist - just build & deploy
# Uses Azure Container Registry Build Tasks for image building

set -e  # Exit on any error

# ============================================================================
# LOAD CONFIGURATION FROM .env.azure
# ============================================================================
if [ ! -f ".env.azure" ]; then
    echo "❌ ERROR: .env.azure file not found!"
    echo "Please create .env.azure with your Azure configuration."
    echo "See .env.azure.example for template."
    exit 1
fi

# Load environment variables from .env.azure
set -a  # automatically export all variables
source .env.azure
set +a

# Map to script variables for compatibility
SUBSCRIPTION_ID="${AZURE_SUBSCRIPTION_ID}"
LOCATION="${AZURE_LOCATION}"
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP}"
REGISTRY_NAME="${AZURE_REGISTRY_NAME}"
ENVIRONMENT_NAME="${AZURE_ENVIRONMENT_NAME}"
BACKEND_APP_NAME="${AZURE_BACKEND_APP_NAME}"
FRONTEND_APP_NAME="${AZURE_FRONTEND_APP_NAME}"
STORAGE_ACCOUNT_NAME="${AZURE_STORAGE_ACCOUNT_NAME}"

# Validate required variables
if [ -z "$SUBSCRIPTION_ID" ] || [ -z "$OPENAI_API_KEY" ] || [ -z "$STORAGE_ACCOUNT_NAME" ]; then
    echo "❌ ERROR: Required variables not set in .env.azure"
    echo "Please ensure AZURE_SUBSCRIPTION_ID, AZURE_STORAGE_ACCOUNT_NAME, and OPENAI_API_KEY are set."
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}${BOLD}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}${BOLD}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}${BOLD}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}${BOLD}[ERROR]${NC} $1"
}

# Check prerequisites (Cloud Shell compatible)
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI is not installed."
        exit 1
    fi

    print_status "✓ Running in cloud-native mode (Azure Container Registry Build)"
    print_status "✓ No local Docker daemon required"

    # Check if logged into Azure
    if ! az account show &> /dev/null; then
        print_warning "Not logged into Azure. Please log in..."
        az login
    fi

    # Set the correct subscription
    print_status "Setting Azure subscription to: ${SUBSCRIPTION_ID}"
    az account set --subscription ${SUBSCRIPTION_ID}

    print_success "Prerequisites check completed!"
}

# Verify existing resources
verify_resources() {
    print_status "Verifying existing Azure resources..."

    # Check Resource Group
    if ! az group show --name ${RESOURCE_GROUP} &> /dev/null; then
        print_error "Resource Group '${RESOURCE_GROUP}' does not exist!"
        print_warning "Please create it first or run the full deploy-cloudshell.sh script"
        exit 1
    fi
    print_success "✓ Resource Group exists: ${RESOURCE_GROUP}"

    # Check Container Registry
    if ! az acr show --name ${REGISTRY_NAME} --resource-group ${RESOURCE_GROUP} &> /dev/null; then
        print_error "Container Registry '${REGISTRY_NAME}' does not exist!"
        print_warning "Please create it first or run the full deploy-cloudshell.sh script"
        exit 1
    fi
    print_success "✓ Container Registry exists: ${REGISTRY_NAME}"

    # Check Storage Account
    if ! az storage account show --name ${STORAGE_ACCOUNT_NAME} --resource-group ${RESOURCE_GROUP} &> /dev/null; then
        print_error "Storage Account '${STORAGE_ACCOUNT_NAME}' does not exist!"
        print_warning "Please create it first or run the full deploy-cloudshell.sh script"
        exit 1
    fi
    print_success "✓ Storage Account exists: ${STORAGE_ACCOUNT_NAME}"

    # Check Container Apps Environment
    if ! az containerapp env show --name ${ENVIRONMENT_NAME} --resource-group ${RESOURCE_GROUP} &> /dev/null; then
        print_error "Container Apps Environment '${ENVIRONMENT_NAME}' does not exist!"
        print_warning "Please create it first or run the full deploy-cloudshell.sh script"
        exit 1
    fi
    print_success "✓ Container Apps Environment exists: ${ENVIRONMENT_NAME}"

    # Get storage connection string
    print_status "Retrieving storage account connection string..."
    STORAGE_CONN_STRING=$(az storage account show-connection-string \
        --name ${STORAGE_ACCOUNT_NAME} \
        --resource-group ${RESOURCE_GROUP} \
        --output tsv)

    if [ -z "$STORAGE_CONN_STRING" ]; then
        print_error "Failed to retrieve storage connection string"
        exit 1
    fi
    export AZURE_STORAGE_CONNECTION_STRING="${STORAGE_CONN_STRING}"
    print_success "✓ Storage connection string retrieved"

    print_success "All required resources verified!"
}

# Build images using Azure Container Registry Build Tasks
build_images_with_acr() {
    print_status "Building Docker images using Azure Container Registry Build..."
    print_status "📝 Note: This builds images in the cloud - no local Docker needed!"

    # Generate unique deployment timestamp and git hash for image tags
    DEPLOYMENT_TIMESTAMP=$(date +%s)
    GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    IMAGE_TAG="${DEPLOYMENT_TIMESTAMP}-${GIT_HASH}"

    # Store image tag for later use in deployment
    export DOCKER_IMAGE_TAG="${IMAGE_TAG}"

    print_status "Image tag: ${IMAGE_TAG}"

    # Build backend image using ACR Build
    print_status "Building backend image in Azure Container Registry..."
    print_status "⏳ This may take 5-10 minutes..."
    az acr build \
        --registry ${REGISTRY_NAME} \
        --image policy-backend:${IMAGE_TAG} \
        --image policy-backend:latest \
        --file Dockerfile.backend \
        --platform linux/amd64 \
        . || {
        print_error "Backend image build failed"
        exit 1
    }
    print_success "Backend image built successfully!"

    # Get existing backend URL for frontend build (if backend already deployed)
    BACKEND_URL_FOR_BUILD=$(az containerapp show --name "${BACKEND_APP_NAME}" --resource-group ${RESOURCE_GROUP} --query properties.configuration.ingress.fqdn --output tsv 2>/dev/null || echo "")

    # Build frontend image using ACR Build with backend URL
    print_status "Building frontend image in Azure Container Registry..."
    print_status "⏳ This may take 5-10 minutes..."
    if [ ! -z "$BACKEND_URL_FOR_BUILD" ]; then
        print_status "Using backend URL for build: https://${BACKEND_URL_FOR_BUILD}"
        az acr build \
            --registry ${REGISTRY_NAME} \
            --image policy-frontend:${IMAGE_TAG} \
            --image policy-frontend:latest \
            --file Dockerfile.frontend \
            --build-arg BACKEND_URL="https://${BACKEND_URL_FOR_BUILD}" \
            --platform linux/amd64 \
            . || {
            print_error "Frontend image build failed"
            exit 1
        }
    else
        print_warning "Backend not deployed yet, building frontend without backend URL"
        print_warning "Backend URL will be set via runtime environment variable"
        az acr build \
            --registry ${REGISTRY_NAME} \
            --image policy-frontend:${IMAGE_TAG} \
            --image policy-frontend:latest \
            --file Dockerfile.frontend \
            --platform linux/amd64 \
            . || {
            print_error "Frontend image build failed"
            exit 1
        }
    fi
    print_success "Frontend image built successfully!"

    print_success "Docker images built successfully with tag: ${IMAGE_TAG}!"
}

# Deploy Container Apps
deploy_container_apps() {
    print_status "Deploying Container Apps..."

    # Generate unique deployment timestamp for revisions
    DEPLOYMENT_TIMESTAMP=$(date +%s)

    # Get registry credentials
    REGISTRY_LOGIN_SERVER=$(az acr show --name ${REGISTRY_NAME} --resource-group ${RESOURCE_GROUP} --query loginServer --output tsv)
    REGISTRY_USERNAME=$(az acr credential show --name ${REGISTRY_NAME} --resource-group ${RESOURCE_GROUP} --query username --output tsv)
    REGISTRY_PASSWORD=$(az acr credential show --name ${REGISTRY_NAME} --resource-group ${RESOURCE_GROUP} --query passwords[0].value --output tsv)

    # Deploy backend container app
    print_status "Deploying backend container app..."

    # Check if backend container app exists
    if az containerapp show --name "${BACKEND_APP_NAME}" --resource-group ${RESOURCE_GROUP} >/dev/null 2>&1; then
        # Update existing container app
        print_status "Updating existing backend container app with image tag: ${DOCKER_IMAGE_TAG}..."

        BACKEND_URL=$(az containerapp show --name "${BACKEND_APP_NAME}" --resource-group ${RESOURCE_GROUP} --query properties.configuration.ingress.fqdn --output tsv)

        az containerapp update \
            --name "${BACKEND_APP_NAME}" \
            --resource-group ${RESOURCE_GROUP} \
            --image "${REGISTRY_LOGIN_SERVER}/policy-backend:${DOCKER_IMAGE_TAG}" \
            --revision-suffix "${DEPLOYMENT_TIMESTAMP}" \
            --set-env-vars BACKEND_URL="https://${BACKEND_URL}" \
            --output none

        print_success "Backend updated successfully!"
    else
        # Create new container app
        print_status "Creating new backend container app..."

        BACKEND_CPU="${BACKEND_CPU:-2.0}"
        BACKEND_MEMORY="${BACKEND_MEMORY:-4.0Gi}"
        BACKEND_MIN_REPLICAS="${BACKEND_MIN_REPLICAS:-1}"
        BACKEND_MAX_REPLICAS="${BACKEND_MAX_REPLICAS:-10}"

        az containerapp create \
            --name "${BACKEND_APP_NAME}" \
            --resource-group ${RESOURCE_GROUP} \
            --environment ${ENVIRONMENT_NAME} \
            --image "${REGISTRY_LOGIN_SERVER}/policy-backend:latest" \
            --registry-server ${REGISTRY_LOGIN_SERVER} \
            --registry-username ${REGISTRY_USERNAME} \
            --registry-password ${REGISTRY_PASSWORD} \
            --target-port 8000 \
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
            --output none

        print_success "Backend created successfully!"
    fi

    # Get backend URL
    BACKEND_URL=$(az containerapp show --name "${BACKEND_APP_NAME}" --resource-group ${RESOURCE_GROUP} --query properties.configuration.ingress.fqdn --output tsv)
    print_success "Backend URL: https://${BACKEND_URL}"

    # Deploy frontend container app
    print_status "Deploying frontend container app..."

    # Check if frontend container app exists
    if az containerapp show --name "${FRONTEND_APP_NAME}" --resource-group ${RESOURCE_GROUP} >/dev/null 2>&1; then
        # Update existing container app
        print_status "Updating existing frontend container app with image tag: ${DOCKER_IMAGE_TAG}..."

        az containerapp update \
            --name "${FRONTEND_APP_NAME}" \
            --resource-group ${RESOURCE_GROUP} \
            --image "${REGISTRY_LOGIN_SERVER}/policy-frontend:${DOCKER_IMAGE_TAG}" \
            --revision-suffix "${DEPLOYMENT_TIMESTAMP}" \
            --set-env-vars NODE_ENV=production NEXT_PUBLIC_API_BASE_URL="https://${BACKEND_URL}" \
            --output none

        print_success "Frontend updated successfully!"
    else
        # Create new container app
        print_status "Creating new frontend container app..."

        FRONTEND_CPU="${FRONTEND_CPU:-1.0}"
        FRONTEND_MEMORY="${FRONTEND_MEMORY:-2.0Gi}"
        FRONTEND_MIN_REPLICAS="${FRONTEND_MIN_REPLICAS:-1}"
        FRONTEND_MAX_REPLICAS="${FRONTEND_MAX_REPLICAS:-5}"

        az containerapp create \
            --name "${FRONTEND_APP_NAME}" \
            --resource-group ${RESOURCE_GROUP} \
            --environment ${ENVIRONMENT_NAME} \
            --image "${REGISTRY_LOGIN_SERVER}/policy-frontend:latest" \
            --registry-server ${REGISTRY_LOGIN_SERVER} \
            --registry-username ${REGISTRY_USERNAME} \
            --registry-password ${REGISTRY_PASSWORD} \
            --target-port 3000 \
            --ingress external \
            --min-replicas ${FRONTEND_MIN_REPLICAS} \
            --max-replicas ${FRONTEND_MAX_REPLICAS} \
            --cpu ${FRONTEND_CPU} \
            --memory ${FRONTEND_MEMORY} \
            --env-vars NODE_ENV=production NEXT_PUBLIC_API_BASE_URL="https://${BACKEND_URL}" \
            --output none

        print_success "Frontend created successfully!"
    fi

    print_success "Container Apps deployed successfully!"
}

# Get deployment URLs and update backend with CORS configuration
get_deployment_urls() {
    print_status "Getting deployment URLs..."

    FRONTEND_URL=$(az containerapp show --name "${FRONTEND_APP_NAME}" --resource-group ${RESOURCE_GROUP} --query properties.configuration.ingress.fqdn --output tsv)
    BACKEND_URL=$(az containerapp show --name "${BACKEND_APP_NAME}" --resource-group ${RESOURCE_GROUP} --query properties.configuration.ingress.fqdn --output tsv)

    # Update .env.azure with discovered URLs
    if [ ! -z "$BACKEND_URL" ]; then
        if grep -q "^BACKEND_URL=" .env.azure 2>/dev/null; then
            sed -i.bak "s|^BACKEND_URL=.*|BACKEND_URL=\"https://${BACKEND_URL}\"|" .env.azure && rm -f .env.azure.bak
        else
            echo "" >> .env.azure
            echo "# Auto-discovered URLs (updated by deploy-cloudshell-update.sh)" >> .env.azure
            echo "BACKEND_URL=\"https://${BACKEND_URL}\"" >> .env.azure
        fi
    fi

    if [ ! -z "$FRONTEND_URL" ]; then
        if grep -q "^FRONTEND_URL=" .env.azure 2>/dev/null; then
            sed -i.bak "s|^FRONTEND_URL=.*|FRONTEND_URL=\"https://${FRONTEND_URL}\"|" .env.azure && rm -f .env.azure.bak
        else
            echo "FRONTEND_URL=\"https://${FRONTEND_URL}\"" >> .env.azure
        fi
    fi

    # Update backend with FRONTEND_URL for CORS
    if [ ! -z "$FRONTEND_URL" ]; then
        print_status "Updating backend CORS configuration with frontend URL..."
        az containerapp update \
            --name "${BACKEND_APP_NAME}" \
            --resource-group ${RESOURCE_GROUP} \
            --set-env-vars FRONTEND_URL="https://${FRONTEND_URL}" \
            --output none
        print_success "Backend CORS configured for frontend: https://${FRONTEND_URL}"
    fi

    echo ""
    echo "🎉 ${BOLD}${GREEN}DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
    echo ""
    echo "${BOLD}🌐 Your Policy Intelligence Platform is live:${NC}"
    echo ""
    echo "   ${BOLD}Frontend:${NC} https://${FRONTEND_URL}"
    echo "   ${BOLD}Backend:${NC}  https://${BACKEND_URL}"
    echo "   ${BOLD}API Docs:${NC} https://${BACKEND_URL}/docs"
    echo ""
    echo "${BOLD}📊 Azure Resources:${NC}"
    echo "   Resource Group: ${RESOURCE_GROUP}"
    echo "   Container Registry: ${REGISTRY_NAME}"
    echo ""
    echo "${BOLD}💡 Next Steps:${NC}"
    echo "   1. Visit https://${FRONTEND_URL} to access the platform"
    echo "   2. Test API at https://${BACKEND_URL}/health"
    echo ""
}

# Main deployment function
main() {
    echo ""
    echo "${BOLD}${BLUE}🚀 Policy Intelligence Platform - Update Deployment${NC}"
    echo "${BOLD}${BLUE}   (Using Existing Azure Resources)${NC}"
    echo "${BOLD}${BLUE}   Subscription: ${SUBSCRIPTION_ID}${NC}"
    echo "${BOLD}${BLUE}   Resource Group: ${RESOURCE_GROUP}${NC}"
    echo ""

    # Main deployment flow
    check_prerequisites
    verify_resources
    build_images_with_acr
    deploy_container_apps
    get_deployment_urls

    # Show deployment details
    if [ ! -z "${DOCKER_IMAGE_TAG:-}" ]; then
        echo ""
        echo -e "${BOLD}🔖 Deployment Details:${NC}"
        echo "   Image Tag: ${DOCKER_IMAGE_TAG}"
        echo "   Revision Timestamp: ${DEPLOYMENT_TIMESTAMP:-$(date +%s)}"
    fi

    echo ""
    echo "${GREEN}${BOLD}✨ Deployment completed!${NC}"
    echo ""
}

# Handle script interruption
trap 'print_error "Deployment interrupted."; exit 1' INT

# Run main function
main "$@"
