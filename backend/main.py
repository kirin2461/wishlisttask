from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import uuid
import json
import asyncio

# Configuration
SECRET_KEY = "your-secret-key-here-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

app = FastAPI(title="Wishlist API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# In-memory storage
users_db: Dict[str, dict] = {}
wishlists_db: Dict[str, dict] = {}
items_db: Dict[str, dict] = {}
reservations_db: Dict[str, dict] = {}
contributions_db: Dict[str, dict] = {}

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, wishlist_id: str):
        await websocket.accept()
        if wishlist_id not in self.active_connections:
            self.active_connections[wishlist_id] = []
        self.active_connections[wishlist_id].append(websocket)

    def disconnect(self, websocket: WebSocket, wishlist_id: str):
        if wishlist_id in self.active_connections:
            if websocket in self.active_connections[wishlist_id]:
                self.active_connections[wishlist_id].remove(websocket)

    async def broadcast(self, message: dict, wishlist_id: str):
        if wishlist_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[wishlist_id]:
                try:
                    await connection.send_json(message)
                except:
                    disconnected.append(connection)
            for conn in disconnected:
                self.disconnect(conn, wishlist_id)

manager = ConnectionManager()

# Models
class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class User(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class WishlistCreate(BaseModel):
    title: str
    description: Optional[str] = None
    occasion: Optional[str] = None
    is_public: bool = True

class Wishlist(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    occasion: Optional[str]
    slug: str
    is_public: bool
    created_at: datetime
    updated_at: datetime

class ItemCreate(BaseModel):
    wishlist_id: str
    title: str
    description: Optional[str] = None
    url: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    is_group_gift: bool = False
    target_amount: Optional[float] = None

class Item(BaseModel):
    id: str
    wishlist_id: str
    title: str
    description: Optional[str]
    url: Optional[str]
    price: Optional[float]
    image_url: Optional[str]
    is_group_gift: bool
    target_amount: Optional[float]
    created_at: datetime

class ReservationCreate(BaseModel):
    item_id: str
    anonymous_name: Optional[str] = "Anonymous"

class Reservation(BaseModel):
    id: str
    item_id: str
    user_id: Optional[str]
    anonymous_name: str
    created_at: datetime

class ContributionCreate(BaseModel):
    item_id: str
    amount: float
    anonymous_name: Optional[str] = "Anonymous"

class Contribution(BaseModel):
    id: str
    item_id: str
    user_id: Optional[str]
    amount: float
    anonymous_name: str
    created_at: datetime

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = users_db.get(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def generate_slug():
    return str(uuid.uuid4())[:8]

# Auth endpoints
@app.post("/api/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    for user in users_db.values():
        if user["email"] == user_data.email:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.utcnow()
    user = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "hashed_password": get_password_hash(user_data.password),
        "created_at": now
    }
    users_db[user_id] = user
    
    access_token = create_access_token(
        data={"sub": user_id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "created_at": now
        }
    }

@app.post("/api/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = None
    for u in users_db.values():
        if u["email"] == user_data.email:
            user = u
            break
    
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(
        data={"sub": user["id"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "created_at": user["created_at"]
        }
    }

@app.get("/api/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "created_at": current_user["created_at"]
    }

# Wishlist endpoints
@app.post("/api/wishlists", response_model=Wishlist)
async def create_wishlist(wishlist: WishlistCreate, current_user: dict = Depends(get_current_user)):
    wishlist_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    new_wishlist = {
        "id": wishlist_id,
        "user_id": current_user["id"],
        "title": wishlist.title,
        "description": wishlist.description,
        "occasion": wishlist.occasion,
        "slug": generate_slug(),
        "is_public": wishlist.is_public,
        "created_at": now,
        "updated_at": now
    }
    
    wishlists_db[wishlist_id] = new_wishlist
    return new_wishlist

@app.get("/api/wishlists", response_model=List[Wishlist])
async def get_my_wishlists(current_user: dict = Depends(get_current_user)):
    my_wishlists = [
        w for w in wishlists_db.values() 
        if w["user_id"] == current_user["id"]
    ]
    return sorted(my_wishlists, key=lambda x: x["created_at"], reverse=True)

@app.get("/api/wishlists/{wishlist_id}", response_model=Wishlist)
async def get_wishlist(wishlist_id: str, current_user: dict = Depends(get_current_user)):
    wishlist = wishlists_db.get(wishlist_id)
    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    if wishlist["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return wishlist

@app.delete("/api/wishlists/{wishlist_id}")
async def delete_wishlist(wishlist_id: str, current_user: dict = Depends(get_current_user)):
    wishlist = wishlists_db.get(wishlist_id)
    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    if wishlist["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    items_to_delete = [k for k, v in items_db.items() if v["wishlist_id"] == wishlist_id]
    for item_id in items_to_delete:
        del items_db[item_id]
        reservations_to_delete = [k for k, v in reservations_db.items() if v["item_id"] == item_id]
        for r_id in reservations_to_delete:
            del reservations_db[r_id]
    
    del wishlists_db[wishlist_id]
    return {"message": "Wishlist deleted"}

# Public wishlist endpoint
@app.get("/api/public/wishlists/{slug}")
async def get_public_wishlist(slug: str):
    wishlist = None
    for w in wishlists_db.values():
        if w["slug"] == slug and w["is_public"]:
            wishlist = w
            break
    
    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    
    items = []
    for item in items_db.values():
        if item["wishlist_id"] == wishlist["id"]:
            item_copy = item.copy()
            
            reservations = [r for r in reservations_db.values() if r["item_id"] == item["id"]]
            item_copy["is_reserved"] = len(reservations) > 0
            item_copy["reservation_count"] = len(reservations)
            
            if item["is_group_gift"]:
                contributions = [c for c in contributions_db.values() if c["item_id"] == item["id"]]
                total_contributed = sum(c["amount"] for c in contributions)
                item_copy["total_contributed"] = total_contributed
                item_copy["contributors_count"] = len(contributions)
                item_copy["contributions"] = [
                    {"anonymous_name": c["anonymous_name"], "amount": c["amount"], "created_at": c["created_at"]}
                    for c in contributions
                ]
            
            items.append(item_copy)
    
    return {
        "wishlist": wishlist,
        "items": sorted(items, key=lambda x: x["created_at"], reverse=True),
        "owner_name": users_db[wishlist["user_id"]]["name"]
    }

# Item endpoints
@app.post("/api/items", response_model=Item)
async def create_item(item: ItemCreate, current_user: dict = Depends(get_current_user)):
    wishlist = wishlists_db.get(item.wishlist_id)
    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    if wishlist["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    item_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    new_item = {
        "id": item_id,
        "wishlist_id": item.wishlist_id,
        "title": item.title,
        "description": item.description,
        "url": item.url,
        "price": item.price,
        "image_url": item.image_url,
        "is_group_gift": item.is_group_gift,
        "target_amount": item.target_amount,
        "created_at": now
    }
    
    items_db[item_id] = new_item
    
    await manager.broadcast({
        "type": "item_added",
        "item": new_item
    }, item.wishlist_id)
    
    return new_item

@app.get("/api/wishlists/{wishlist_id}/items", response_model=List[Item])
async def get_wishlist_items(wishlist_id: str, current_user: dict = Depends(get_current_user)):
    wishlist = wishlists_db.get(wishlist_id)
    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    if wishlist["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    items = [item for item in items_db.values() if item["wishlist_id"] == wishlist_id]
    return sorted(items, key=lambda x: x["created_at"], reverse=True)

@app.delete("/api/items/{item_id}")
async def delete_item(item_id: str, current_user: dict = Depends(get_current_user)):
    item = items_db.get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    wishlist = wishlists_db.get(item["wishlist_id"])
    if wishlist["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    wishlist_id = item["wishlist_id"]
    del items_db[item_id]
    
    reservations_to_delete = [k for k, v in reservations_db.items() if v["item_id"] == item_id]
    for r_id in reservations_to_delete:
        del reservations_db[r_id]
    
    contributions_to_delete = [k for k, v in contributions_db.items() if v["item_id"] == item_id]
    for c_id in contributions_to_delete:
        del contributions_db[c_id]
    
    await manager.broadcast({
        "type": "item_deleted",
        "item_id": item_id
    }, wishlist_id)
    
    return {"message": "Item deleted"}

# Reservation endpoints
@app.post("/api/reservations")
async def create_reservation(
    reservation: ReservationCreate, 
    current_user: Optional[dict] = Depends(get_current_user)
):
    item = items_db.get(reservation.item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    existing = [r for r in reservations_db.values() if r["item_id"] == reservation.item_id]
    if existing and not item["is_group_gift"]:
        raise HTTPException(status_code=400, detail="Item already reserved")
    
    reservation_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    new_reservation = {
        "id": reservation_id,
        "item_id": reservation.item_id,
        "user_id": current_user["id"] if current_user else None,
        "anonymous_name": reservation.anonymous_name,
        "created_at": now
    }
    
    reservations_db[reservation_id] = new_reservation
    
    await manager.broadcast({
        "type": "item_reserved",
        "item_id": reservation.item_id,
        "anonymous_name": reservation.anonymous_name
    }, item["wishlist_id"])
    
    return {"message": "Reserved successfully"}

# Contribution endpoints
@app.post("/api/contributions")
async def create_contribution(
    contribution: ContributionCreate,
    current_user: Optional[dict] = Depends(get_current_user)
):
    item = items_db.get(contribution.item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if not item["is_group_gift"]:
        raise HTTPException(status_code=400, detail="Item is not a group gift")
    
    contribution_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    new_contribution = {
        "id": contribution_id,
        "item_id": contribution.item_id,
        "user_id": current_user["id"] if current_user else None,
        "amount": contribution.amount,
        "anonymous_name": contribution.anonymous_name,
        "created_at": now
    }
    
    contributions_db[contribution_id] = new_contribution
    
    all_contributions = [c for c in contributions_db.values() if c["item_id"] == contribution.item_id]
    total = sum(c["amount"] for c in all_contributions)
    
    await manager.broadcast({
        "type": "contribution_added",
        "item_id": contribution.item_id,
        "amount": contribution.amount,
        "total_contributed": total,
        "anonymous_name": contribution.anonymous_name
    }, item["wishlist_id"])
    
    return {"message": "Contribution added successfully"}

# WebSocket endpoint
@app.websocket("/ws/{wishlist_id}")
async def websocket_endpoint(websocket: WebSocket, wishlist_id: str):
    await manager.connect(websocket, wishlist_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, wishlist_id)

# URL parsing endpoint
@app.post("/api/parse-url")
async def parse_url(url: str):
    return {
        "title": None,
        "price": None,
        "image_url": None,
        "description": None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
