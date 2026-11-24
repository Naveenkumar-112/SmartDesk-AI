from datetime import datetime, timezone


VALID_ACTIVITY_TYPES = [
    "Incident Submitted",
    "Gemini AI Analysis",
    "Fallback Analysis",
    "Knowledge Base Search",
    "Incident Deleted",
    "Status Updated"
]


def create_activity_document(
    activity_type,
    description,
    employee_name="System",
    issue="",
    category="",
    priority="",
    incident_id="",
    analysis_source=""
):
    if activity_type not in VALID_ACTIVITY_TYPES:
        raise ValueError("Invalid activity type")

    now = datetime.now(timezone.utc)

    activity = {
        "activityType": activity_type,
        "employeeName": employee_name,
        "description": description,
        "issue": issue,
        "category": category,
        "priority": priority,
        "incidentId": str(incident_id),
        "analysisSource": analysis_source,
        "createdAt": now,
        "updatedAt": now
    }

    return activity