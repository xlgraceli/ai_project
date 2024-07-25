import requests
import json

url = 'http://146.190.115.255:8081/upload'
headers = {'Content-Type': 'application/json'}
data = {
    "name": "John",
    "age": 30,
    "city": "New York",
    "hasChildren": "No",
    "titles": ["engineer", "programmer"]
}

json_data = json.dumps(data, indent=4)
response = requests.post(url, json=data, headers=headers)
print(response.json())
