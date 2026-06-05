import requests
import json

payload = {
    "stats": {"totalInterviews": 4, "totalCoding": 1, "averageScore": 6.75, "streak": 2},
    "activity": [
        {"id": "6a22451163cb88365fb5fde6", "type": "optimization_detected", "title": "Readiness Recalibrated", "description": "Readiness adjusted to 2", "date": "2026-06-05T03:40:01.664Z", "tags": [2]}
    ],
    "userProfile": {"role": "Full Stack Engineer", "skills": ["React"], "experience": "Entry Level (0-2 yrs)"}
}

try:
    response = requests.post("http://localhost:8000/api/dashboard/recommendations", json=payload)
    print("Status:", response.status_code)
    print("Body:", response.text)
except Exception as e:
    print("Error:", e)
