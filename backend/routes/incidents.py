from flask import Blueprint, request, jsonify, session
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId

from backend.config.database import get_db
from backend.models.incident import create_incident_document
from backend.models.activity import create_activity_document

from backend.services.gemini_service import analyze_incident
from backend.services.fallback_service import analyze_incident_fallback
from backend.services.knowledge_base_service import search_knowledge_base

from backend.utils.auth import login_required, admin_required


incident_bp = Blueprint("incidents", __name__)


# ==========================================
# HELPER: SERIALIZE INCIDENT
# ==========================================

def serialize_incident(incident):

    incident["_id"] = str(incident["_id"])

    for field in ["createdAt", "updatedAt", "resolvedAt"]:

        value = incident.get(field)

        if value and hasattr(value, "isoformat"):
            incident[field] = value.isoformat()

    return incident


# ==========================================
# HELPER: GET AUTHENTICATED USER DETAILS
# ==========================================

def get_current_user():

    return {
        "user_id": str(session.get("user_id", "")),
        "name": session.get("name", ""),
        "email": session.get("email", "").strip().lower(),
        "role": session.get("role", "user").lower()
    }


# ==========================================
# 1. CREATE INCIDENT
# EMPLOYEE + ADMIN
# ==========================================

@incident_bp.route("/api/incidents", methods=["POST"])
@login_required
def create_incident():

    try:

        user = get_current_user()

        employee_name = user["name"].strip()
        user_id = user["user_id"]
        user_email = user["email"]

        data = request.get_json(silent=True) or {}

        issue = data.get("issue", "")

        if not isinstance(issue, str):
            issue = ""

        issue = issue.strip()

        if not employee_name or not issue:

            return jsonify({
                "success": False,
                "message": "Employee name and issue are required."
            }), 400

        db = get_db()

        # Create incident
        incident = create_incident_document(
            employee_name,
            issue
        )

        # Save ownership information
        incident["createdBy"] = user_id
        incident["createdByEmail"] = user_email

        incident["aiAnalysisStatus"] = "Processing"

        result = db["incidents"].insert_one(incident)

        incident_id = result.inserted_id

        # Record submission activity
        activity = create_activity_document(
            activity_type="Incident Submitted",
            description=f"{employee_name} submitted a new incident.",
            employee_name=employee_name,
            issue=issue,
            incident_id=incident_id
        )

        # Add ownership to activity
        activity["createdBy"] = user_id
        activity["createdByEmail"] = user_email

        db["activities"].insert_one(activity)

        # ==========================================
        # STEP 1: KNOWLEDGE BASE SEARCH
        # ==========================================

        print("Searching Knowledge Base...", flush=True)

        try:

            knowledge_result = search_knowledge_base(issue)

            if not knowledge_result:
                knowledge_result = {"found": False}

        except Exception as error:

            print("Knowledge Base Search Error:", error)

            knowledge_result = {"found": False}

        # ==========================================
        # STEP 2: GEMINI AI ANALYSIS
        # ==========================================

        print("Starting Gemini incident analysis...", flush=True)

        try:

            ai_result = analyze_incident(
                issue,
                knowledge_result
            )

        except Exception as error:

            print("Gemini Analysis Error:", error)

            ai_result = None

        # ==========================================
        # STEP 3: FALLBACK ANALYSIS
        # ==========================================

        if ai_result:

            analysis_result = ai_result
            analysis_source = "Gemini AI"
            activity_type = "Gemini AI Analysis"

        else:

            print(
                "Gemini unavailable. Starting fallback analysis...",
                flush=True
            )

            analysis_result = analyze_incident_fallback(issue)

            analysis_source = "Local Fallback Engine"
            activity_type = "Fallback Analysis"

        # ==========================================
        # STEP 4: SAVE AI ANALYSIS
        # ==========================================

        db["incidents"].update_one(
            {"_id": incident_id},
            {
                "$set": {
                    "category": analysis_result["category"],
                    "priority": analysis_result["priority"],
                    "summary": analysis_result["summary"],
                    "troubleshootingSteps": (
                        analysis_result["troubleshootingSteps"]
                    ),
                    "aiAnalysisStatus": "Completed",
                    "analysisSource": analysis_source,
                    "updatedAt": datetime.now(timezone.utc)
                }
            }
        )

        # ==========================================
        # STEP 5: RECORD AI ACTIVITY
        # ==========================================

        analysis_activity = create_activity_document(
            activity_type=activity_type,
            description=(
                f"{analysis_source} analysed the incident "
                f"submitted by {employee_name}."
            ),
            employee_name=employee_name,
            issue=issue,
            category=analysis_result["category"],
            priority=analysis_result["priority"],
            incident_id=incident_id,
            analysis_source=analysis_source
        )

        analysis_activity["createdBy"] = user_id
        analysis_activity["createdByEmail"] = user_email

        db["activities"].insert_one(analysis_activity)

        # ==========================================
        # STEP 6: RETURN SAVED INCIDENT
        # ==========================================

        saved_incident = db["incidents"].find_one({
            "_id": incident_id
        })

        return jsonify({
            "success": True,
            "message": "Incident submitted successfully.",
            "incident": serialize_incident(saved_incident)
        }), 201

    except Exception as error:

        print("Incident Creation Error:", error)

        return jsonify({
            "success": False,
            "message": "Failed to submit incident."
        }), 500


