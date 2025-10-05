#!/bin/bash

# Start script for Policy Drafter Application
# Strategy& PWC - AI Policy Drafter

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Policy Drafter Application...${NC}"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python3 is not installed. Please install Python3 first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install Node.js and npm first.${NC}"
    exit 1
fi

# Start backend server
echo -e "${YELLOW}Starting backend server on port 8000...${NC}"

# Check if virtual environment exists and activate it
if [ -d "venv" ]; then
    echo -e "${YELLOW}Using virtual environment...${NC}"
    source venv/bin/activate
    cd api
    python main.py > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../.backend.pid
    cd ..
else
    cd api
    python3 main.py > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../.backend.pid
    cd ..
fi

# Wait a bit for backend to start
sleep 2

# Check if backend started successfully
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${GREEN}✓ Backend server started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}✗ Failed to start backend server. Check backend.log for details.${NC}"
    exit 1
fi

# Start frontend server
echo -e "${YELLOW}Starting frontend server on port 3000...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../.frontend.pid
cd ..

# Wait a bit for frontend to start
sleep 3

# Check if frontend started successfully
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${GREEN}✓ Frontend server started (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}✗ Failed to start frontend server. Check frontend.log for details.${NC}"
    echo -e "${YELLOW}Stopping backend server...${NC}"
    kill $BACKEND_PID
    rm -f .backend.pid
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Policy Drafter is running!${NC}"
echo -e "  Backend:  http://localhost:8000"
echo -e "  Frontend: http://localhost:3000"
echo ""
echo -e "Run './stop.sh' to stop all servers"
echo -e "Logs are available in backend.log and frontend.log"
