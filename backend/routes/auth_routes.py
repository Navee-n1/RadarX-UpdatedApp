import os
import logging
from flask import Blueprint, request, jsonify
from models import User
from flask_jwt_extended import create_access_token

# Setup logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

log_path = 'logs/auth_routes.log'
os.makedirs(os.path.dirname(log_path), exist_ok=True)  # Ensure 'logs/' directory exists

handler = logging.FileHandler(log_path)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)

if not logger.handlers:
    logger.addHandler(handler)

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    logger.info(f"Login attempt for email: {email}")

    user = User.query.filter_by(email=email).first()

    if not user:
        logger.warning(f"Login failed: User with email {email} not found")
        return jsonify({'error': 'Invalid email or password'}), 401

    if user.password != password:
        logger.warning(f"Login failed: Incorrect password for email {email}")
        return jsonify({'error': 'Invalid email or password'}), 401

    access_token = create_access_token(identity={
        'email': user.email,
        'role': user.role
    })

    logger.info(f"Login successful for email: {email}")

    return jsonify({'access_token': access_token})
