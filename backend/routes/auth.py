from flask import Blueprint, request, jsonify, session
from pymongo.errors import DuplicateKeyError

from backend.models.user import (
    create_user,
    find_user_by_email,
    verify_password
)


auth_bp = Blueprint("auth", __name__)


# ==========================================
# EMPLOYEE REGISTRATION
# ==========================================

@auth_bp.route("/api/auth/register", methods=["POST"])
def register():

    try:
        data = request.get_json(silent=True) or {}

        name = data.get("name", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not name or not email or not password:
            return jsonify({
                "success": False,
                "message": "All fields are required."
            }), 400

        if len(password) < 8:
            return jsonify({
                "success": False,
                "message": "Password must contain at least 8 characters."
            }), 400

        # Public registration always creates a normal user.
        user_id = create_user(
            name=name,
            email=email,
            password=password,
            role="user"
        )

        return jsonify({
            "success": True,
            "message": "Registration successful.",
            "user_id": user_id
        }), 201

    except DuplicateKeyError:
        return jsonify({
            "success": False,
            "message": "Email already registered."
        }), 409

    except Exception as error:
        print("Registration Error:", error)

        return jsonify({
            "success": False,
            "message": "Registration failed."
        }), 500


# ==========================================
# EMPLOYEE LOGIN
# ==========================================

@auth_bp.route("/api/auth/login", methods=["POST"])
def login():

    try:
        data = request.get_json(silent=True) or {}

        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            return jsonify({
                "success": False,
                "message": "Email and password are required."
            }), 400

        user = find_user_by_email(email)

        if not user or not verify_password(
            user["password"], password
        ):
            return jsonify({
                "success": False,
                "message": "Invalid email or password."
            }), 401

        session.clear()

        session["user_id"] = str(user["_id"])
        session["name"] = user["name"]
        session["email"] = user["email"]
        session["role"] = user.get("role", "user")

        return jsonify({
            "success": True,
            "message": "Login successful.",
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"],
                "role": user.get("role", "user")
            }
        }), 200

    except Exception as error:
        print("Login Error:", error)

        return jsonify({
            "success": False,
            "message": "Login failed."
        }), 500


# ==========================================
# GET CURRENT LOGGED-IN USER
# ==========================================

@auth_bp.route("/api/auth/me", methods=["GET"])
def get_current_user():

    if "user_id" not in session:
        return jsonify({
            "success": False,
            "message": "Not logged in."
        }), 401

    return jsonify({
        "success": True,
        "user": {
            "id": session.get("user_id"),
            "name": session.get("name"),
            "email": session.get("email"),
            "role": session.get("role")
        }
    }), 200


# ==========================================
# EMPLOYEE LOGOUT
# ==========================================

@auth_bp.route("/api/auth/logout", methods=["POST"])
def logout():

    session.clear()

    return jsonify({
        "success": True,
        "message": "Logged out successfully."
    }), 200