# ==========================================
# 2. GET INCIDENTS
# ADMIN: ALL INCIDENTS
# EMPLOYEE: OWN INCIDENTS
# ==========================================

@incident_bp.route("/api/incidents", methods=["GET"])
@login_required
def get_incidents():

    try:

        db = get_db()

        user = get_current_user()

        # Admin can access all incidents
        if user["role"] == "admin":

            query = {}

        else:

            user_id = user["user_id"]
            user_email = user["email"]

            ownership_conditions = []

            if user_id:
                ownership_conditions.append({
                    "createdBy": user_id
                })

            if user_email:
                ownership_conditions.append({
                    "createdByEmail": user_email
                })

            if not ownership_conditions:

                return jsonify({
                    "success": False,
                    "message": "Unable to identify authenticated user."
                }), 403

            query = {
                "$or": ownership_conditions
            }

        incidents = list(
            db["incidents"]
            .find(query)
            .sort("createdAt", -1)
        )

        serialized_incidents = [
            serialize_incident(incident)
            for incident in incidents
        ]

        return jsonify({
            "success": True,
            "count": len(serialized_incidents),
            "incidents": serialized_incidents
        }), 200

    except Exception as error:

        print("Get Incidents Error:", error)

        return jsonify({
            "success": False,
            "message": "Failed to retrieve incidents."
        }), 500


# ==========================================
# 3. UPDATE INCIDENT STATUS
# ADMIN ONLY
# ==========================================

@incident_bp.route(
    "/api/incidents/<incident_id>/status",
    methods=["PUT"]
)
@admin_required
def update_incident_status(incident_id):

    try:

        data = request.get_json(silent=True) or {}

        new_status = data.get("status", "")

        if not isinstance(new_status, str):
            new_status = ""

        new_status = new_status.strip()

        valid_statuses = [
            "Open",
            "In Progress",
            "Resolved"
        ]

        if new_status not in valid_statuses:

            return jsonify({
                "success": False,
                "message": "Invalid incident status."
            }), 400

        # Validate ObjectId
        try:

            object_id = ObjectId(incident_id)

        except (InvalidId, TypeError):

            return jsonify({
                "success": False,
                "message": "Invalid incident ID."
            }), 400

        db = get_db()

        incident = db["incidents"].find_one({
            "_id": object_id
        })

        if not incident:

            return jsonify({
                "success": False,
                "message": "Incident not found."
            }), 404

        now = datetime.now(timezone.utc)

        update_data = {
            "status": new_status,
            "updatedAt": now,
            "resolvedAt": (
                now if new_status == "Resolved" else None
            )
        }

        db["incidents"].update_one(
            {"_id": object_id},
            {"$set": update_data}
        )

        admin_name = session.get("name", "Admin")

        # Record status update activity
        activity = create_activity_document(
            activity_type="Status Updated",
            description=(
                f"Incident status changed to {new_status} "
                f"by {admin_name}."
            ),
            employee_name=admin_name,
            issue=incident.get("issue", ""),
            category=incident.get("category", ""),
            priority=incident.get("priority", ""),
            incident_id=object_id
        )

        activity["createdBy"] = str(session.get("user_id", ""))
        activity["createdByEmail"] = (
            session.get("email", "").strip().lower()
        )

        db["activities"].insert_one(activity)

        updated_incident = db["incidents"].find_one({
            "_id": object_id
        })

        return jsonify({
            "success": True,
            "message": "Incident status updated successfully.",
            "incident": serialize_incident(updated_incident)
        }), 200

    except Exception as error:

        print("Status Update Error:", error)

        return jsonify({
            "success": False,
            "message": "Failed to update incident status."
        }), 500


# ==========================================
# 4. DELETE INCIDENT
# ADMIN ONLY
# ==========================================

@incident_bp.route(
    "/api/incidents/<incident_id>",
    methods=["DELETE"]
)
@admin_required
def delete_incident(incident_id):

    try:

        # Validate ObjectId
        try:

            object_id = ObjectId(incident_id)

        except (InvalidId, TypeError):

            return jsonify({
                "success": False,
                "message": "Invalid incident ID."
            }), 400

        db = get_db()

        incident = db["incidents"].find_one({
            "_id": object_id
        })

        if not incident:

            return jsonify({
                "success": False,
                "message": "Incident not found."
            }), 404

        admin_name = session.get("name", "Admin")

        # Record deletion activity
        activity = create_activity_document(
            activity_type="Incident Deleted",
            description=(
                f"Incident submitted by "
                f"{incident.get('employeeName', 'Unknown Employee')} "
                f"was deleted by {admin_name}."
            ),
            employee_name=admin_name,
            issue=incident.get("issue", ""),
            category=incident.get("category", ""),
            priority=incident.get("priority", ""),
            incident_id=object_id,
            analysis_source=incident.get(
                "analysisSource",
                "None"
            )
        )

        activity["createdBy"] = str(session.get("user_id", ""))
        activity["createdByEmail"] = (
            session.get("email", "").strip().lower()
        )

        db["activities"].insert_one(activity)

        # Delete incident
        db["incidents"].delete_one({
            "_id": object_id
        })

        print("Incident deleted successfully!", flush=True)

        return jsonify({
            "success": True,
            "message": "Incident deleted successfully.",
            "incidentId": incident_id
        }), 200

    except Exception as error:

        print("Delete Incident Error:", error)

        return jsonify({
            "success": False,
            "message": "Failed to delete incident."
        }), 500