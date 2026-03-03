import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv
import bcrypt

load_dotenv()

async def reset_password():
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_uri)
    db = client['Name_Morphing_Detection']
    
    password = "admin123"
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    await db.users.update_one(
        {"email": "test@example.com"},
        {"$set": {"hashed_password": hashed, "role": "admin"}}
    )
    print(f"Password reset for test@example.com to 'admin123'")

if __name__ == "__main__":
    asyncio.run(reset_password())
