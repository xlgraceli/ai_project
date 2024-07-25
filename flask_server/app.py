from flask import Flask, request, jsonify
import json

app = Flask(__name__)


@app.route('/upload', methods=['POST'])
def upload_file():
    print("------------------")
    if request.is_json:
        data = request.get_json()
        processed_data = process_data(data)
        return jsonify(processed_data)
    else:
        return jsonify({"error": "Request must be JSON"}), 400


def process_data(data):
    return {"message": "Data received", "data": data}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)