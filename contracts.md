# API Contracts & Integration Plan

## Overview
This document defines the API contracts between frontend and backend for the Postman clone application with organization support.

## What's Currently Mocked (mock.js)
1. **User Data**: mockUser with user_id, email, name, picture
2. **Organizations**: mockOrganizations (personal & team workspaces)
3. **Collections**: mockCollections with collection_id, org_id, name, description, color
4. **Requests**: mockRequests with full HTTP request details (method, URL, headers, params, body, auth)
5. **History**: mockHistory with request execution history
6. **Environments**: mockEnvironments with variables for different environments
7. **Response**: mockResponse with status, headers, and body

## Backend Implementation Plan

### 1. Database Collections (MongoDB)

#### users
```json
{
  "user_id": "user_abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://...",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### user_sessions
```json
{
  "session_token": "sess_xyz789",
  "user_id": "user_abc123",
  "expires_at": "2024-01-22T10:30:00Z",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### organizations
```json
{
  "org_id": "org_123",
  "name": "My Workspace",
  "type": "personal|team",
  "owner_id": "user_abc123",
  "members": ["user_abc123", "user_def456"],
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### collections
```json
{
  "collection_id": "col_123",
  "org_id": "org_123",
  "name": "User API",
  "description": "User management endpoints",
  "color": "#3B82F6",
  "created_by": "user_abc123",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### requests
```json
{
  "request_id": "req_123",
  "collection_id": "col_123",
  "org_id": "org_123",
  "name": "Get All Users",
  "method": "GET",
  "url": "https://api.example.com/users",
  "headers": [{"key": "Content-Type", "value": "application/json", "enabled": true}],
  "params": [{"key": "page", "value": "1", "enabled": true}],
  "body": {"type": "none|json|form|raw", "content": ""},
  "auth": {"type": "none|bearer|basic|apikey", "token": "", "key": "", "value": "", "username": "", "password": ""},
  "created_by": "user_abc123",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### request_history
```json
{
  "history_id": "hist_123",
  "request_id": "req_123",
  "user_id": "user_abc123",
  "org_id": "org_123",
  "method": "GET",
  "url": "https://api.example.com/users",
  "status": 200,
  "time": 245,
  "timestamp": "2024-03-15T10:30:00Z"
}
```

#### environments
```json
{
  "env_id": "env_123",
  "org_id": "org_123",
  "name": "Development",
  "variables": [{"key": "BASE_URL", "value": "https://dev.api.com", "enabled": true}],
  "created_by": "user_abc123",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 2. API Endpoints

#### Authentication
- `POST /api/auth/session` - Exchange session_id for user data & set cookie
- `GET /api/auth/me` - Get current user info (protected)
- `POST /api/auth/logout` - Logout user

#### Organizations
- `GET /api/organizations` - Get all orgs for current user
- `POST /api/organizations` - Create new organization
- `GET /api/organizations/{org_id}` - Get org details
- `PUT /api/organizations/{org_id}` - Update organization
- `POST /api/organizations/{org_id}/members` - Add member to org
- `DELETE /api/organizations/{org_id}/members/{user_id}` - Remove member

#### Collections
- `GET /api/organizations/{org_id}/collections` - Get all collections in org
- `POST /api/organizations/{org_id}/collections` - Create collection
- `GET /api/collections/{collection_id}` - Get collection details
- `PUT /api/collections/{collection_id}` - Update collection
- `DELETE /api/collections/{collection_id}` - Delete collection

#### Requests
- `GET /api/organizations/{org_id}/requests` - Get all requests in org
- `GET /api/collections/{collection_id}/requests` - Get requests in collection
- `POST /api/requests` - Create/save request
- `GET /api/requests/{request_id}` - Get request details
- `PUT /api/requests/{request_id}` - Update request
- `DELETE /api/requests/{request_id}` - Delete request
- `POST /api/requests/{request_id}/execute` - Execute HTTP request (proxy)

#### History
- `GET /api/organizations/{org_id}/history` - Get request history for org
- `GET /api/history/{history_id}` - Get history item details
- `DELETE /api/history/{history_id}` - Delete history item

#### Environments
- `GET /api/organizations/{org_id}/environments` - Get all environments in org
- `POST /api/environments` - Create environment
- `GET /api/environments/{env_id}` - Get environment details
- `PUT /api/environments/{env_id}` - Update environment
- `DELETE /api/environments/{env_id}` - Delete environment

### 3. Frontend Integration Changes

#### AppContext.js
Replace mock data loading with API calls:
- Load user from `/api/auth/me`
- Load organizations from `/api/organizations`
- Load collections from `/api/organizations/{org_id}/collections`
- Load requests from `/api/organizations/{org_id}/requests`
- Load environments from `/api/organizations/{org_id}/environments`
- Load history from `/api/organizations/{org_id}/history`

#### RequestBuilder.jsx
- Replace mock response with actual API call to `/api/requests/{request_id}/execute`
- Save request to backend when clicking Save button
- Update request in real-time via PUT `/api/requests/{request_id}`

#### Sidebar.jsx
- Fetch collections and requests from API
- Create new collections via API
- Real-time updates when switching organizations

### 4. Special Features

#### Request Execution Proxy
The backend will act as a proxy to execute HTTP requests to avoid CORS issues:
- Accept request configuration from frontend
- Build and execute the HTTP request using Python requests library
- Return response with status, headers, body, and timing information
- Save execution to history

#### Organization Auto-creation
When a user first logs in via Google OAuth:
- Create a personal workspace automatically
- Set as default organization

### 5. Authentication Flow
1. User clicks "Sign in with Google" → Redirect to Emergent OAuth
2. After OAuth, redirect to `/dashboard#session_id={token}`
3. Frontend calls `/api/auth/session` with session_id
4. Backend validates with Emergent, creates/updates user, sets cookie
5. Frontend redirects to dashboard with user data
6. All subsequent requests use httpOnly cookie for authentication

## Implementation Order
1. ✅ Frontend with mock data (COMPLETE)
2. Backend auth endpoints + middleware
3. Backend organizations endpoints
4. Backend collections endpoints
5. Backend requests endpoints + execution proxy
6. Backend environments endpoints
7. Backend history endpoints
8. Frontend integration (replace mock with API calls)
9. Testing & bug fixes
