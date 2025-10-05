#!/bin/bash

# Stop script for Policy Drafter Application
# Strategy& PWC - AI Policy Drafter

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping Policy Drafter Application...${NC}"

# Stop frontend server
if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${YELLOW}Stopping frontend server (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID
        echo -e "${GREEN}✓ Frontend server stopped${NC}"
    else
        echo -e "${YELLOW}Frontend server not running, cleaning up PID file${NC}"
    fi
    rm -f .frontend.pid
else
    echo -e "${YELLOW}Frontend server is not running${NC}"
fi

# Stop backend server
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${YELLOW}Stopping backend server (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID
        echo -e "${GREEN}✓ Backend server stopped${NC}"
    else
        echo -e "${YELLOW}Backend server not running, cleaning up PID file${NC}"
    fi
    rm -f .backend.pid
else
    echo -e "${YELLOW}Backend server is not running${NC}"
fi

echo -e "${GREEN}✓ All servers stopped${NC}"
