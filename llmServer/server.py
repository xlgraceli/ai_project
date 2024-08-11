from flask import Flask, request, jsonify
from vllm import LLM, SamplingParams
import torch

app = Flask(__name__)

# Initialize vLLM with the desired model
llm = LLM(
    model="microsoft/Phi-3-mini-4k-instruct",
    dtype=torch.float16,
    tensor_parallel_size=1, 
    enforce_eager=True, 
)

@app.route('/v1/engines/<string:model_id>/completions', methods=['POST'])
def completions(model_id):
    # Extract data from the request
    data = request.json
    prompt = data.get('prompt', '')
    max_tokens = data.get('max_tokens', 500)
    temperature = data.get('temperature', 0.7)
    
    # Set up the sampling parameters
    sampling_params = SamplingParams(max_tokens=max_tokens, temperature=temperature)
    
    # Generate the text
    results = llm.generate(prompt, sampling_params)
    
    # Extract the generated text
    try:
        generated_text = results[0].outputs[0].text
        response = {
            "model": model_id,
            "choices": [{"text": generated_text}]
        }
    except (IndexError, AttributeError) as e:
        response = {"error": f"An error occurred: {e}"}
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6000)

