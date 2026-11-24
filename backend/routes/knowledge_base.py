from flask import Blueprint, request, jsonify, session

from backend.config.database import get_db
from backend.utils.auth import login_required
from backend.models.activity import create_activity_document
from backend.services.knowledge_base_service import search_knowledge_base


knowledge_bp = Blueprint("knowledge_base", __name__)


# ==========================================
# KNOWLEDGE BASE SEARCH - POST
# ==========================================

@knowledge_bp.route("/api/knowledge-search", methods=["POST"])
@login_required
def knowledge_search():

    try:

        data = request.get_json(silent=True) or {}

        issue = data.get("issue", "").strip()

        if not issue:

            return jsonify({
                "message": "Please provide an IT issue."
            }), 400

        # Search knowledge base
        result = search_knowledge_base(issue)

        db = get_db()

        # Get employee name from authenticated session
        employee_name = session.get("name", "System")

        # Record search activity
        activity = create_activity_document(
            activity_type="Knowledge Base Search",
            description=f"Knowledge Base searched for: {issue}",
            employee_name=employee_name,
            issue=issue,
            category=result.get("category", ""),
            priority="",
            analysis_source="Knowledge Base"
        )

        db["activities"].insert_one(activity)

        return jsonify({
            "success": True,
            "knowledgeBaseResult": result
        }), 200

    except Exception as error:

        print("Knowledge Base Search Error:", error)

        return jsonify({
            "message": "Knowledge Base search failed."
        }), 500