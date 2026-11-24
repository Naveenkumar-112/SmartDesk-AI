
from flask import Blueprint, jsonify, session

from backend.config.database import get_db
from backend.utils.auth import login_required


print("LOADED ACTIVITIES FILE:", __file__, flush=True)

activity_bp = Blueprint("activities", __name__)


# ==================================================
# GET ACTIVITIES - ROLE-BASED ACCESS CONTROL
# ==================================================

@activity_bp.route("/api/activities", methods=["GET"])
@login_required
def get_activities():

    print("\n========== ACTIVITY ROUTE DEBUG ==========", flush=True)

    try:

        # ------------------------------------------
        # 1. CONNECT TO DATABASE
        # ------------------------------------------

        db = get_db()
        activities_collection = db["activities"]

        # ------------------------------------------
        # 2. GET AUTHENTICATED USER DETAILS
        # ------------------------------------------

        user_id = str(session.get("user_id", "")).strip()
        user_email = str(session.get("email", "")).strip().lower()
        user_role = str(session.get("role", "user")).strip().lower()

        print("ACTIVITY ROUTE IS EXECUTING!", flush=True)
        print("USER ID:", user_id, flush=True)
        print("USER EMAIL:", user_email, flush=True)
        print("USER ROLE:", user_role, flush=True)

        # ------------------------------------------
        # 3. VALIDATE USER INFORMATION
        # ------------------------------------------

        if not user_id:
            return jsonify({
                "success": False,
                "message": "Authenticated user ID is missing."
            }), 401

        # ------------------------------------------
        # 4. BUILD ROLE-BASED DATABASE QUERY
        # ------------------------------------------

        if user_role == "admin":

            # Admin can access all activity records.
            query = {}

            print("ACCESS TYPE: ADMIN", flush=True)

        else:

            # Employees can access only activities
            # explicitly associated with their account.

            ownership_conditions = []

            ownership_conditions.append({
                "createdBy": user_id
            })

            if user_email:

                ownership_conditions.append({
                    "createdByEmail": user_email
                })

            query = {
                "$or": ownership_conditions
            }

            print("ACCESS TYPE: EMPLOYEE", flush=True)

        print("ACTIVITY QUERY:", query, flush=True)

        # ------------------------------------------
        # 5. FETCH ACTIVITIES
        # ------------------------------------------

        activities = list(
            activities_collection
            .find(query)
            .sort("createdAt", -1)
        )

        print("ACTIVITIES FOUND:", len(activities), flush=True)

        # ------------------------------------------
        # 6. SERIALIZE MONGODB DOCUMENTS
        # ------------------------------------------

        serialized_activities = []

        for activity in activities:

            # Convert MongoDB ObjectId.
            activity["_id"] = str(activity["_id"])

            # Convert datetime fields.
            for field in ["createdAt", "updatedAt"]:

                value = activity.get(field)

                if value and hasattr(value, "isoformat"):

                    activity[field] = value.isoformat()

            serialized_activities.append(activity)

        # ------------------------------------------
        # 7. RETURN SUCCESS RESPONSE
        # ------------------------------------------

        print("ACTIVITY REQUEST COMPLETED SUCCESSFULLY", flush=True)
        print("==========================================\n", flush=True)

        return jsonify({
            "success": True,
            "count": len(serialized_activities),
            "activities": serialized_activities
        }), 200

    except Exception as error:

        print(
            "ACTIVITY FETCH ERROR:",
            str(error),
            flush=True
        )

        return jsonify({
            "success": False,
            "message": "Failed to retrieve activities."
        }), 500
