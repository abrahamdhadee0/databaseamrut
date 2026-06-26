import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
print(f"Checking Key: {api_key[:10]}...") # Prints first 10 chars to verify

genai.configure(api_key=api_key)

try:
    print("Asking Google for available models...")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f" - Found: {m.name}")
except Exception as e:
    print(f"ERROR: {e}")