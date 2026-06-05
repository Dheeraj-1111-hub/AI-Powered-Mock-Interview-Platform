import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()


def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        print("GROQ_API_KEY not found")
        return None

    return Groq(api_key=api_key)


client = get_groq_client()


def call_groq(prompt, system_message=None, temperature=0.2, json_mode=True):
    global client

    if not client:
        client = get_groq_client()

    if not client:
        raise Exception("Groq client initialization failed. API key missing.")

    try:
        response_format = {"type": "json_object"} if json_mode else None

        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=temperature,
            max_tokens=2048,
            response_format=response_format
        )

        return response.choices[0].message.content

    except Exception as e:
        print("Groq API Error:", str(e))
        raise Exception(f"Groq API Error: {str(e)}")