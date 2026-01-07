from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List
import uuid
from datetime import datetime, timezone
import requests as http_requests
import time
import json

from models import (
    User, Organization, OrganizationCreate, OrganizationUpdate, AddMember,
    Collection, CollectionCreate, CollectionUpdate,
    Request as RequestModel, RequestCreate, RequestUpdate, RequestExecute,
    History, Environment, EnvironmentCreate, EnvironmentUpdate,
    SessionExchange, KeyValue
)
from auth import (
    exchange_session_id, create_or_update_user, create_session,
    get_current_user, delete_session
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Store db in app state for auth middleware
app.state.db = db

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============= Authentication Endpoints =============

@api_router.post("/auth/session")
async def auth_session(session_data: SessionExchange):
    """Exchange session_id for user data and create session"""
    try:
        # Exchange session_id with Emergent
        user_data = await exchange_session_id(session_data.session_id)
        
        # Create or update user
        user = await create_or_update_user(db, user_data)
        
        # Create session
        session_token = user_data.get("session_token")
        await create_session(db, user["user_id"], session_token)
        
        # Return user data
        response = JSONResponse(content=user)
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,  # 7 days
            path="/"
        )
        return response
    except Exception as e:
        logger.error(f"Session exchange error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/auth/me", response_model=User)
async def get_me(request: Request):
    """Get current user information"""
    user = await get_current_user(request)
    return user


