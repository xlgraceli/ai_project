from flask import Flask, request, jsonify
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

app = Flask(__name__)

model_name = "microsoft/Phi-3-mini-4k-instruct"
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    device_map="auto",
    torch_dtype=torch.float16,  # Use half-precision to save memory
    trust_remote_code=True,
)

tokenizer = AutoTokenizer.from_pretrained(model_name)

text_generation_pipeline = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer
)

@app.route('/v1/engines/<string:model_id>/completions', methods=['POST'])
def completions(model_id):
    data = request.json
    prompt = data.get('prompt', '')
    max_tokens = data.get('max_tokens', 500)
    temperature = data.get('temperature', 0.7)

    sampling_params = SamplingParams(max_tokens=max_tokens, temperature=temperature)
    results = llm.generate(prompt, sampling_params)

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

