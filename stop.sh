#!/bin/bash

# Stop script for Policy Drafter Application
# Strategy& PWC - AI Policy Drafter

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}Stopping Policy Drafter Application...${NC}"
echo ""

# Function to kill process tree (parent and all children)
kill_process_tree() {
    local pid=$1
    local name=$2

    if kill -0 $pid 2>/dev/null; then
        echo -e "${YELLOW}Stopping $name (PID: $pid)...${NC}"

        # Get all child processes
        local children=$(pgrep -P $pid 2>/dev/null)

        # Kill children first
        if [ -n "$children" ]; then
            echo "$children" | xargs kill 2>/dev/null
        fi

        # Kill parent
        kill $pid 2>/dev/null

        # Wait a bit and force kill if still running
        sleep 1
        if kill -0 $pid 2>/dev/null; then
            kill -9 $pid 2>/dev/null
        fi

        echo -e "${GREEN}✓ $name stopped${NC}"
        return 0
    else
        echo -e "${YELLOW}$name not running (PID file exists but process doesn't)${NC}"
        return 1
    fi
}

# Stop frontend server
if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    kill_process_tree $FRONTEND_PID "Frontend server"
    rm -f .frontend.pid
else
    echo -e "${YELLOW}Frontend server is not running (no PID file)${NC}"
fi

# Also kill any remaining npm/node processes related to the frontend
echo -e "${YELLOW}Cleaning up any remaining frontend processes...${NC}"
pkill -f "next dev" 2>/dev/null && echo -e "${GREEN}✓ Cleaned up Next.js processes${NC}" || true

echo ""

# Stop backend server
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    kill_process_tree $BACKEND_PID "Backend server"
    rm -f .backend.pid
else
    echo -e "${YELLOW}Backend server is not running (no PID file)${NC}"
fi

# Also kill any remaining Python processes related to the backend
echo -e "${YELLOW}Cleaning up any remaining backend processes...${NC}"
pkill -f "api/main.py" 2>/dev/null && echo -e "${GREEN}✓ Cleaned up backend processes${NC}" || true
pkill -f "uvicorn main:app" 2>/dev/null && echo -e "${GREEN}✓ Cleaned up uvicorn processes${NC}" || true

echo ""
echo -e "${GREEN}✓ All servers stopped${NC}"
