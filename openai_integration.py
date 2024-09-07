import os
from openai import OpenAI

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
openai_client = OpenAI(api_key=OPENAI_API_KEY)

def send_openai_request(prompt: str) -> str:
    completion = openai_client.chat.completions.create(
        model="gpt-4", messages=[{"role": "user", "content": prompt}], max_tokens=100
    )
    content = completion.choices[0].message.content
    if not content:
        raise ValueError("OpenAI returned an empty response.")
    return content

def summarize_differences(differences):
    prompt = f"Summarize the following differences in a document:\n\n{differences}\n\nProvide a concise summary:"
    return send_openai_request(prompt)

def generate_suggestion(context, proposed_change):
    prompt = f"Given the following context and proposed change, suggest an improvement or alternative:\n\nContext: {context}\n\nProposed Change: {proposed_change}\n\nSuggestion:"
    return send_openai_request(prompt)
