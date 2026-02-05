# Setup Guide (API Nexus)

## Quick Start (Docker - recommended)
1. Install and start Docker Desktop.
2. Clone the repo:
3. Create a `.env` file in the repo root (same folder as `docker-compose.yml`):
   ```
   GOOGLE_CLIENT_ID=919494983538-qlo2k63gaufl3jhhl700ddr3qk7citeq.apps.googleusercontent.com
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
