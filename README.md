# Policy Drafter UI
**Strategy& PWC - AI-Powered Policy Intelligence Platform**

## Overview

A comprehensive full-stack application that generates AI-powered policy documents with research, analytics, and scenario simulations. Features a minimalist web interface with Strategy& PWC branding for demo purposes.

## Architecture

```
Frontend (Next.js) ↔ Backend APIs ↔ Azure Storage ↔ Existing Policy Agent
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- Python 3.8+
- Azure Storage Account

### 1. Backend API Setup

```bash
# Navigate to API folder
cd api

# Install Python dependencies
pip install -r requirements.txt

# Set environment variables
export AZURE_STORAGE_CONNECTION_STRING="your_azure_connection_string"
export POLICY_DRAFTER_PASSWORD="strategy2024"

# Run the API server
python main.py
```

API will be available at: http://localhost:8000

### 2. Frontend Setup

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at: http://localhost:3000

### 3. Azure Storage Setup

Create an Azure Storage Account with:
- **Table Storage**: Table named `PolicyQueries`
- **Blob Storage**: Container named `policy-reports`

Both will be created automatically when first accessed.

## Environment Variables

### Backend (.env or environment)
```bash
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
POLICY_DRAFTER_PASSWORD=strategy2024
OPENAI_API_KEY=your_openai_key
```

### Frontend
No additional environment variables needed for development.

## Usage Flow

1. **Authentication**: Simple password check (hardcoded)
2. **Query Submission**: User enters policy requirements
3. **Background Processing**: ~30 minutes of AI analysis
4. **Status Monitoring**: Real-time status updates
5. **Report Viewing**: Multiple markdown reports with download

## API Endpoints

- `POST /auth` - Password authentication
- `POST /queries` - Submit new policy query
- `GET /queries` - List all queries
- `GET /queries/{id}` - Get query status
- `GET /queries/{id}/reports/{name}` - Download report
- `GET /health` - Health check

## Generated Reports

1. **Research Analysis** - Deep research findings
2. **Policy Document** - Complete policy framework
3. **Scenario Analysis** - Implementation simulations
4. **Data Analytics** - Statistical insights
5. **Executive Summary** - 2-page leadership brief
6. **Strategy Brief** - 3-5 page team document
7. **Full Dossier** - Comprehensive reference

## Tech Stack

**Frontend:**
- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS
- React Markdown

**Backend:**
- FastAPI (Python)
- Azure Table Storage
- Azure Blob Storage
- Threading for background jobs

**Existing System:**
- OpenAI GPT models
- Deep research client
- Policy drafting agents

## Development Commands

### Frontend
```bash
npm run dev        # Development server
npm run build      # Production build
npm run start      # Production server
npm run lint       # ESLint check
```

### Backend
```bash
python main.py     # Run API server
uvicorn main:app --reload  # Development with auto-reload
```

## Demo Features

- **No User Management**: Single hardcoded password
- **Background Processing**: Async policy generation
- **Real-time Status**: Auto-refreshing status updates
- **Visual Reports**: Markdown rendering with Strategy& styling
- **Download Options**: Individual and bulk report downloads

## Strategy& PWC Branding

- **Colors**: Navy blue (#003366), Gold (#FFD700)
- **Typography**: Inter font family
- **Visual Style**: Clean, professional, government-ready
- **Components**: Minimalist cards and buttons

The UI maintains Strategy& PWC's professional aesthetic while providing an intuitive interface for policy document generation and review.
