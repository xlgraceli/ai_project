from flask import Flask, request, jsonify
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

app = Flask(__name__)

model_name = "microsoft/Phi-3-mini-4k-instruct"
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype="auto",
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

    generated_text = text_generation_pipeline(
        prompt,
        max_new_tokens=max_tokens,
        temperature=temperature
    )[0]['generated_text']

    return jsonify({
        'choices': [{'text': generated_text}]
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6000)

