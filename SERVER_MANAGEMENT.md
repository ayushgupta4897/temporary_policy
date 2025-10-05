# Server Management Guide

## Quick Start

### Using Makefile (Recommended)

```bash
# Install all dependencies
make install

# Start both servers
make start

# Stop both servers
make stop

# Check server status
make status

# View logs
make logs
```

### Using Shell Scripts

```bash
# Start both servers
./start.sh

# Stop both servers
./stop.sh

# Check server status
./status.sh
```

## Available Commands

### Makefile Commands

| Command | Description |
|---------|-------------|
| `make start` | Start both backend and frontend servers |
| `make stop` | Stop both backend and frontend servers |
| `make restart` | Restart both servers |
| `make status` | Check if servers are running |
| `make dev` | Run servers in foreground (development mode) |
| `make logs` | View last 20 lines of logs |
| `make logs-follow` | Follow logs in real-time |
| `make clean` | Clean up PID files and logs |
| `make install` | Install all dependencies |
| `make quickstart` | Install deps, setup env, and start servers |

### Individual Server Control

| Command | Description |
|---------|-------------|
| `make start-backend` | Start only the backend server |
| `make start-frontend` | Start only the frontend server |
| `make stop-backend` | Stop only the backend server |
| `make stop-frontend` | Stop only the frontend server |
| `make install-backend` | Install backend dependencies |
| `make install-frontend` | Install frontend dependencies |

### Testing & Debugging

| Command | Description |
|---------|-------------|
| `make test-api` | Test API health endpoint |
| `make check-deps` | Check if Python3 and npm are installed |
| `make setup-env` | Create .env file with defaults |

## Server Details

### Backend Server
- **Port**: 8000
- **URL**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Log File**: `backend.log`
- **PID File**: `.backend.pid`

### Frontend Server
- **Port**: 3000
- **URL**: http://localhost:3000
- **Framework**: Next.js
- **Log File**: `frontend.log`
- **PID File**: `.frontend.pid`

## Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is already in use
lsof -i :8000

# Check Python dependencies
make install-backend

# Check backend logs
tail -n 50 backend.log
```

### Frontend won't start
```bash
# Check if port 3000 is already in use
lsof -i :3000

# Check Node dependencies
make install-frontend

# Check frontend logs
tail -n 50 frontend.log
```

### Servers are running but not responding
```bash
# Test API health
make test-api

# Check server status
make status

# Restart servers
make restart
```

### Clean up everything
```bash
# Stop servers and clean up
make stop
make clean

# Full clean including node_modules
make clean-all
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
POLICY_DRAFTER_PASSWORD=strategy2024
OPENAI_API_KEY=your-openai-api-key

# Azure Storage (optional)
AZURE_STORAGE_CONNECTION_STRING=your-azure-connection-string
```

Or use the setup command:
```bash
make setup-env
```

## Development Workflow

### Standard Development
```bash
# Start servers in background
make start

# Watch logs in another terminal
make logs-follow

# Make changes to code (auto-reload enabled)

# Restart if needed
make restart

# Stop when done
make stop
```

### Interactive Development
```bash
# Run servers in foreground (Ctrl+C to stop)
make dev
```

## Process Management

The system uses PID files to track running servers:
- `.backend.pid` - Backend server process ID
- `.frontend.pid` - Frontend server process ID

These files are automatically created when servers start and removed when they stop. They're ignored by git.

## Log Files

Server logs are written to:
- `backend.log` - Backend server output
- `frontend.log` - Frontend server output

View logs:
```bash
# Last 20 lines of each
make logs

# Follow in real-time
make logs-follow

# View specific log
tail -f backend.log
tail -f frontend.log
```

## Port Configuration

Default ports can be changed in the Makefile:
```makefile
BACKEND_PORT := 8000
FRONTEND_PORT := 3000
```

## Dependencies

### Backend Requirements
- Python 3.8+
- FastAPI
- Uvicorn
- Azure SDK
- OpenAI SDK

### Frontend Requirements
- Node.js 18+
- npm or yarn
- Next.js 14
- React 18
- TypeScript

Install all dependencies:
```bash
make install
```

## Production Deployment

For production, consider:
1. Using proper process managers (systemd, PM2)
2. Setting up reverse proxy (Nginx, Apache)
3. Configuring SSL certificates
4. Using production environment variables
5. Implementing proper logging and monitoring

See `deploy.sh` and Azure deployment configurations for production setup.
