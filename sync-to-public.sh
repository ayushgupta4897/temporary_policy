#!/bin/bash

# 🔄 SYNC TO PUBLIC REPOSITORY
# Automated script to sanitize code and sync to public intermediate repository
# for deployment in PWC restricted environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
PUBLIC_REPO_URL="${PUBLIC_REPO_URL:-}"  # Set via env var or pass as argument
TEMP_DIR="/tmp/newscrape-public-sync"

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

# Print banner
print_banner() {
    echo ""
    echo "${BOLD}${BLUE}🔄 Sync to Public Repository${NC}"
    echo "${BOLD}${BLUE}   Policy Intelligence Platform - Code Sanitization${NC}"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check if git is installed
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install it first."
        exit 1
    fi

    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository. Please run this from the project root."
        exit 1
    fi

    # Check if public repo URL is set
    if [ -z "$PUBLIC_REPO_URL" ]; then
        print_warning "PUBLIC_REPO_URL not set."
        echo ""
        echo "Usage:"
        echo "  export PUBLIC_REPO_URL=https://github.com/yourusername/newscrape-public.git"
        echo "  ./sync-to-public.sh"
        echo ""
        echo "Or pass as argument:"
        echo "  ./sync-to-public.sh https://github.com/yourusername/newscrape-public.git"
        echo ""
        read -p "Enter public repository URL: " PUBLIC_REPO_URL
        if [ -z "$PUBLIC_REPO_URL" ]; then
            print_error "Public repository URL is required"
            exit 1
        fi
    fi

    print_success "Prerequisites check completed!"
}

# Verify no uncommitted changes
verify_clean_state() {
    print_status "Checking git status..."

    if [ -n "$(git status --porcelain)" ]; then
        print_warning "You have uncommitted changes in your working directory."
        echo ""
        git status --short
        echo ""
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Aborted. Please commit or stash your changes first."
            exit 1
        fi
    fi
}

# Create temporary directory and copy files
prepare_clean_copy() {
    print_status "Creating clean copy of repository..."

    # Remove existing temp directory if it exists
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi

    # Create temp directory
    mkdir -p "$TEMP_DIR"

    # Copy entire repository to temp directory (excluding .git)
    print_status "Copying files to temporary directory..."
    rsync -av --progress \
        --exclude='.git' \
        --exclude='.env.azure' \
        --exclude='.env.pwc-*' \
        --exclude='.env.local' \
        --exclude='.env.production' \
        --exclude='.env.development' \
        --exclude='*.env' \
        --exclude='node_modules/' \
        --exclude='venv/' \
        --exclude='venv12/' \
        --exclude='__pycache__/' \
        --exclude='.DS_Store' \
        --exclude='output/' \
        --exclude='graph_outputs/' \
        --exclude='contextual_search_outputs/' \
        --exclude='impact_analysis_outputs/' \
        --exclude='foresight_radar_outputs/' \
        --exclude='*.log' \
        --exclude='.*.pid' \
        --exclude='frontend/.next/' \
        --exclude='screenshots/' \
        --exclude='.claude/' \
        ./ "$TEMP_DIR/"

    print_success "Clean copy created at: $TEMP_DIR"
}

# Verify sensitive files are not present
verify_no_secrets() {
    print_status "Verifying no secrets in sanitized copy..."

    SECRETS_FOUND=0

    # Check for common secret patterns
    if grep -r "sk-proj-" "$TEMP_DIR" 2>/dev/null | grep -v ".git" | grep -v "node_modules" | grep -v ".example"; then
        print_error "Found potential OpenAI API key in code!"
        SECRETS_FOUND=1
    fi

    if grep -r "AccountKey=" "$TEMP_DIR" 2>/dev/null | grep -v ".git" | grep -v "node_modules" | grep -v ".example"; then
        print_error "Found potential Azure Storage key in code!"
        SECRETS_FOUND=1
    fi

    # Check if .env.azure exists (should not)
    if [ -f "$TEMP_DIR/.env.azure" ]; then
        print_error "Found .env.azure in sanitized copy (should be excluded)!"
        SECRETS_FOUND=1
    fi

    # Check if config/app_config.py has hardcoded secrets
    if [ -f "$TEMP_DIR/config/app_config.py" ]; then
        if grep -q "sk-proj-" "$TEMP_DIR/config/app_config.py"; then
            print_error "Found hardcoded API key in config/app_config.py!"
            SECRETS_FOUND=1
        fi
    fi

    if [ $SECRETS_FOUND -eq 1 ]; then
        print_error "❌ Secrets found in sanitized copy. Aborting."
        print_warning "Please ensure all hardcoded secrets are removed before syncing."
        exit 1
    fi

    print_success "✅ No secrets found in sanitized copy"
}

