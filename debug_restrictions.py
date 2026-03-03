import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv
from datetime import datetime, timezone
import json
from bson import json_util

load_dotenv()

async def check_db():
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    db_name = "Name_Morphing_Detection"
    client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_uri)
    
    # Try multiple database names commonly used in this project
    db_names = [db_name]
    
    for name in db_names:
        db = client[name]
        count = await db.restricted_access.count_documents({})
        if count > 0:
            print(f"Found {count} restrictions in database: {name}")
            latest = await db.restricted_access.find().sort("created_at", -1).to_list(10)
            print("\nLatest Restrictions:")
            for r in latest:
                created_at = r.get('created_at')
                expires_at = r.get('expires_at')
                
                # Make them aware if they are naive
                if created_at and created_at.tzinfo is None:
                    created_at = created_at.replace(tzinfo=timezone.utc)
                if expires_at and expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                    
                now = datetime.now(timezone.utc)
                
                print(f"Identifier: {r.get('identifier')}")
                print(f"  Created At: {created_at} (aware: {created_at.tzinfo is not None})")
                print(f"  Expires At: {expires_at} (aware: {expires_at.tzinfo is not None})")
                print(f"  Current UTC Now: {now}")
                
                if expires_at:
                    diff = expires_at - now
                    print(f"  Diff: {diff}")
                    if diff.total_seconds() > 0:
                        print("  STATUS: ACTIVE")
                    else:
                        print("  STATUS: EXPIRED")
            break
    else:
        print("No restrictions found in any attempted database name.")

if __name__ == "__main__":
    asyncio.run(check_db())
