import os
import re
import json
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from models import db, JD, Resume, Profile
from utils.parser import extract_text, extract_experience
from utils.embedding import generate_embedding
from utils.skill_extractor import extract_skills_contextual
from utils.utils import log_agent_error
from sentence_transformers import SentenceTransformer, util
from utils.matcher import CERTIFICATION_CONCEPTS, PROJECT_SIGNAL_CONCEPTS, VERTICAL_SIGNAL_CONCEPTS
from utils.parser import extract_text, extract_experience,infer_domain_from_text
import os
import json
from utils.parser import extract_certifications, extract_projects, extract_experience, extract_email





UPLOAD_FOLDER = 'resumes'


domain_model = SentenceTransformer("BAAI/bge-base-en-v1.5")

upload_bp = Blueprint('upload_bp', __name__)

# ─────────────────────────────────────────────
# Upload Folders
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER_JD = os.path.join(BASE_DIR, '..', 'uploads', 'jds')
UPLOAD_FOLDER_RESUME = os.path.join(BASE_DIR, '..', 'uploads', 'resumes')
os.makedirs(UPLOAD_FOLDER_JD, exist_ok=True)
os.makedirs(UPLOAD_FOLDER_RESUME, exist_ok=True)

# ─────────────────────────────────────────────
# Serve Resume File
@upload_bp.route('/uploads/resumes/<path:filename>')
def serve_resume(filename):
    return send_from_directory(UPLOAD_FOLDER_RESUME, filename)

# ─────────────────────────────────────────────
# Upload JD
@upload_bp.route('/upload-jd', methods=['POST'])
def upload_jd():
    try:
        file = request.files.get('file')
        uploaded_by = request.form.get('uploaded_by', 'anonymous')
        project_code = request.form.get('project_code', 'GENERIC')
        job_title = request.form.get('job_title', 'Untitled')

        if not file:
            return jsonify({"error": "No JD file provided"}), 400

        filename = secure_filename(file.filename or "jd.pdf")
        save_path = os.path.join(UPLOAD_FOLDER_JD, filename)
        file.save(save_path)

        text = extract_text(save_path)
        if not text or len(text.strip()) == 0:
            return jsonify({"error": "Empty JD content"}), 400

        embedding = generate_embedding(text)

        jd = JD(
            file_path=f"/uploads/jds/{filename}",
            uploaded_by=uploaded_by,
            project_code=project_code,
            job_title=job_title,
            extracted_text=text,
            embedding_vector=json.dumps(embedding)
        )

        db.session.add(jd)
        db.session.commit()

        return jsonify({"message": "JD uploaded", "jd_id": jd.id, "job_title": jd.job_title})

    except Exception as e:
        log_agent_error("UploadJD", str(e), method="upload-jd")
        return jsonify({"error": "Failed to upload JD"}), 500

@upload_bp.route('/upload-resume', methods=['POST'])
def upload_resume():
    try:
        file = request.files.get('file')
        if not file:
            return jsonify({"error": "No file uploaded"}), 400

        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        file.save(filepath)

        text = extract_text(filepath)
        embedding = generate_embedding(text)
        if not isinstance(embedding, list):
            embedding = embedding.tolist()

        email = extract_email(text) or "not available"  # fallback for debug
        skills_list = extract_skills_contextual(text) or []
        certifications = extract_certifications(text) or []
        projects = extract_projects(text) or []
        domain = infer_domain_from_text(text) or "Unknown"

        print("🧪 Extracted Email:", email)
        print("🧪 Skills:", skills_list)
        print("🧪 Domain:", domain)

        resume = Resume(
            name=filename,
            file_path=filepath,
            email=email,
            skills=", ".join(skills_list),
            certifications=", ".join(certifications[:5]),
            projects=", ".join(projects[:3]),
            domain=domain,
            extracted_text=text,
            embedding_vector=json.dumps(embedding)
        )
        db.session.add(resume)
        db.session.commit()

        return jsonify({
    "message": "Resume uploaded and processed successfully.",
    "resume_id": resume.id
})

    except Exception as e:
        import traceback
        traceback.print_exc()  # ⚠️ see the actual issue in terminal
        db.session.rollback()
        log_agent_error("ResumeUploadError", str(e), method="upload_resume")
        return jsonify({"error": str(e)}), 500  # ⚠️ TEMP: show error

