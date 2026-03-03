import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def debug_auth():
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_uri)
    db = client['Name_Morphing_Detection']
    
    print("--- Users ---")
    users = await db.users.find().to_list(100)
    for u in users:
        print(f"Email: {u['email']}, Role: {u['role']}")
        
    print("\n--- Restrictions ---")
    restrictions = await db.restricted_access.find().to_list(100)
    for r in restrictions:
        print(f"Identifier: {r['identifier']}, Expires: {r['expires_at']}")

if __name__ == "__main__":
    asyncio.run(debug_auth())
