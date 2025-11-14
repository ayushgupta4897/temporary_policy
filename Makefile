# Makefile for Policy Drafter Application
# Strategy& PWC - AI Policy Drafter

# Colors for output
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
NC=\033[0m # No Color

# Default shell
SHELL := /bin/bash

# Python and Node commands
PYTHON := python3
PIP := pip3
NPM := npm
UVICORN := uvicorn

# Project directories
BACKEND_DIR := api
FRONTEND_DIR := frontend
POLICY_DIR := policy_drafter

# Server configurations
BACKEND_PORT := 8000
FRONTEND_PORT := 3000

# PID files for process management
BACKEND_PID := .backend.pid
FRONTEND_PID := .frontend.pid

.PHONY: help install install-backend install-frontend start stop start-backend start-frontend stop-backend stop-frontend status clean logs logs-azure logs-azure-frontend dev

# Default target - show help
help:
	@echo "$(GREEN)Policy Drafter - Makefile Commands$(NC)"
	@echo ""
	@echo "$(YELLOW)Starting/Stopping:$(NC)"
	@echo "  make start          - Start both backend and frontend servers"
	@echo "  make stop           - Stop both backend and frontend servers"
	@echo "  make restart        - Restart both servers"
	@echo "  make status         - Check server status"
	@echo ""
	@echo "$(YELLOW)Individual Server Control:$(NC)"
	@echo "  make start-backend  - Start only backend server"
	@echo "  make start-frontend - Start only frontend server"
	@echo "  make stop-backend   - Stop only backend server"
	@echo "  make stop-frontend  - Stop only frontend server"
	@echo ""
	@echo "$(YELLOW)Development:$(NC)"
	@echo "  make dev            - Start both servers in development mode (foreground)"
	@echo "  make logs           - Show logs from both servers"
	@echo "  make logs-azure     - Stream live logs from Azure backend container"
	@echo "  make logs-azure-frontend - Stream live logs from Azure frontend container"
	@echo "  make test-api       - Test API health endpoint"
	@echo ""
	@echo "$(YELLOW)Installation:$(NC)"
	@echo "  make install        - Install all dependencies"
	@echo "  make install-backend - Install backend dependencies"
	@echo "  make install-frontend - Install frontend dependencies"
	@echo ""
	@echo "$(YELLOW)Utilities:$(NC)"
	@echo "  make clean          - Clean up PID files and temp files"
	@echo "  make check-deps     - Check if dependencies are installed"

# Install all dependencies
install: install-backend install-frontend
	@echo "$(GREEN)✓ All dependencies installed successfully$(NC)"

# Install backend dependencies
install-backend:
	@echo "$(YELLOW)Installing backend dependencies...$(NC)"
	@cd $(BACKEND_DIR) && $(PIP) install -r requirements.txt
	@cd $(POLICY_DIR) && $(PIP) install -r requirements.txt
	@echo "$(GREEN)✓ Backend dependencies installed$(NC)"

# Install frontend dependencies  
install-frontend:
	@echo "$(YELLOW)Installing frontend dependencies...$(NC)"
	@cd $(FRONTEND_DIR) && $(NPM) install
	@echo "$(GREEN)✓ Frontend dependencies installed$(NC)"

# Start both servers
start: check-deps
	@./start.sh

# Stop both servers
stop:
	@./stop.sh

# Restart both servers
restart:
	@echo "$(YELLOW)Restarting Policy Drafter Application...$(NC)"
	@./stop.sh
	@sleep 2
	@./start.sh

# Check server status
status:
	@echo "$(YELLOW)Policy Drafter Server Status:$(NC)"
	@echo ""
	@if [ -f $(BACKEND_PID) ] && kill -0 `cat $(BACKEND_PID)` 2>/dev/null; then \
		echo "$(GREEN)✓ Backend:  Running (PID: `cat $(BACKEND_PID)`)$(NC)"; \
		echo "            http://localhost:$(BACKEND_PORT)"; \
	else \
		echo "$(RED)✗ Backend:  Not running$(NC)"; \
	fi
	@echo ""
	@if [ -f $(FRONTEND_PID) ] && kill -0 `cat $(FRONTEND_PID)` 2>/dev/null; then \
		echo "$(GREEN)✓ Frontend: Running (PID: `cat $(FRONTEND_PID)`)$(NC)"; \
		echo "            http://localhost:$(FRONTEND_PORT)"; \
	else \
		echo "$(RED)✗ Frontend: Not running$(NC)"; \
	fi
	@echo ""

# Development mode - run both servers in foreground
dev:
	@echo "$(GREEN)Starting Policy Drafter in development mode...$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to stop all servers$(NC)"
	@echo ""
	@trap 'echo "$(YELLOW)Stopping servers...$(NC)"; exit' INT; \
	(cd $(BACKEND_DIR) && $(PYTHON) main.py) & \
	BACKEND_PID=$$!; \
	(cd $(FRONTEND_DIR) && $(NPM) run dev) & \
	FRONTEND_PID=$$!; \
	wait

# Show logs from both servers
logs:
	@echo "$(YELLOW)=== Backend Logs ===$(NC)"
	@if [ -f backend.log ]; then \
		tail -n 20 backend.log; \
	else \
		echo "No backend logs found"; \
	fi
	@echo ""
	@echo "$(YELLOW)=== Frontend Logs ===$(NC)"
	@if [ -f frontend.log ]; then \
		tail -n 20 frontend.log; \
	else \
		echo "No frontend logs found"; \
	fi

# Follow logs in real-time
logs-follow:
	@echo "$(YELLOW)Following logs (Ctrl+C to stop)...$(NC)"
	@tail -f backend.log frontend.log 2>/dev/null || echo "No log files found. Start the servers first."

# Load Azure configuration from .env.azure
include .env.azure
export

# Stream live logs from Azure Container App backend
logs-azure:
	@echo "$(GREEN)Streaming live logs from Azure backend container...$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to stop$(NC)"
	@echo ""
	@az containerapp logs show --name $(AZURE_BACKEND_APP_NAME) --resource-group $(AZURE_RESOURCE_GROUP) --follow

# Stream live logs from Azure Container App frontend
logs-azure-frontend:
	@echo "$(GREEN)Streaming live logs from Azure frontend container...$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to stop$(NC)"
	@echo ""
	@az containerapp logs show --name $(AZURE_FRONTEND_APP_NAME) --resource-group $(AZURE_RESOURCE_GROUP) --follow

# Test API health endpoint
test-api:
	@echo "$(YELLOW)Testing API health endpoint...$(NC)"
	@curl -s http://localhost:$(BACKEND_PORT)/health | python3 -m json.tool || echo "$(RED)API is not responding$(NC)"

# Check if required dependencies are available
check-deps:
	@echo "$(YELLOW)Checking dependencies...$(NC)"
	@command -v $(PYTHON) >/dev/null 2>&1 || { echo "$(RED)Python3 is not installed$(NC)"; exit 1; }
	@command -v $(NPM) >/dev/null 2>&1 || { echo "$(RED)npm is not installed$(NC)"; exit 1; }
	@echo "$(GREEN)✓ All required commands are available$(NC)"

# Clean up PID files and logs
clean:
	@echo "$(YELLOW)Cleaning up...$(NC)"
	@rm -f $(BACKEND_PID) $(FRONTEND_PID)
	@rm -f backend.log frontend.log
	@rm -f nohup.out
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

# Full clean including dependencies
clean-all: clean
	@echo "$(YELLOW)Removing node_modules...$(NC)"
	@rm -rf $(FRONTEND_DIR)/node_modules
	@echo "$(GREEN)✓ Full cleanup complete$(NC)"

# Setup environment variables
setup-env:
	@echo "$(YELLOW)Setting up environment variables...$(NC)"
	@if [ ! -f .env ]; then \
		echo "Creating .env file..."; \
		echo "POLICY_DRAFTER_PASSWORD=strategy2024" > .env; \
		echo "AZURE_STORAGE_CONNECTION_STRING=" >> .env; \
		echo "OPENAI_API_KEY=" >> .env; \
		echo "$(GREEN)✓ .env file created. Please update with your actual values.$(NC)"; \
	else \
		echo "$(YELLOW).env file already exists$(NC)"; \
	fi

# Quick start - install deps and start servers
quickstart: install setup-env
	@echo ""
	@echo "$(GREEN)================================$(NC)"
	@echo "$(GREEN)Policy Drafter Quick Start$(NC)"
	@echo "$(GREEN)================================$(NC)"
	@echo ""
	@$(MAKE) start

# Docker commands (if you add Docker support later)
docker-build:
	@echo "$(YELLOW)Building Docker containers...$(NC)"
	@docker-compose build

docker-up:
	@echo "$(YELLOW)Starting Docker containers...$(NC)"
	@docker-compose up -d

docker-down:
	@echo "$(YELLOW)Stopping Docker containers...$(NC)"
	@docker-compose down

docker-logs:
	@docker-compose logs -f
