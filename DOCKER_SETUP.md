# Docker Setup

This repo includes Docker files to run the full stack (MongoDB + backend + frontend).

## Prerequisites
- Docker Desktop installed

## 1) Create a `.env` file (next to `docker-compose.yml`)
```
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## 2) Build and run
```
docker compose up --build
```

## 3) Open the app
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## Notes
- If you change the Google client ID, re-run `docker compose up --build` to rebuild the frontend.