@api_router.post("/auth/logout")
async def logout(request: Request):
    """Logout user and delete session"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await delete_session(db, session_token)
    
    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie("session_token", path="/")
    return response


# ============= Organization Endpoints =============

@api_router.get("/organizations", response_model=List[Organization])
async def get_organizations(request: Request):
    """Get all organizations for current user"""
    user = await get_current_user(request)
    
    orgs = await db.organizations.find(
        {"members": user["user_id"]},
        {"_id": 0}
    ).to_list(100)
    
    return orgs


@api_router.post("/organizations", response_model=Organization)
async def create_organization(org_data: OrganizationCreate, request: Request):
    """Create new organization"""
    user = await get_current_user(request)
    
    org_id = f"org_{uuid.uuid4().hex[:12]}"
    new_org = {
        "org_id": org_id,
        "name": org_data.name,
        "type": org_data.type,
        "owner_id": user["user_id"],
        "members": [user["user_id"]],
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.organizations.insert_one(new_org)
    return new_org


@api_router.get("/organizations/{org_id}", response_model=Organization)
async def get_organization(org_id: str, request: Request):
    """Get organization details"""
    user = await get_current_user(request)
    
    org = await db.organizations.find_one(
        {"org_id": org_id, "members": user["user_id"]},
        {"_id": 0}
    )
    
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    return org


@api_router.put("/organizations/{org_id}", response_model=Organization)
async def update_organization(org_id: str, org_data: OrganizationUpdate, request: Request):
    """Update organization"""
    user = await get_current_user(request)
    
    org = await db.organizations.find_one({"org_id": org_id, "owner_id": user["user_id"]})
    if not org:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_fields = {k: v for k, v in org_data.dict().items() if v is not None}
    
    await db.organizations.update_one(
        {"org_id": org_id},
        {"$set": update_fields}
    )
    
    updated_org = await db.organizations.find_one({"org_id": org_id}, {"_id": 0})
    return updated_org


@api_router.post("/organizations/{org_id}/members")
async def add_member(org_id: str, member_data: AddMember, request: Request):
    """Add member to organization"""
    user = await get_current_user(request)
    
    org = await db.organizations.find_one({"org_id": org_id, "owner_id": user["user_id"]})
    if not org:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Find user by email
    member = await db.users.find_one({"email": member_data.email}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Add to members list
    await db.organizations.update_one(
        {"org_id": org_id},
        {"$addToSet": {"members": member["user_id"]}}
    )
    
    return {"message": "Member added successfully"}


# ============= Collection Endpoints =============

@api_router.get("/organizations/{org_id}/collections", response_model=List[Collection])
async def get_collections(org_id: str, request: Request):
    """Get all collections in organization"""
    user = await get_current_user(request)
    
    # Verify access
    org = await db.organizations.find_one({"org_id": org_id, "members": user["user_id"]})
    if not org:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    collections = await db.collections.find(
        {"org_id": org_id},
        {"_id": 0}
    ).to_list(100)
    
    return collections


@api_router.post("/organizations/{org_id}/collections", response_model=Collection)
async def create_collection(org_id: str, coll_data: CollectionCreate, request: Request):
    """Create new collection"""
    user = await get_current_user(request)
    
    # Verify access
    org = await db.organizations.find_one({"org_id": org_id, "members": user["user_id"]})
    if not org:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    collection_id = f"col_{uuid.uuid4().hex[:12]}"
    new_collection = {
        "collection_id": collection_id,
        "org_id": org_id,
        "name": coll_data.name,
        "description": coll_data.description,
        "color": coll_data.color,
        "created_by": user["user_id"],
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.collections.insert_one(new_collection)
    return new_collection


@api_router.get("/collections/{collection_id}", response_model=Collection)
async def get_collection(collection_id: str, request: Request):
    """Get collection details"""
    user = await get_current_user(request)
    
    collection = await db.collections.find_one(
        {"collection_id": collection_id},
        {"_id": 0}
    )
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Verify access
    org = await db.organizations.find_one(
        {"org_id": collection["org_id"], "members": user["user_id"]}
    )
    if not org:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return collection


@api_router.put("/collections/{collection_id}", response_model=Collection)
async def update_collection(collection_id: str, coll_data: CollectionUpdate, request: Request):
    """Update collection"""
    user = await get_current_user(request)
    
    collection = await db.collections.find_one({"collection_id": collection_id})
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Verify access
    org = await db.organizations.find_one(
        {"org_id": collection["org_id"], "members": user["user_id"]}
    )
    if not org:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_fields = {k: v for k, v in coll_data.dict().items() if v is not None}
    
    await db.collections.update_one(
        {"collection_id": collection_id},
        {"$set": update_fields}
    )
    
    updated_coll = await db.collections.find_one({"collection_id": collection_id}, {"_id": 0})
    return updated_coll


@api_router.delete("/collections/{collection_id}")
async def delete_collection(collection_id: str, request: Request):
    """Delete collection"""
    user = await get_current_user(request)
    
    collection = await db.collections.find_one({"collection_id": collection_id})
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Verify access
    org = await db.organizations.find_one(
        {"org_id": collection["org_id"], "members": user["user_id"]}
    )
    if not org:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.collections.delete_one({"collection_id": collection_id})
    return {"message": "Collection deleted successfully"}


# ============= Request Endpoints =============

@api_router.get("/organizations/{org_id}/requests", response_model=List[RequestModel])
async def get_org_requests(org_id: str, request: Request):
    """Get all requests in organization"""
    user = await get_current_user(request)
    
    # Verify access
    org = await db.organizations.find_one({"org_id": org_id, "members": user["user_id"]})
    if not org:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    requests = await db.requests.find(
        {"org_id": org_id},
        {"_id": 0}
    ).to_list(1000)
    
    return requests


@api_router.post("/requests", response_model=RequestModel)
async def create_request(req_data: RequestCreate, request: Request):
    """Create new request"""
    user = await get_current_user(request)
    
    # Get org_id from collection or require it
    org_id = None
    if req_data.collection_id:
        collection = await db.collections.find_one({"collection_id": req_data.collection_id})
        if collection:
            org_id = collection["org_id"]
    
    if not org_id:
        # Get user's first organization
        org = await db.organizations.find_one({"members": user["user_id"]}, {"_id": 0})
        if not org:
            raise HTTPException(status_code=400, detail="No organization found")
        org_id = org["org_id"]
    
    request_id = f"req_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    new_request = {
        "request_id": request_id,
        "collection_id": req_data.collection_id,
        "org_id": org_id,
        "name": req_data.name,
        "method": req_data.method,
        "url": req_data.url,
        "headers": [h.dict() for h in req_data.headers],
        "params": [p.dict() for p in req_data.params],
        "body": req_data.body.dict(),
        "auth": req_data.auth.dict(),
        "created_by": user["user_id"],
        "created_at": now,
        "updated_at": now
    }
    
    await db.requests.insert_one(new_request)
    return new_request


@api_router.get("/requests/{request_id}", response_model=RequestModel)
async def get_request(request_id: str, request: Request):
    """Get request details"""
    user = await get_current_user(request)
    
    req = await db.requests.find_one(
        {"request_id": request_id},
        {"_id": 0}
    )
    
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Verify access
    org = await db.organizations.find_one(
        {"org_id": req["org_id"], "members": user["user_id"]}
    )
    if not org:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return req


@api_router.put("/requests/{request_id}", response_model=RequestModel)
async def update_request(request_id: str, req_data: RequestUpdate, request: Request):
    """Update request"""
    user = await get_current_user(request)
    
    req = await db.requests.find_one({"request_id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Verify access
    org = await db.organizations.find_one(
        {"org_id": req["org_id"], "members": user["user_id"]}
    )
    if not org:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_fields = {}
    for field, value in req_data.dict().items():
        if value is not None:
            if isinstance(value, list):
                update_fields[field] = [item.dict() if hasattr(item, 'dict') else item for item in value]
            elif hasattr(value, 'dict'):
                update_fields[field] = value.dict()
            else:
                update_fields[field] = value
    
    update_fields["updated_at"] = datetime.now(timezone.utc)
    
    await db.requests.update_one(
        {"request_id": request_id},
        {"$set": update_fields}
    )
    
    updated_req = await db.requests.find_one({"request_id": request_id}, {"_id": 0})
    return updated_req


@api_router.delete("/requests/{request_id}")
async def delete_request(request_id: str, request: Request):
    """Delete request"""
    user = await get_current_user(request)
    
    req = await db.requests.find_one({"request_id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Verify access
    org = await db.organizations.find_one(
        {"org_id": req["org_id"], "members": user["user_id"]}
    )
    if not org:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.requests.delete_one({"request_id": request_id})
    return {"message": "Request deleted successfully"}


@api_router.post("/requests/execute")
async def execute_request(exec_data: RequestExecute, request: Request):
    """Execute HTTP request as proxy"""
    user = await get_current_user(request)
    
    try:
        # Build headers
        headers = {}
        for h in exec_data.headers:
            if h.enabled:
                headers[h.key] = h.value
        
        # Build params
        params = {}
        for p in exec_data.params:
            if p.enabled:
                params[p.key] = p.value
        
        # Build auth
        auth = None
        if exec_data.auth.type == "basic":
            auth = (exec_data.auth.username, exec_data.auth.password)
        elif exec_data.auth.type == "bearer":
            headers["Authorization"] = f"Bearer {exec_data.auth.token}"
        elif exec_data.auth.type == "apikey":
            headers[exec_data.auth.key] = exec_data.auth.value
        
        # Build body
        data = None
        json_data = None
        if exec_data.body.type == "json" and exec_data.body.content:
            try:
                json_data = json.loads(exec_data.body.content)
            except:
                pass
        elif exec_data.body.type in ["form", "raw"] and exec_data.body.content:
            data = exec_data.body.content
        
        # Execute request
        start_time = time.time()
        response = http_requests.request(
            method=exec_data.method,
            url=exec_data.url,
            headers=headers,
            params=params,
            json=json_data,
            data=data,
            auth=auth,
            timeout=30
        )
        elapsed_time = int((time.time() - start_time) * 1000)  # ms
        
        # Parse response
        try:
            response_body = response.json()
        except:
            response_body = response.text
        
        # Calculate size
        size_bytes = len(response.content)
        if size_bytes < 1024:
            size = f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            size = f"{size_bytes / 1024:.1f} KB"
        else:
            size = f"{size_bytes / (1024 * 1024):.1f} MB"
        
        return {
            "status": response.status_code,
            "statusText": response.reason,
            "time": elapsed_time,
            "size": size,
            "headers": dict(response.headers),
            "body": response_body
        }
        
    except Exception as e:
        logger.error(f"Request execution error: {e}")
        return {
            "status": 0,
            "statusText": "Error",
            "time": 0,
            "size": "0 B",
            "headers": {},
            "body": {"error": str(e)}
        }


# ============= History Endpoints =============

@api_router.get("/organizations/{org_id}/history", response_model=List[History])
async def get_history(org_id: str, request: Request):
    """Get request history for organization"""
    user = await get_current_user(request)
    
    # Verify access
    org = await db.organizations.find_one({"org_id": org_id, "members": user["user_id"]})
    if not org:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    history = await db.request_history.find(
        {"org_id": org_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(100).to_list(100)
    
    return history


# ============= Environment Endpoints =============

@api_router.get("/organizations/{org_id}/environments", response_model=List[Environment])
async def get_environments(org_id: str, request: Request):
    """Get all environments in organization"""
    user = await get_current_user(request)
    
    # Verify access
    org = await db.organizations.find_one({"org_id": org_id, "members": user["user_id"]})
    if not org:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    environments = await db.environments.find(
        {"org_id": org_id},
        {"_id": 0}
    ).to_list(100)
    
    return environments


@api_router.post("/environments", response_model=Environment)
async def create_environment(env_data: EnvironmentCreate, org_id: str, request: Request):
    """Create new environment"""
    user = await get_current_user(request)
    
    # Verify access
    org = await db.organizations.find_one({"org_id": org_id, "members": user["user_id"]})
    if not org:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    env_id = f"env_{uuid.uuid4().hex[:12]}"
    new_env = {
        "env_id": env_id,
        "org_id": org_id,
        "name": env_data.name,
        "variables": [v.dict() for v in env_data.variables],
        "created_by": user["user_id"],
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.environments.insert_one(new_env)
    return new_env


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()