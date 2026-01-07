from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


# User Models
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None


# Organization Models
class Organization(BaseModel):
    org_id: str
    name: str
    type: str  # "personal" or "team"
    owner_id: str
    members: List[str]
    created_at: datetime


class OrganizationCreate(BaseModel):
    name: str
    type: str = "team"


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None


class AddMember(BaseModel):
    email: str


# Collection Models
class Collection(BaseModel):
    collection_id: str
    org_id: str
    name: str
    description: Optional[str] = None
    color: str = "#3B82F6"
    created_by: str
    created_at: datetime


class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "#3B82F6"


class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None


# Request Models
class KeyValue(BaseModel):
    key: str
    value: str
    enabled: bool = True


class RequestBody(BaseModel):
    type: str  # "none", "json", "form", "raw"
    content: str = ""


class RequestAuth(BaseModel):
    type: str  # "none", "bearer", "basic", "apikey"
    token: Optional[str] = None
    key: Optional[str] = None
    value: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None


class Request(BaseModel):
    request_id: str
    collection_id: Optional[str] = None
    org_id: str
    name: str
    method: str
    url: str
    headers: List[KeyValue] = []
    params: List[KeyValue] = []
    body: RequestBody
    auth: RequestAuth
    created_by: str
    created_at: datetime
    updated_at: datetime


class RequestCreate(BaseModel):
    collection_id: Optional[str] = None
    name: str
    method: str = "GET"
    url: str
    headers: List[KeyValue] = []
    params: List[KeyValue] = []
    body: RequestBody = RequestBody(type="none", content="")
    auth: RequestAuth = RequestAuth(type="none")


class RequestUpdate(BaseModel):
    collection_id: Optional[str] = None
    name: Optional[str] = None
    method: Optional[str] = None
    url: Optional[str] = None
    headers: Optional[List[KeyValue]] = None
    params: Optional[List[KeyValue]] = None
    body: Optional[RequestBody] = None
    auth: Optional[RequestAuth] = None


class RequestExecute(BaseModel):
    method: str
    url: str
    headers: List[KeyValue] = []
    params: List[KeyValue] = []
    body: RequestBody = RequestBody(type="none", content="")
    auth: RequestAuth = RequestAuth(type="none")


# History Models
class History(BaseModel):
    history_id: str
    request_id: Optional[str] = None
    user_id: str
    org_id: str
    method: str
    url: str
    status: int
    time: int  # milliseconds
    timestamp: datetime


# Environment Models
class EnvironmentVariable(BaseModel):
    key: str
    value: str
    enabled: bool = True


class Environment(BaseModel):
    env_id: str
    org_id: str
    name: str
    variables: List[EnvironmentVariable] = []
    created_by: str
    created_at: datetime


class EnvironmentCreate(BaseModel):
    name: str
    variables: List[EnvironmentVariable] = []


class EnvironmentUpdate(BaseModel):
    name: Optional[str] = None
    variables: Optional[List[EnvironmentVariable]] = None


# Collection Script Models
class CollectionScripts(BaseModel):
    pre_request: Optional[str] = None  # JavaScript code to run before requests
    post_request: Optional[str] = None  # JavaScript code to run after requests


# Auth Models
class SessionExchange(BaseModel):
    session_id: str
