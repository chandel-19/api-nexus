#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting API Nexus Application...${NC}\n"

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}Creating backend/.env file...${NC}"
    cat > backend/.env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
EOF
fi

if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}Creating frontend/.env file...${NC}"
    cat > frontend/.env << EOF
REACT_APP_BACKEND_URL=http://localhost:8000
EOF
fi

# Check if MongoDB is running
echo -e "${BLUE}Checking MongoDB connection...${NC}"
if ! mongosh --quiet --eval "db.version()" > /dev/null 2>&1; then
    echo -e "${YELLOW}Warning: MongoDB might not be running.${NC}"
    echo -e "${YELLOW}Please start MongoDB with: brew services start mongodb-community${NC}"
fi

# Check if Python dependencies are installed
echo -e "${BLUE}Checking backend dependencies...${NC}"
cd backend
if ! python -c "import fastapi" 2>/dev/null; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    pip install -r requirements.txt
else
    echo -e "${GREEN}Backend dependencies OK${NC}"
fi
cd ..

# Check if frontend dependencies are installed
echo -e "${BLUE}Checking frontend dependencies...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    if command -v yarn &> /dev/null; then
        yarn install
    else
        npm install
    fi
else
    echo -e "${GREEN}Frontend dependencies OK${NC}"
fi
cd ..

# Start backend in background
echo -e "\n${BLUE}Starting backend server on http://localhost:8000...${NC}"
cd backend
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}Backend started (PID: $BACKEND_PID)${NC}"
echo -e "${GREEN}Backend logs: tail -f backend.log${NC}"

# Wait a moment for backend to start
sleep 3

# Start frontend
echo -e "\n${BLUE}Starting frontend server on http://localhost:3000...${NC}"
cd frontend
if command -v yarn &> /dev/null; then
    yarn start > ../frontend.log 2>&1 &
else
    npm start > ../frontend.log 2>&1 &
fi
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}Frontend started (PID: $FRONTEND_PID)${NC}"
echo -e "${GREEN}Frontend logs: tail -f frontend.log${NC}"

echo -e "\n${GREEN}✓ Application is starting!${NC}"
echo -e "${GREEN}Backend: http://localhost:8000${NC}"
echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}API Docs: http://localhost:8000/docs${NC}"
echo -e "\n${YELLOW}Press Ctrl+C to stop both servers${NC}"

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}Servers stopped${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
