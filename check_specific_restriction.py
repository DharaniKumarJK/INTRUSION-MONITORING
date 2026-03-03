import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv
import json
from bson import json_util

load_dotenv()

async def check_restriction():
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_uri)
    db = client['Name_Morphing_Detection']
    
    r = await db.restricted_access.find_one({"identifier": "jkdharani6@gmail.com"})
    if r:
        print("RESTRICTION_FOUND")
        print(json.dumps(r, default=json_util.default, indent=2))
    else:
        print("RESTRICTION_NOT_FOUND")

if __name__ == "__main__":
    asyncio.run(check_restriction())
