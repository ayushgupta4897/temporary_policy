#!/bin/bash

# Status check script for Policy Drafter Application
# Strategy& PWC - AI Policy Drafter

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Policy Drafter Server Status:${NC}"
echo ""

# Check backend server status
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${GREEN}✓ Backend:  Running (PID: $BACKEND_PID)${NC}"
        echo -e "            http://localhost:8000"
    else
        echo -e "${RED}✗ Backend:  Not running (stale PID file)${NC}"
    fi
else
    echo -e "${RED}✗ Backend:  Not running${NC}"
fi

echo ""

# Check frontend server status
if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${GREEN}✓ Frontend: Running (PID: $FRONTEND_PID)${NC}"
        echo -e "            http://localhost:3000"
    else
        echo -e "${RED}✗ Frontend: Not running (stale PID file)${NC}"
    fi
else
    echo -e "${RED}✗ Frontend: Not running${NC}"
fi

echo ""

# Test API health endpoint if backend is running
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${YELLOW}Testing API health...${NC}"
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ API is responding${NC}"
        else
            echo -e "${RED}✗ API is not responding${NC}"
        fi
    fi
fi