# Initialize or update public repository
sync_to_public_repo() {
    print_status "Syncing to public repository..."

    cd "$TEMP_DIR"

    # Initialize git if not already
    if [ ! -d ".git" ]; then
        git init
        print_success "Initialized git repository"
    fi

    # Add all files
    git add -A

    # Create commit
    COMMIT_MESSAGE="Sanitized sync from source repository - $(date '+%Y-%m-%d %H:%M:%S')"
    if git diff --staged --quiet; then
        print_warning "No changes to commit"
    else
        git commit -m "$COMMIT_MESSAGE"
        print_success "Created commit: $COMMIT_MESSAGE"
    fi

    # Add or update remote
    if git remote | grep -q "^origin$"; then
        git remote set-url origin "$PUBLIC_REPO_URL"
        print_status "Updated remote origin to: $PUBLIC_REPO_URL"
    else
        git remote add origin "$PUBLIC_REPO_URL"
        print_success "Added remote origin: $PUBLIC_REPO_URL"
    fi

    # Push to public repo
    print_status "Pushing to public repository..."
    print_warning "You may be prompted for credentials..."

    # Try to push (may require authentication)
    if git push -u origin master --force; then
        print_success "✅ Successfully pushed to public repository!"
    else
        print_warning "Push failed. Trying 'main' branch instead of 'master'..."
        if git push -u origin main --force 2>/dev/null || git push -u origin HEAD:main --force; then
            print_success "✅ Successfully pushed to public repository (main branch)!"
        else
            print_error "Failed to push to public repository."
            print_warning "You may need to manually push from: $TEMP_DIR"
            exit 1
        fi
    fi

    cd - > /dev/null
}

# Cleanup
cleanup_temp() {
    print_status "Cleaning up temporary directory..."
    rm -rf "$TEMP_DIR"
    print_success "Cleanup completed"
}

# Show next steps
show_next_steps() {
    echo ""
    echo "${BOLD}${GREEN}✨ Sync completed successfully!${NC}"
    echo ""
    echo "${BOLD}📋 Next steps for PWC Cloud Shell deployment:${NC}"
    echo ""
    echo "   1. Access your PWC VM / Azure Cloud Shell"
    echo "   2. Clone the public repository:"
    echo "      ${BOLD}git clone ${PUBLIC_REPO_URL}${NC}"
    echo ""
    echo "   3. Create your PWC environment configuration:"
    echo "      ${BOLD}cd newscrape${NC}"
    echo "      ${BOLD}cp .env.azure.example .env.azure${NC}"
    echo "      ${BOLD}# Edit .env.azure with your PWC Azure values${NC}"
    echo ""
    echo "   4. Deploy to PWC Azure:"
    echo "      ${BOLD}./deploy-cloudshell.sh${NC}"
    echo ""
    echo "${BOLD}💡 Tips:${NC}"
    echo "   - The public repo is sanitized (no secrets)"
    echo "   - .env.azure.example provides a template for configuration"
    echo "   - deploy-cloudshell.sh works in Cloud Shell (no Docker needed)"
    echo ""
}

# Main function
main() {
    # Use first argument as repo URL if provided
    if [ ! -z "$1" ]; then
        PUBLIC_REPO_URL="$1"
    fi

    print_banner
    check_prerequisites
    verify_clean_state
    prepare_clean_copy
    verify_no_secrets
    sync_to_public_repo
    cleanup_temp
    show_next_steps
}

# Handle script interruption
trap 'print_error "Sync interrupted. Cleaning up..."; cleanup_temp; exit 1' INT

# Run main function
main "$@"
