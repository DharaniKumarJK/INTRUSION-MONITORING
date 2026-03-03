import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def check():
    client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017'))
    db = client['Name_Morphing_Detection']
    user = await db.users.find_one()
    print(f"EMAIL:{user['email']}" if user else 'No user')

if __name__ == "__main__":
    asyncio.run(check())
