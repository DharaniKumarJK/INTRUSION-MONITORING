import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def test_api():
    # Check how Pydantic serializes an aware datetime in this environment.
    from datetime import datetime, timezone, timedelta
    from pydantic import BaseModel
    
    class TestModel(BaseModel):
        dt: datetime
        
    now_aware = datetime.now(timezone.utc)
    model = TestModel(dt=now_aware)
    print(f"Pydantic JSON: {model.json()}")
    
    # Let's also check a naive UTC one (how Motor might return it)
    now_naive = datetime.utcnow()
    model_naive = TestModel(dt=now_naive)
    print(f"Pydantic Naive JSON: {model_naive.json()}")

if __name__ == "__main__":
    asyncio.run(test_api())
