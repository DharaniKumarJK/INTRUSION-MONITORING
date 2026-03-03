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

def levenshtein_distance(s1: str, s2: str) -> int:
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]

def calculate_similarity(s1: str, s2: str) -> float:
    longer = s1 if len(s1) > len(s2) else s2
    if len(longer) == 0:
        return 1.0
    return (len(longer) - levenshtein_distance(s1.lower(), s2.lower())) / len(longer)

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
            "match_percentage": calculate_similarity(attempted, actual)
        }
    similarity = calculate_similarity(attempted, actual)
    if 0.7 < similarity < 1.0:
        return True, {
            "type": "high_similarity",
            "attempted_value": attempted,
            "actual_value": actual,
            "match_percentage": similarity
        }
    return False, {}

# Test Cases
test_cases = [
    ("jkdharan16@gmail.com", "jkdharani6@gmail.com"),
    ("adm1n@example.com", "admin@example.com"),
    ("t3st@test.com", "test@test.com"),
    ("jkdharani6@gmail.com", "jkdharani6@gmail.com")
]

with open("test_results.txt", "w") as f:
    for attempted, actual in test_cases:
        is_bypass, details = detect_bypass_attempt(attempted, actual)
        f.write(f"Attempted: {attempted} | Actual: {actual}\n")
        f.write(f"  Bypass Detected: {is_bypass}\n")
        if is_bypass:
            substitutions = details.get("substitutions", [])
            is_char_sub = any(s.get("type") == "character_substitution" for s in substitutions)
            f.write(f"  Is Character Substitution: {is_char_sub}\n")
            f.write(f"  Details: {details}\n")
        f.write("-" * 40 + "\n")
