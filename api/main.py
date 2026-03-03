from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import spacy
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from bson import ObjectId
import logging
import time
from fastapi import Request

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("api")

from .database import get_database
from .models import UserCreate, UserInDB, Token, LoginAttempt, UserProfile, RestrictedAccess
from .auth import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    get_current_user
)
app = FastAPI()

# Simple CORS for dev - allow everything to rule out CORS as the cause
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False, # Credentials can't be used with "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    logger.info(
        f"Method: {request.method} Path: {request.url.path} "
        f"Status: {response.status_code} Duration: {duration:.2f}s"
    )
    return response

# Note: allow_origins=["*"] with allow_credentials=True is technically not allowed by CORS spec
# but FastAPI allows it if you don't use credentials, or you can use allow_origin_regex.
# Let's use a more robust approach:
# If you get a CORS error on mobile, we can specifically add the IP.
# For now, let's restore the print logs to see if requests are even arriving.

# --- SECURITY UTILS ---

COMMON_SUBSTITUTIONS = {
    'a': ['@', '4'],
    'e': ['3'],
    'i': ['1', '!', '|'],
    'o': ['0'],
    's': ['5', '$'],
    't': ['7', '+'],
    'l': ['1', '|'],
    'g': ['9'],
    'b': ['8'],
}

def levenshtein_distance(s1: str, s2: str) -> int:
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)

    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row

    return previous_row[-1]

def calculate_similarity(s1: str, s2: str) -> float:
    longer = s1 if len(s1) > len(s2) else s2
    if len(longer) == 0:
        return 1.0
    return (len(longer) - levenshtein_distance(s1.lower(), s2.lower())) / len(longer)

def detect_bypass_attempt(attempted: str, actual: str):
    attempted_lower = attempted.lower()
    actual_lower = actual.lower()

    if attempted_lower == actual_lower:
        return False, {}

    substitutions = []
    for i in range(min(len(actual_lower), len(attempted_lower))):
        act_char = actual_lower[i]
        att_char = attempted_lower[i]
        if act_char != att_char:
            if act_char in COMMON_SUBSTITUTIONS and att_char in COMMON_SUBSTITUTIONS[act_char]:
                substitutions.append({
                    "position": i,
                    "original": act_char,
                    "substitution": att_char,
                    "type": "character_substitution"
                })

    if substitutions:
        return True, {
            "substitutions": substitutions,
            "attempted_value": attempted,
            "actual_value": actual,
            "match_percentage": calculate_similarity(attempted, actual)
        }

    similarity = calculate_similarity(attempted, actual)
    if 0.7 < similarity < 1.0:
        return True, {
            "type": "high_similarity",
            "attempted_value": attempted,
            "actual_value": actual,
            "match_percentage": similarity
        }

    return False, {}

# Load the spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = None

# --- AUTH ENDPOINTS ---

