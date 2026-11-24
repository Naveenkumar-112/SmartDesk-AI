from backend.services.gemini_service import analyze_incident

issue = "My laptop is not connecting to Wi-Fi"

print("Testing AI Incident Analysis...")
print("Employee Issue:", issue)

result = analyze_incident(issue)

if result:

    print("\nAI Analysis Successful!")

    print("\nCategory:", result["category"])
    print("Priority:", result["priority"])
    print("Summary:", result["summary"])

    print("\nTroubleshooting Steps:")

    for step in result["troubleshootingSteps"]:
        print("-", step)

else:
    print("\nAI Analysis Failed!")