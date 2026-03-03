import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def find_admin():
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_uri)
    db = client['Name_Morphing_Detection']
    
    admin = await db.users.find_one({"role": "admin"})
    if admin:
        print(f"ADMIN_EMAIL:{admin['email']}")
    else:
        print("NO_ADMIN_FOUND")

if __name__ == "__main__":
    asyncio.run(find_admin())
