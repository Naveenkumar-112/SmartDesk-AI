import os
import json
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables
ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / ".env")

# Get Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env")

# Create Gemini client
client = genai.Client(
    api_key=GEMINI_API_KEY,
    http_options=types.HttpOptions(
        timeout=120000
    )
)


# Test Gemini connection
def test_gemini_connection():
    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents="Say: SmartDesk AI Gemini connection successful!"
        )

        return response.text

    except Exception as error:
        print("Gemini API Error:", error)
        return None


# Analyse employee incident using Gemini and Knowledge Base
def analyze_incident(issue, knowledge_result=None):

    try:
        print("Gemini is analysing the incident...", flush=True)

        # Prepare Knowledge Base context
        knowledge_context = ""

        if knowledge_result and knowledge_result.get("found"):

            knowledge_context = f"""
            Relevant Knowledge Base Article:

            Article Title: {knowledge_result.get("title", "N/A")}
            Article Category: {knowledge_result.get("category", "N/A")}
            Suggested Solution: {knowledge_result.get("solution", "N/A")}
            Relevance Score: {knowledge_result.get("relevanceScore", 0)}

            Use this article as supporting information.
            Only use solutions that are relevant to the employee's issue.
            """

        else:
            knowledge_context = """
            No relevant Knowledge Base article was found.
            Analyse the issue using your own IT support knowledge.
            """

        # Gemini prompt
        prompt = f"""
        You are an intelligent AI IT support assistant
        for an organization's employee helpdesk system.

        Analyse the following employee IT issue:

        Issue: {issue}

        {knowledge_context}

        Your task is to classify the incident and provide
        useful troubleshooting recommendations.

        CATEGORY RULES:

        1. Category must be one of:
           Hardware, Software, Network, Security, Access, Other.

        2. Classify based on the actual problem.
           Do not classify something as Hardware just
           because the employee mentions a laptop.

        3. Software installation and application problems
           should generally be classified as Software.

        4. Wi-Fi, internet, and connectivity problems
           should generally be classified as Network.

        5. Password, login, and account permission problems
           should generally be classified as Access.

        6. Malware, phishing, viruses, and hacking incidents
           should be classified as Security.

        PRIORITY RULES:

        1. Priority must be one of:
           Low, Medium, High, Critical.

        2. Use Critical only for severe incidents such as
           major service outages, serious security incidents,
           or significant data loss.

        3. Consider the impact and urgency of the issue.

        KNOWLEDGE BASE RULES:

        1. Use the Knowledge Base article when it is relevant.
        2. Do not blindly copy an unrelated article.
        3. Combine relevant Knowledge Base information
           with your own IT support knowledge.
        4. Do not invent facts about the employee's issue.

        RESPONSE RULES:

        1. Provide a clear and short summary.
        2. Provide 3 to 5 practical troubleshooting steps.
        3. For serious security issues, recommend contacting
           the IT security team immediately.
        4. Do not include Markdown formatting.
        5. Return valid JSON only.

        Return ONLY a JSON object with these fields:

        {{
            "category": "Network",
            "priority": "High",
            "summary": "Short description of the issue",
            "troubleshootingSteps": [
                "First troubleshooting step",
                "Second troubleshooting step",
                "Third troubleshooting step"
            ]
        }}
        """

        # Generate AI response
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        # Convert JSON response into Python dictionary
        result = json.loads(response.text)

        print("Incident analysis completed!", flush=True)

        return result

    except Exception as error:
        print("Incident Analysis Error:", error)
        return None
