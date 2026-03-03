import requests
import json

BASE_URL = "http://localhost:8000"

def test_bypass_restriction():
    # 1. Try a bypass login
    print("Attempting bypass login (t3st@example.com instead of test@example.com)...")
    payload = {
        "username": "t3st@example.com",
        "password": "wrongpassword"
    }
    
    response = requests.post(f"{BASE_URL}/login", data=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 403:
        print("\nSUCCESS: Restriction applied!")
        
        # 2. Try another login (even valid one should be blocked)
        print("\nAttempting subsequent login (even if correct)...")
        response2 = requests.post(f"{BASE_URL}/login", data=payload)
        print(f"Status Code: {response2.status_code}")
        print(f"Response: {response2.json()}")
    else:
        print("\nFAILURE: Restriction NOT applied as expected.")

if __name__ == "__main__":
    test_bypass_restriction()
