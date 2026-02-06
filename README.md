# API Nexus - Application Overview

API Nexus is a full-stack application designed to streamline API development, testing, and management. It provides a user-friendly interface for building, organizing, and testing API requests, as well as managing environments and collections.

## Key Features
- Build and send HTTP requests with an intuitive request builder.
- Organize requests into collections for better project management.
- Manage multiple environments for seamless API testing.
- Command palette for quick navigation and actions.
- User authentication and protected routes for secure access.
- Visual editing tools and health check plugins for enhanced productivity.

## Instructions
1. Start the backend and frontend servers using Docker or the provided scripts.
2. Access the frontend UI to create, edit, and test API requests.
3. Use the sidebar to manage collections and environments.
4. Utilize the command palette (Ctrl+K) for quick actions.
5. For detailed feature usage consult the "feature-documentation" file included in the project.

# Setup Guide (API Nexus)

## Quick Start (Docker - recommended)
1. Install and start Docker Desktop.
2. Clone the repo:
3. Create a `.env` file in the repo root (same folder as `docker-compose.yml`):
   Create your own GOOGLE_CLIENT_ID and add in .env file
   ```
       GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```
4. Run the app:
   ```
   docker compose up --build
   ```
5. Open:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000


## Local Dev (without Docker)
If you want to run locally:

### Backend `.env` (`backend/.env`)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
GOOGLE_CLIENT_ID=919494983538-qlo2k63gaufl3jhhl700ddr3qk7citeq.apps.googleusercontent.com
FRONTEND_URL=http://localhost:3000
COOKIE_SECURE=false
```

### Frontend `.env` (`frontend/.env`)
```
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=919494983538-qlo2k63gaufl3jhhl700ddr3qk7citeq.apps.googleusercontent.com
```

### Start backend
```
cd backend
python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Start frontend
```
cd frontend
npm install
npm start
```
