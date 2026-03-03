import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def clear_restrictions():
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_uri)
    db = client['Name_Morphing_Detection']
    
    result = await db.restricted_access.delete_many({})
    print(f"Cleared {result.deleted_count} restrictions from the database.")

if __name__ == "__main__":
    asyncio.run(clear_restrictions())
