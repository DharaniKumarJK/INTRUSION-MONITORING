import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv
import json
from bson import json_util
from datetime import datetime

load_dotenv()

async def list_all():
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_uri)
    db = client['Name_Morphing_Detection']
    
    print(f"Current UTC: {datetime.utcnow()}")
    rs = await db.restricted_access.find().sort("created_at", -1).to_list(100)
    for r in rs:
        print(f"ID:{r['identifier']}|EXP:{r['expires_at'].isoformat()}|CRE:{r['created_at'].isoformat()}")

if __name__ == "__main__":
    asyncio.run(list_all())
