import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def final_clear():
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_uri)
    db = client['Name_Morphing_Detection']
    
    result = await db.restricted_access.delete_many({})
    print(f"CLEARED:{result.deleted_count}")

if __name__ == "__main__":
    asyncio.run(final_clear())
