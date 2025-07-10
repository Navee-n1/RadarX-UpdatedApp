from models import db, Config, User
from datetime import datetime

# ─────────────────────────────
# CONFIG UTILITIES
# ─────────────────────────────

ALLOWED_CONFIG_KEYS = {"genai_key", "genai_provider", "genai_enabled", "genai_prompt","match_threshold"}

def get_all_config_dict():
    """Return all configs as a dictionary."""
    return {conf.key: conf.value for conf in Config.query.all()}

def get_config_by_key(key):
    """Fetch a single config by key."""
    return Config.query.filter_by(key=key).first()

def save_or_update_config(key, value):
    """Create or update a config key, with validation."""

    if not key or not isinstance(key, str) or key.strip() == "":
        return {"error": "Missing or invalid key."}, 400

    key = key.strip()

    if key not in ALLOWED_CONFIG_KEYS:
        return {"error": f"'{key}' is not an allowed config key."}, 400

    try:
        value_str = str(value).strip()
    except Exception as e:
        return {"error": f"Value conversion failed: {str(e)}"}, 400

    if value_str == "":
        return {"error": "Config value cannot be empty."}, 400

    if key == "genai_enabled":
        if value_str.lower() not in {"true", "false"}:
            return {"error": "genai_enabled must be 'true' or 'false'"}, 400
        value_str = value_str.lower()

    config = Config.query.filter_by(key=key).first()
    if config:
        config.value = value_str
        config.updated_at = datetime.utcnow()
    else:
        config = Config(key=key, value=value_str)
        db.session.add(config)

    db.session.commit()
    return {"message": f"✅ Config '{key}' saved."}, 200

# ─────────────────────────────
# USER UTILITIES
# ─────────────────────────────

def create_new_user(email, password, role="recruiter"):
    """Create a new user if not exists."""
    if not email or not password:
        return {"error": "Missing email or password."}, 400

    existing = User.query.filter_by(email=email).first()
    if existing:
        return {"error": "User already exists."}, 409

    user = User(email=email, password=password, role=role)
    db.session.add(user)
    db.session.commit()
    return {"message": f"✅ User '{email}' created as {role}."}, 201

def get_all_users():
    """Return all users with basic info."""
    users = User.query.order_by(User.created_at.desc()).all()
    return [{
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "created_at": user.created_at.strftime('%Y-%m-%d %H:%M')
    } for user in users]

def delete_user_by_id(user_id):
    """Delete a user by ID."""
    user = User.query.get(user_id)
    if not user:
        return {"error": "User not found."}, 404
    db.session.delete(user)
    db.session.commit()
    return {"message": "❌ User deleted successfully."}, 200

def update_user_by_id(user_id, email=None, role=None):
    """Update user email or role."""
    user = User.query.get(user_id)
    if not user:
        return {"error": "User not found."}, 404

    if email:
        existing = User.query.filter(User.email == email, User.id != user_id).first()
        if existing:
            return {"error": "Another user with this email already exists."}, 409
        user.email = email

    if role:
        user.role = role

    db.session.commit()
    return {"message": "✏️ User updated successfully."}, 200

