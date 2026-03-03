import requests

def test_admin_dashboard_data():
    login_url = "http://localhost:8000/login"
    login_payload = {
        "username": "test@example.com",
        "password": "admin123" 
    }
    
    # Try common passwords if it fails? No, I should find the password in the code or help the user.
    # In verify_admin_bypass.py I created a dummy admin with password123.
    # Let's try test@example.com with password.
    
    print("Attempting admin login...")
    try:
        response = requests.post(login_url, data=login_payload)
        print(f"Login Status: {response.status_code}")
        if response.status_code == 200:
            token = response.json().get("access_token")
            headers = {"Authorization": f"Bearer {token}"}
            
            # Fetch attempts
            attempts_res = requests.get("http://localhost:8000/login-attempts", headers=headers)
            print(f"Attempts Status: {attempts_res.status_code}")
            if attempts_res.status_code == 200:
                print(f"Found {len(attempts_res.json())} attempts.")
            
            # Fetch restrictions
            restrictions_res = requests.get("http://localhost:8000/restrictions", headers=headers)
            print(f"Restrictions Status: {restrictions_res.status_code}")
            if restrictions_res.status_code == 200:
                print(f"Found {len(restrictions_res.json())} restrictions.")
        else:
            print(f"Login failed: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_admin_dashboard_data()
