import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def check_counts():
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_uri)
    db = client['Name_Morphing_Detection']
    
    attempts = await db.login_attempts.count_documents({})
    restrictions = await db.restricted_access.count_documents({})
    users = await db.users.count_documents({})
    
    print(f"Total Users: {users}")
    print(f"Total Login Attempts: {attempts}")
    print(f"Total Active/Past Restrictions: {restrictions}")

if __name__ == "__main__":
    asyncio.run(check_counts())
