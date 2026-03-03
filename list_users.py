import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def list_users():
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_uri)
    db = client['Name_Morphing_Detection']
    
    users = await db.users.find().to_list(100)
    print("--- USER LIST ---")
    for u in users:
        print(f"Email: {u['email']} | Role: {u['role']}")

if __name__ == "__main__":
    asyncio.run(list_users())
