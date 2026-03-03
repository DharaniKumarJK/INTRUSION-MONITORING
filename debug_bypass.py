COMMON_SUBSTITUTIONS = {
    'a': ['@', '4'],
    'e': ['3'],
    'i': ['1', '!', '|'],
    'o': ['0'],
    's': ['5', '$'],
    't': ['7', '+'],
    'l': ['1', '|'],
    'g': ['9'],
    'b': ['8'],
}

def detect_bypass_attempt(attempted: str, actual: str):
    attempted_lower = attempted.lower()
    actual_lower = actual.lower()

    if attempted_lower == actual_lower:
        return False, {}

    substitutions = []
    for i in range(min(len(actual_lower), len(attempted_lower))):
        act_char = actual_lower[i]
        att_char = attempted_lower[i]
        if act_char != att_char:
            if act_char in COMMON_SUBSTITUTIONS and att_char in COMMON_SUBSTITUTIONS[act_char]:
                substitutions.append({
                    "position": i,
                    "original": act_char,
                    "substitution": att_char,
                    "type": "character_substitution"
                })

    if substitutions:
        return True, {
            "substitutions": substitutions,
            "attempted_value": attempted,
            "actual_value": actual,
        }

    return False, {}

if __name__ == "__main__":
    attempt = "t3st@example.com"
    actual = "test@example.com"
    is_bypass, details = detect_bypass_attempt(attempt, actual)
    print(f"Is Bypass: {is_bypass}")
    print(f"Details: {details}")
