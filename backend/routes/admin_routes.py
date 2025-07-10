from flask import Blueprint, request, jsonify
from models import db, Config, User
from datetime import datetime
from utils.admin_utils import save_or_update_config
from models import Prompt

admin_bp = Blueprint('admin_bp', __name__)

# ─────────────────────────────
# CONFIGURATION ROUTES
# ─────────────────────────────
ALLOWED_CONFIG_KEYS = {"genai_key", "genai_provider", "genai_enabled", "genai_prompt","match_threshold"}


@admin_bp.route('/admin/config', methods=['GET'])
def get_all_configs():
    existing = {conf.key: conf.value for conf in Config.query.all()}
    for key in ALLOWED_CONFIG_KEYS:
        existing.setdefault(key, "")
    return jsonify([{"key": k, "value": v} for k, v in existing.items()])

@admin_bp.route('/admin/config', methods=['POST'])
def update_config():
    try:
        data = request.get_json()
        print("🚨 Incoming config data:", data)

        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        key = str(data.get("key", "")).strip()
        value = data.get("value")

        if not key:
            return jsonify({"error": "Missing or invalid key"}), 400

        # Convert non-string types to string safely (e.g., booleans)
        if value is None:
            return jsonify({"error": "Missing value"}), 400
        value = str(value).strip()

        result, status_code = save_or_update_config(key, value)
        return jsonify(result), status_code

    except Exception as e:
        print("❌ Server error:", e)
        return jsonify({"error": f"Unexpected server error: {str(e)}"}), 500

# USER MANAGEMENT ROUTES
# ─────────────────────────────

@admin_bp.route('/admin/create-user', methods=['POST'])
def create_user():
    data = request.json
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()
    role = data.get("role", "recruiter").strip()

    if not email or not password:
        return jsonify({"error": "Missing fields"}), 400

    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({"error": "User already exists"}), 409

    user = User(email=email, password=password, role=role)
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": f"User '{email}' created."})


@admin_bp.route('/admin/users', methods=['GET'])
def list_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([{
        "id": u.id,
        "email": u.email,
        "role": u.role,
        "created_at": u.created_at.strftime('%Y-%m-%d %H:%M')
    } for u in users])


@admin_bp.route('/admin/user/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.json
    email = data.get("email", "").strip()
    role = data.get("role", "").strip()

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if email:
        existing = User.query.filter(User.email == email, User.id != user_id).first()
        if existing:
            return jsonify({"error": "Email already used by another user"}), 409
        user.email = email

    if role:
        user.role = role

    db.session.commit()
    return jsonify({"message": "User updated."})


@admin_bp.route('/admin/user/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted."})

@admin_bp.route("/admin/prompts", methods=["GET"])
def get_prompts():
    prompts = Prompt.query.all()
    return jsonify([{"id": p.id, "name": p.name, "text": p.content} for p in prompts])

# POST new prompt
@admin_bp.route("/admin/prompts", methods=["POST"])
def create_prompt():
    data = request.get_json()
    name = data.get("name", "").strip()
    content = data.get("text", "").strip()

    if not name or not content:
        return jsonify({"error": "Name and text required"}), 400
    if Prompt.query.filter_by(name=name).first():
        return jsonify({"error": "Prompt with this name already exists"}), 409

    prompt = Prompt(name=name, content=content)
    db.session.add(prompt)
    db.session.commit()
    return jsonify({"message": "✅ Prompt saved successfully."})


@admin_bp.route("/admin/prompts/<int:id>", methods=["PUT"])
def update_prompt(id):
    prompt = Prompt.query.get_or_404(id)
    data = request.get_json()
    prompt.name = data.get("name", prompt.name)
    prompt.content = data.get("text", prompt.content)
    db.session.commit()
    return jsonify({"message": "✅ Prompt updated."})


# DELETE prompt
@admin_bp.route("/admin/prompts/<int:id>", methods=["DELETE"])
def delete_prompt(id):
    prompt = Prompt.query.get_or_404(id)
    db.session.delete(prompt)
    db.session.commit()
    return jsonify({"message": "🗑️ Prompt deleted."})