# ─────────────────────────────────────────────
# Upload Consultant Profile
@upload_bp.route('/upload-profile', methods=['POST'])
def upload_profile():
    try:
        file = request.files.get('file')
        emp_id = request.form.get('emp_id')
        name = request.form.get('name')
        email = request.form.get('email')
        role = request.form.get('role', 'Consultant')
        status = request.form.get('status', 'Available')
        vertical = request.form.get('vertical', 'N/A')
       
        manual_experience = request.form.get('experience_years')

        if not all([file, emp_id, name, email]):
            return jsonify({"error": "Missing emp_id, name, email or file"}), 400

        filename = secure_filename(file.filename or f"{emp_id}_resume.pdf")
        save_path = os.path.join(UPLOAD_FOLDER_RESUME, filename)
        file.save(save_path)

        text = extract_text(save_path)
        if not text or len(text.strip()) == 0:
            raise ValueError("Resume unreadable or empty")

        embedding = generate_embedding(text)
        skills_list = extract_skills_contextual(text)

        try:
            experience_years = float(manual_experience.strip()) if manual_experience else extract_experience(text)
        except:
            experience_years = extract_experience(text)

        existing = Profile.query.filter_by(emp_id=emp_id).first()
        if existing:
            db.session.delete(existing)
            db.session.commit()

        profile = Profile(
            emp_id=emp_id,
            name=name,
            email=email,
            role=role,
            status=status,
            vertical=vertical,
            skills=", ".join(skills_list),
            experience_years=experience_years,
            resume_path=f"/uploads/resumes/{filename}",
            extracted_text=text,
            embedding_vector=json.dumps(embedding)
        )

        db.session.add(profile)
        db.session.commit()

        return jsonify({"message": "Profile uploaded", "profile_id": profile.id})

    except Exception as e:
        import traceback
        traceback.print_exc()
        log_agent_error("UploadProfile", str(e), method="upload-profile")
        return jsonify({"error": "Profile upload failed"}), 500

# ─────────────────────────────────────────────
# Fetch All Profiles
@upload_bp.route('/profiles/all', methods=['GET'])
def get_all_profiles():
    try:
        profiles = Profile.query.all()
        return jsonify([
            {
                "id": p.id,
                "name": p.name,
                "emp_id": p.emp_id,
                "email": p.email,
                "role": p.role,
                "status": p.status,
                "resume_path": p.resume_path
            } for p in profiles
        ])
    except Exception as e:
        log_agent_error("FetchProfiles", str(e), method="get_all_profiles")
        return jsonify({"error": "Failed to fetch profiles"}), 500

# ─────────────────────────────────────────────
# JD Filter View
@upload_bp.route('/jds/filterable', methods=['GET'])
def get_jds_for_filters():
    try:
        clean_jds = []
        for jd in JD.query.all():
            jd_text = jd.extracted_text or extract_text(jd.file_path) or ""

            skills = extract_skills_contextual(jd_text)
            cleaned_skills = [s.lower() for s in skills if len(s) > 2 and s.isascii() and s.isalnum()]

            experience_match = re.search(r'(\d+)\s*\+?\s*(years|yrs)', jd_text.lower())
            if experience_match:
                experience = int(experience_match.group(1))
            elif "fresher" in jd_text.lower():
                experience = 0
            else:
                experience = 3

            clean_jds.append({
                "id": jd.id,
                "job_title": jd.job_title or "No Title",
                "uploaded_by": jd.uploaded_by,
                "project_code": jd.project_code,
                "skills": cleaned_skills[:10],
                "experience": experience,
                "status": jd.status or "Pending",
                "created_at": jd.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })

        return jsonify(clean_jds)

    except Exception as e:
        log_agent_error("GetJDsForFilters", str(e), method="get_jds_for_filters")
        return jsonify({"error": "Failed to fetch JDs"}), 500


def detect_resume_domain(text):
    best_domain = "Unknown"
    highest_score = 0.0
    text_embed = domain_model.encode(text, convert_to_tensor=True)

    for domain, concept in VERTICAL_SIGNAL_CONCEPTS.items():
        concept_embed = domain_model.encode(concept, convert_to_tensor=True)
        sim = float(util.cos_sim(text_embed, concept_embed)[0][0])
        if sim > highest_score and sim >= 0.5:
            best_domain = domain
            highest_score = sim

    return best_domain