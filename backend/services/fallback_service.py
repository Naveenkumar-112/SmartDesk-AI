def analyze_incident_fallback(issue):
    """
    Local rule-based incident analysis.
    Used when Gemini AI is unavailable.
    """

    text = issue.lower()

    category = "Other"
    priority = "Medium"
    summary = "An IT issue was reported by the employee."

    troubleshooting_steps = []

    # 1. Network-related issues
    if any(word in text for word in [
        "wifi", "wi-fi", "internet", "network", "router", "connection"
    ]):
        category = "Network"
        summary = "The employee is experiencing a network connectivity issue."

        troubleshooting_steps = [
            "Check whether Wi-Fi is enabled on the device.",
            "Restart the router and reconnect to the network.",
            "Forget the Wi-Fi network and connect again.",
            "Run the network troubleshooter."
        ]

    # 2. Hardware-related issues
    elif any(word in text for word in [
        "laptop", "keyboard", "mouse", "monitor", "screen", "printer"
    ]):
        category = "Hardware"
        summary = "The employee has reported a hardware-related issue."

        troubleshooting_steps = [
            "Check the physical connections and power supply.",
            "Restart the device.",
            "Check for visible hardware damage.",
            "Contact the IT support team if the issue continues."
        ]

    # 3. Software-related issues
    elif any(word in text for word in [
        "software", "application", "app", "crash", "not opening", "error"
    ]):
        category = "Software"
        summary = "The employee is experiencing a software-related issue."

        troubleshooting_steps = [
            "Restart the affected application.",
            "Check whether an application update is available.",
            "Restart the computer.",
            "Reinstall the application if necessary."
        ]

    # 4. Security-related issues
    elif any(word in text for word in [
        "virus", "malware", "hacked", "phishing", "security"
    ]):
        category = "Security"
        priority = "High"
        summary = "A possible IT security issue has been reported."

        troubleshooting_steps = [
            "Avoid clicking suspicious links or attachments.",
            "Disconnect the affected device from the network if compromise is suspected.",
            "Report the incident to the IT security team immediately."
        ]

    # 5. Access-related issues
    elif any(word in text for word in [
        "password", "login", "account", "access", "locked"
    ]):
        category = "Access"
        summary = "The employee is experiencing an account or access issue."

        troubleshooting_steps = [
            "Verify the username and password.",
            "Check whether Caps Lock is enabled.",
            "Use the official password reset process.",
            "Contact IT support if account access is still unavailable."
        ]

    # Default response
    if not troubleshooting_steps:
        troubleshooting_steps = [
            "Restart the affected device or application.",
            "Check whether the issue occurs again.",
            "Contact the IT support team for further assistance."
        ]

    return {
        "category": category,
        "priority": priority,
        "summary": summary,
        "troubleshootingSteps": troubleshooting_steps
    }
