import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def debug_auth():
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_uri)
    db = client['Name_Morphing_Detection']
    
    print("--- Admin Users ---")
    admins = await db.users.find({"role": "admin"}).to_list(100)
    for a in admins:
        print(f"Email: {a['email']}, Role: {a['role']}")
        
    print("\n--- All Restrictions ---")
    restrictions = await db.restricted_access.find().to_list(100)
    for r in restrictions:
        print(f"Identifier: {r['identifier']}, Reason: {r['reason']}, Expires: {r['expires_at']}")

if __name__ == "__main__":
    asyncio.run(debug_auth())
