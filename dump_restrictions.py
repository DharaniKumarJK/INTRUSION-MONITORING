import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv
import json
from bson import json_util
from datetime import datetime

load_dotenv()

async def dump_all():
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_uri)
    db = client['Name_Morphing_Detection']
    
    rs = await db.restricted_access.find().sort("created_at", -1).to_list(100)
    data = []
    for r in rs:
        data.append({
            "identifier": r['identifier'],
            "expires_at": r['expires_at'].isoformat(),
            "created_at": r['created_at'].isoformat()
        })
    
    with open("restrictions_dump.json", "w") as f:
        json.dump(data, f, indent=2)
    print(f"Dumped {len(data)} restrictions to restrictions_dump.json")

if __name__ == "__main__":
    asyncio.run(dump_all())
