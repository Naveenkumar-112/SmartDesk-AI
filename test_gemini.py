from backend.services.gemini_service import test_gemini_connection

print("Testing Gemini API...")

result = test_gemini_connection()

if result:
    print("Gemini Connected Successfully!")
    print("Gemini Response:", result)
else:
    print("Gemini Connection Failed!")