@app.post("/signup", response_model=Token)
async def signup(user: UserCreate):
    try:
        db = get_database()
        existing_user = await db.users.find_one({"email": user.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_password = get_password_hash(user.password)
        user_in_db = {
            "email": user.email,
            "hashed_password": hashed_password,
            "role": user.role,
            "created_at": datetime.now(timezone.utc)
        }
        result = await db.users.insert_one(user_in_db)
        
        access_token = create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login", response_model=Token)
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        db = get_database()
        client_ip = request.client.host
        
        # Look up the user first to check their role
        user = await db.users.find_one({"email": form_data.username})
        print(f"DEBUG LOGIN: username='{form_data.username}' found={user is not None}")
        if user:
            print(f"DEBUG LOGIN: role='{user.get('role')}'")
        
        # Check for active restrictions for THIS specific username
        # Admins are exempt from restrictions so they can always investigate bypasses
        is_admin = user and user.get("role") == "admin"
        print(f"DEBUG LOGIN: is_admin={is_admin}")
        
        if not is_admin:
            restriction = await db.restricted_access.find_one({
                "identifier": form_data.username,
                "expires_at": {"$gt": datetime.now(timezone.utc)}
            })
            print(f"DEBUG LOGIN: restriction_found={restriction is not None}")
            
            if restriction:
                print(f"DEBUG LOGIN: Restriction details: identifier='{restriction.get('identifier')}' expires='{restriction.get('expires_at')}'")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your access has been restricted for 10mins as you are trying to bypass"
                )
        else:
            print("DEBUG LOGIN: Skipping restriction check for admin")
        
        if not user or not verify_password(form_data.password, user["hashed_password"]):
            print(f"DEBUG LOGIN: Password verify failed for {form_data.username}")
            # Check for bypass attempt on failure
            users = await db.users.find({}, {"email": 1}).to_list(100)
            for u in users:
                is_bypass, details = detect_bypass_attempt(form_data.username, u["email"])
                if is_bypass:
                    # Only restrict for character substitutions as per user request
                    substitutions = details.get("substitutions", [])
                    is_char_sub = any(s.get("type") == "character_substitution" for s in substitutions)
                    if is_char_sub:
                        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
                        # Restrict the specific username that attempted the bypass
                        await db.restricted_access.insert_one({
                            "identifier": form_data.username,
                            "reason": "bypass_attempt",
                            "expires_at": expires_at,
                            "created_at": datetime.now(timezone.utc)
                        })
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="Your access has been restricted for 10mins as you are trying to bypass"
                        )
            
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        
        access_token = create_access_token(data={"sub": user["email"]})
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "email": current_user["email"],
        "role": current_user["role"],
        "created_at": current_user["created_at"]
    }

# --- DATA ENDPOINTS ---

@app.get("/users", response_model=List[UserProfile])
async def get_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = get_database()
    users = await db.users.find().to_list(1000)
    return [
        {
            "id": str(u["_id"]),
            "email": u["email"],
            "role": u["role"],
            "created_at": u["created_at"]
        } for u in users
    ]

@app.post("/login-attempts")
async def create_login_attempt(attempt: LoginAttempt):
    db = get_database()
    
    # Run bypass detection
    if attempt.actual_username:
        # LOGGED IN CASE: Direct comparison
        bypass_detected, bypass_details = detect_bypass_attempt(
            attempt.attempted_username, 
            attempt.actual_username
        )
        attempt.bypass_detected = bypass_detected
        attempt.bypass_details = bypass_details
    else:
        # FAILED LOGIN CASE: Proactive bypass detection
        # Check if the attempted username is a morphed version of ANY existing user
        # This allows detecting "probing" attacks.
        users = await db.users.find({}, {"email": 1, "_id": 1}).to_list(100)
        for user in users:
            is_bypass, details = detect_bypass_attempt(attempt.attempted_username, user["email"])
            if is_bypass:
                attempt.bypass_detected = True
                attempt.bypass_details = details
                attempt.actual_user_id = str(user["_id"])
                break

    attempt_dict = attempt.dict(exclude={"id"})
    result = await db.login_attempts.insert_one(attempt_dict)
    
    return {
        "id": str(result.inserted_id),
        "bypass_detected": attempt.bypass_detected
    }

@app.get("/login-attempts", response_model=List[LoginAttempt])
async def get_login_attempts(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = get_database()
    attempts = await db.login_attempts.find().sort("created_at", -1).to_list(100)
    
    res = []
    for a in attempts:
        a["id"] = str(a.pop("_id"))
        res.append(LoginAttempt(**a))
    return res

@app.get("/restrictions", response_model=List[RestrictedAccess])
async def get_restrictions(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = get_database()
    restrictions = await db.restricted_access.find().sort("created_at", -1).to_list(100)
    
    res = []
    for r in restrictions:
        r["id"] = str(r.pop("_id"))
        res.append(RestrictedAccess(**r))
    return res

# --- SPACY ENDPOINT ---

class TextRequest(BaseModel):
    text: str

@app.post("/process")
async def process_text(request: TextRequest):
    if nlp is None:
        raise HTTPException(status_code=500, detail="spaCy model not found")
    
    doc = nlp(request.text)
    entities = [{"text": ent.text, "label": ent.label_} for ent in doc.ents]
    tokens = [token.text for token in doc]
    
    return {"entities": entities, "tokens": tokens}

@app.get("/")
async def root():
    return {"message": "AI & MongoDB API is running"}
