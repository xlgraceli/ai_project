import requests
import json

current_server_url = "https://server-url/v1/engines/Phi-3-mini-4k-instruct/completions"
destination_server_url = "https://destination-server.com/endpoint"

payload = {
    "prompt": "how to make an apple pie without apple?",
    "max_tokens": 50,
    "temperature": 0.7
}

response = requests.post(current_server_url, json=payload, headers={"Content-Type": "application/json"})

if response.status_code == 200:
    print("Received response from the current server:")
    print(response.json())

    try:
        forward_response = requests.post(destination_server_url, json=response.json())
        if forward_response.status_code == 200:
            print("Successfully forwarded the response to the destination server.")
        else:
            print(f"Failed to forward the response. Status code: {forward_response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Error while forwarding the response: {e}")
else:
    print(f"Failed to get a valid response from the current server. Status code: {response.status_code}")
    print(response.text)

