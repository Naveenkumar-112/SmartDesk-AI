from datetime import datetime, timezone


def create_incident_document(employee_name, issue):
    """
    Creates a new incident document.
    """

    now = datetime.now(timezone.utc)

    incident = {
        "employeeName": employee_name.strip(),
        "issue": issue.strip(),
        "category": "Pending AI Classification",
        "priority": "Pending AI Analysis",
        "summary": "",
        "troubleshootingSteps": [],
        "status": "Open",
        "resolvedAt": None,
        "aiAnalysisStatus": "Pending",
        "analysisSource": "None",
        "createdAt": now,
        "updatedAt": now
    }

    return incident