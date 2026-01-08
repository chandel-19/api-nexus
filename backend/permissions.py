from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

async def get_user_role_in_org(db: AsyncIOMotorDatabase, user_id: str, org_id: str) -> str:
    """Get user's role in an organization"""
    org = await db.organizations.find_one({"org_id": org_id}, {"_id": 0})
    
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Check if user is owner (always admin)
    if org.get("owner_id") == user_id:
        return "admin"
    
    # Check member_roles (new format)
    member_roles = org.get("member_roles", [])
    for member in member_roles:
        if member.get("user_id") == user_id:
            return member.get("role", "view")
    
    # Check old members list (backward compatibility)
    if user_id in org.get("members", []):
        return "edit"  # Default for old format
    
    raise HTTPException(status_code=403, detail="User not in organization")


async def check_org_permission(db: AsyncIOMotorDatabase, user_id: str, org_id: str, required_role: str):
    """Check if user has required permission level in organization"""
    role_hierarchy = {
        "view": 1,
        "edit": 2,
        "admin": 3
    }
    
    user_role = await get_user_role_in_org(db, user_id, org_id)
    
    required_level = role_hierarchy.get(required_role, 0)
    user_level = role_hierarchy.get(user_role, 0)
    
    if user_level < required_level:
        raise HTTPException(
            status_code=403,
            detail=f"Insufficient permissions. Required: {required_role}, You have: {user_role}"
        )
    
    return user_role


async def is_org_admin(db: AsyncIOMotorDatabase, user_id: str, org_id: str) -> bool:
    """Check if user is admin of organization"""
    try:
        role = await get_user_role_in_org(db, user_id, org_id)
        return role == "admin"
    except:
        return False


async def add_user_to_org(db: AsyncIOMotorDatabase, org_id: str, user_id: str, role: str = "edit"):
    """Add user to organization with specified role"""
    from datetime import datetime, timezone
    
    org = await db.organizations.find_one({"org_id": org_id})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Initialize member_roles if doesn't exist
    member_roles = org.get("member_roles", [])
    
    # Check if user already exists
    for member in member_roles:
        if member.get("user_id") == user_id:
            raise HTTPException(status_code=400, detail="User already in organization")
    
    # Add new member
    new_member = {
        "user_id": user_id,
        "role": role,
        "added_at": datetime.now(timezone.utc)
    }
    member_roles.append(new_member)
    
    # Update organization
    await db.organizations.update_one(
        {"org_id": org_id},
        {
            "$set": {"member_roles": member_roles},
            "$addToSet": {"members": user_id}  # Keep old format for compatibility
        }
    )


async def remove_user_from_org(db: AsyncIOMotorDatabase, org_id: str, user_id: str):
    """Remove user from organization"""
    org = await db.organizations.find_one({"org_id": org_id})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Can't remove owner
    if org.get("owner_id") == user_id:
        raise HTTPException(status_code=400, detail="Cannot remove organization owner")
    
    # Remove from member_roles
    member_roles = org.get("member_roles", [])
    member_roles = [m for m in member_roles if m.get("user_id") != user_id]
    
    # Update organization
    await db.organizations.update_one(
        {"org_id": org_id},
        {
            "$set": {"member_roles": member_roles},
            "$pull": {"members": user_id}  # Remove from old format too
        }
    )


async def update_user_role_in_org(db: AsyncIOMotorDatabase, org_id: str, user_id: str, new_role: str):
    """Update user's role in organization"""
    org = await db.organizations.find_one({"org_id": org_id})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Can't change owner's role
    if org.get("owner_id") == user_id:
        raise HTTPException(status_code=400, detail="Cannot change organization owner's role")
    
    # Update role in member_roles
    member_roles = org.get("member_roles", [])
    updated = False
    
    for member in member_roles:
        if member.get("user_id") == user_id:
            member["role"] = new_role
            updated = True
            break
    
    if not updated:
        raise HTTPException(status_code=404, detail="User not found in organization")
    
    # Update organization
    await db.organizations.update_one(
        {"org_id": org_id},
        {"$set": {"member_roles": member_roles}}
    )
