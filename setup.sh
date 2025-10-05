#!/bin/bash

echo "🏛️  Strategy& PWC Policy Drafter - Setup Script"
echo "================================================="

# Check if we're in the right directory
if [ ! -d "policy_drafter" ] || [ ! -d "api" ] || [ ! -d "frontend" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📦 Setting up backend dependencies..."
cd api
pip install -r requirements.txt
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

echo "📦 Setting up frontend dependencies..."
cd ../frontend
npm install
if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

cd ..

echo ""
echo "🚀 Setup complete! Next steps:"
echo ""
echo "1. Set up Azure Storage Account and get connection string"
echo "2. Set environment variables:"
echo "   export AZURE_STORAGE_CONNECTION_STRING=\"your_connection_string\""
echo "   export POLICY_DRAFTER_PASSWORD=\"strategy2024\""
echo ""
echo "3. Start the backend:"
echo "   cd api && python main.py"
echo ""
echo "4. Start the frontend (in new terminal):"
echo "   cd frontend && npm run dev"
echo ""
echo "5. Open http://localhost:3000"
echo "   Default password: strategy2024"
echo ""
echo "✨ Happy policy drafting!"
