from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from pathlib import Path
import os

from dotenv import load_dotenv

from backend.config.database import connect_db
from backend.routes.incidents import incident_bp
from backend.routes.activities import activity_bp
from backend.routes.knowledge_base import knowledge_bp
from backend.routes.auth import auth_bp


# ==========================================
# PROJECT CONFIGURATION
# ==========================================

ROOT_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIR = ROOT_DIR / "frontend"

# Load environment variables
load_dotenv(ROOT_DIR / ".env")


# ==========================================
# FLASK APPLICATION
# ==========================================

app = Flask(
    __name__,
    static_folder=str(FRONTEND_DIR),
    static_url_path=""
)


# ==========================================
# SESSION CONFIGURATION
# ==========================================

app.secret_key = os.getenv("FLASK_SECRET_KEY")

if not app.secret_key:
    raise ValueError("FLASK_SECRET_KEY not found in .env")

app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False  # Enable True when using HTTPS


# ==========================================
# CORS CONFIGURATION
# ==========================================

CORS(
    app,
    supports_credentials=True
)


# ==========================================
# DATABASE CONNECTION
# ==========================================

db = None

try:
    db = connect_db()
    print("SmartDesk AI database is ready!")

except Exception as error:
    print("Database connection error:", error)


# ==========================================
# REGISTER API ROUTES
# ==========================================

app.register_blueprint(incident_bp)
app.register_blueprint(activity_bp)
app.register_blueprint(knowledge_bp)
app.register_blueprint(auth_bp)


# ==========================================
# SERVE FRONTEND
# ==========================================

@app.route("/", methods=["GET"])
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")


# ==========================================
# HEALTH CHECK
# ==========================================

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "application": "SmartDesk AI",
        "database": "Connected" if db is not None else "Disconnected"
    })


# ==========================================
# DISPLAY REGISTERED ROUTES
# ==========================================

print("\n========== REGISTERED ROUTES ==========")

for rule in app.url_map.iter_rules():
    print(rule, rule.methods)

print("=======================================\n")


# ==========================================
# RUN APPLICATION
# ==========================================

if __name__ == "__main__":
    app.run(
        debug=True,
        use_reloader=False,
        port=5000
    )
