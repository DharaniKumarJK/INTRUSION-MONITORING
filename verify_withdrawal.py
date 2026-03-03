import asyncio
import os
import requests
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import bcrypt

load_dotenv()

async def verify_withdrawal():
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongodb_uri)
    db = client['Name_Morphing_Detection']
    
    email = "expiration_test@example.com"
    password = "password123"
    
    # 1. Create a dummy user
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    await db.users.update_one(
        {"email": email},
        {"$set": {
            "email": email,
            "hashed_password": hashed_password,
            "role": "user",
            "created_at": datetime.now(timezone.utc)
        }},
        upsert=True
    )
    print(f"User created: {email}")
    
    # 2. Add a very short restriction (5 seconds)
    short_expiry = datetime.now(timezone.utc) + timedelta(seconds=5)
    await db.restricted_access.update_one(
        {"identifier": email},
        {"$set": {
            "identifier": email,
            "reason": "test_expiry",
            "expires_at": short_expiry,
            "created_at": datetime.now(timezone.utc)
        }},
        upsert=True
    )
    print(f"Restriction added, expires at {short_expiry}")
    
    # 3. Try to login immediately (should be blocked)
    url = "http://localhost:8000/login"
    try:
        res = requests.post(url, data={"username": email, "password": password})
        print(f"Immediate login status: {res.status_code} (Expected 403)")
        
        # 4. Wait for expiration
        print("Waiting 7 seconds for restriction to withdraw...")
        await asyncio.sleep(7)
        
        # 5. Try to login again (should be allowed)
        res = requests.post(url, data={"username": email, "password": password})
        print(f"Post-expiration login status: {res.status_code} (Expected 200)")
        
        if res.status_code == 200:
            print("SUCCESS: Restriction was automatically withdrawn!")
        else:
            print(f"FAILURE: Still blocked with status {res.status_code}")
            
    except Exception as e:
        print(f"Error connecting: {e}")
        
    # Cleanup
    await db.users.delete_one({"email": email})
    await db.restricted_access.delete_one({"identifier": email})
    print("Cleanup complete.")

if __name__ == "__main__":
    asyncio.run(verify_withdrawal())
