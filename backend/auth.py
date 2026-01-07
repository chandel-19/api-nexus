from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
import os
from datetime import datetime, timezone, timedelta
import requests
import uuid
from motor.motor_asyncio import AsyncIOMotorDatabase

# Emergent auth endpoint
EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"


async def exchange_session_id(session_id: str) -> dict:
    """Exchange session_id for user data from Emergent"""
    try:
        headers = {"X-Session-ID": session_id}
        response = requests.get(EMERGENT_AUTH_URL, headers=headers, timeout=10)
        
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session ID")
        
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Auth service error: {str(e)}")


async def create_or_update_user(db: AsyncIOMotorDatabase, user_data: dict) -> dict:
    """Create or update user in database"""
    email = user_data.get("email")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        # Update existing user
        await db.users.update_one(
            {"email": email},
            {"$set": {
                "name": user_data.get("name"),
                "picture": user_data.get("picture"),
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        return existing_user
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": email,
            "name": user_data.get("name"),
            "picture": user_data.get("picture"),
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(new_user)
        
        # Create default personal workspace
        org_id = f"org_{uuid.uuid4().hex[:12]}"
        personal_org = {
            "org_id": org_id,
            "name": "My Workspace",
            "type": "personal",
            "owner_id": user_id,
            "members": [user_id],
            "created_at": datetime.now(timezone.utc)
        }
        await db.organizations.insert_one(personal_org)
        
        return new_user


async def create_session(db: AsyncIOMotorDatabase, user_id: str, session_token: str):
    """Store session in database"""
    session = {
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.insert_one(session)


async def get_user_from_session(db: AsyncIOMotorDatabase, session_token: str) -> dict:
    """Get user from session token"""
    if not session_token:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    # Find session
    session_doc = await db.user_sessions.find_one({"session_token": session_token})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session token")
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": session_token})
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user_doc


async def get_current_user(request: Request) -> dict:
    """Middleware helper to get current user from cookie or header"""
    db = request.app.state.db
    
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    return await get_user_from_session(db, session_token)


async def delete_session(db: AsyncIOMotorDatabase, session_token: str):
    """Delete session from database"""
    await db.user_sessions.delete_one({"session_token": session_token})
