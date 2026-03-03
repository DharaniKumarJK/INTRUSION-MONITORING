import asyncio
import os
import requests
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

async def verify():
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongodb_uri)
    db = client['Name_Morphing_Detection']
    
    # 1. Create a dummy admin
    email = "admin_bypass_test@example.com"
    password = "password123"
    import bcrypt
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    await db.users.update_one(
        {"email": email},
        {"$set": {
            "email": email,
            "hashed_password": hashed_password,
            "role": "admin",
            "created_at": datetime.utcnow()
        }},
        upsert=True
    )
    print(f"Ensured admin user exists: {email}")
    
    # 2. Add a restriction for this admin
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    await db.restricted_access.update_one(
        {"identifier": email},
        {"$set": {
            "identifier": email,
            "reason": "test_restriction",
            "expires_at": expires_at,
            "created_at": datetime.utcnow()
        }},
        upsert=True
    )
    print(f"Ensured restriction exists for: {email}")
    
    # 3. Try to login via API
    url = "http://localhost:8000/login"
    payload = {
        "username": email,
        "password": password
    }
    
    # Give the server a moment to reload if needed
    await asyncio.sleep(2)
    
    try:
        response = requests.post(url, data=payload)
        print(f"Login Response Status: {response.status_code}")
        if response.status_code == 200:
            print("SUCCESS: Admin bypassed restriction!")
        elif response.status_code == 403:
            print("FAILURE: Admin was restricted!")
        else:
            print(f"Unexpected status: {response.status_code}, {response.text}")
    except Exception as e:
        print(f"Error connecting to server: {e}")
        
    # Cleanup
    await db.users.delete_one({"email": email})
    await db.restricted_access.delete_one({"identifier": email})
    print("Cleanup complete.")

if __name__ == "__main__":
    asyncio.run(verify())
