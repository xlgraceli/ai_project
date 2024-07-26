# import requests
# import json

# url = 'http://146.190.115.255:8081/upload'
# headers = {'Content-Type': 'application/json'}
# data = {
#     "name": "John",
#     "age": 30,
#     "city": "New York",
#     "hasChildren": "No",
#     "titles": ["engineer", "programmer"]
# }

# json_data = json.dumps(data, indent=4)
# response = requests.post(url, json=data, headers=headers)
# print(response.json())

import dlib

predictor_path = 'D:/lixinling/iDC Planning/AI Intern Project/AI Project/ai_project/flask_server/shape_predictor_81_face_landmarks.dat'

try:
    detector = dlib.get_frontal_face_detector()
    predictor = dlib.shape_predictor(predictor_path)
    print("IT OPENS!!!")
except RuntimeError as e:
    print(f"Error loading shape predictor: {e}")

