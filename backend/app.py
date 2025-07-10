from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager

import os
from models import db
from routes.upload_routes import upload_bp
from routes.match_routes import match_bp
from routes.email_routes import email_bp 
from routes.profile_routes import profile_bp
from routes.auth_routes import auth_bp
from routes.report_routes import report_bp
from routes.tracker_routes import tracker_bp
from routes.admin_routes import admin_bp
from routes.status_routes import status_bp





load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}},supports_credentials=True)

# DB setup
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(BASE_DIR, 'match_results.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY']='super-secret-key'
jwt=JWTManager(app)

db.init_app(app)

# Register blueprints
app.register_blueprint(upload_bp)
app.register_blueprint(match_bp)
app.register_blueprint(email_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(auth_bp)

app.register_blueprint(report_bp)
app.register_blueprint(tracker_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(status_bp)



@app.route("/")
def home():
    return "RadarX Backend is running! 🚀"

# Optional: print routes
for rule in app.url_map.iter_rules():
    print("📌 Route:", rule)

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
