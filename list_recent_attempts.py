import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv
import json
from bson import json_util
from datetime import datetime

load_dotenv()

async def list_attempts():
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_uri)
    db = client['Name_Morphing_Detection']
    
    print(f"Current UTC: {datetime.utcnow()}")
    rs = await db.login_attempts.find().sort("created_at", -1).to_list(10)
    for r in rs:
        print(f"USER:{r['attempted_username']}|SUCCESS:{r['attempt_success']}|BYPASS:{r['bypass_detected']}|TIME:{r['created_at'].isoformat()}")

if __name__ == "__main__":
    asyncio.run(list_attempts())
