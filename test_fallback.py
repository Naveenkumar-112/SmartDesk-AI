from backend.services.fallback_service import analyze_incident_fallback

issue = "My laptop is not connecting to Wi-Fi"

print("Testing Fallback AI Engine...")
print("Employee Issue:", issue)

result = analyze_incident_fallback(issue)

print("\nFallback Analysis Successful!")
print("Category:", result["category"])
print("Priority:", result["priority"])
print("Summary:", result["summary"])

print("\nTroubleshooting Steps:")

for step in result["troubleshootingSteps"]:
    print("-", step)