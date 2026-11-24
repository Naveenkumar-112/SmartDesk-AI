from datetime import datetime, timezone

from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)

from backend.config.database import get_db


# ==========================================
# 1. GET USERS COLLECTION
# ==========================================

def get_users_collection():

    db = get_db()

    users = db["users"]

    users.create_index("email", unique=True)

    return users


# ==========================================
# 2. CREATE USER
# ==========================================

def create_user(name, email, password, role="user"):

    users = get_users_collection()

    # Only allow valid roles
    if role not in ["user", "admin"]:
        raise ValueError("Invalid user role")

    # Hash password
    hashed_password = generate_password_hash(password)

    user_document = {
        "name": name.strip(),
        "email": email.lower().strip(),
        "password": hashed_password,
        "role": role,
        "createdAt": datetime.now(timezone.utc)
    }

    result = users.insert_one(user_document)

    return str(result.inserted_id)


# ==========================================
# 3. FIND USER BY EMAIL
# ==========================================

def find_user_by_email(email):

    users = get_users_collection()

    return users.find_one({
        "email": email.lower().strip()
    })


# ==========================================
# 4. VERIFY PASSWORD
# ==========================================

def verify_password(stored_password, entered_password):

    return check_password_hash(
        stored_password,
        entered_password
    )