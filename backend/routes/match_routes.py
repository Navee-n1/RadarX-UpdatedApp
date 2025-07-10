import os
import json
import time
from flask import Blueprint, request, jsonify
from models import db, JD, Resume, Profile, MatchResult, MatchLearningCache, LiveStatusTracker, Config
from utils.parser import extract_text
from utils.matcher import compute_full_text_score
from utils.explainer import generate_explanation
from utils.utils import log_agent_error
from utils.matcher import compute_full_text_score
from utils.logger import logger


match_bp = Blueprint('match_bp', __name__)


def truncate_explanation_fields(explanation):
    if "gpt_summary" in explanation and isinstance(explanation["gpt_summary"], str):
        explanation["gpt_summary"] = explanation["gpt_summary"][:2000]
    return explanation


# ─────────────────────────────────────────────
@match_bp.route('/match/jd-to-resumes', methods=['POST'])
def match_jd_to_profiles():
    jd_id = request.json.get('jd_id')
    logger.info(f"JD-to-Resumes Match Request Received for JD ID: {jd_id}")

    status = LiveStatusTracker.query.filter_by(jd_id=jd_id).first()
    if status and status.compared and status.ranked:
        logger.warning(f"⚠️ JD ID {jd_id} already matched. Ignoring duplicate call.")
        return jsonify({"message": "Already matched", "top_matches": []}), 200

    jd = JD.query.get(jd_id)
    if not jd:
        return jsonify({"error": "JD not found"}), 404

    jd_text = jd.extracted_text or extract_text(jd.file_path)
    if not jd_text:
        return jsonify({"error": "Failed to extract JD text"}), 500

    # Read match threshold from config
    

    all_matches = []
    for profile in Profile.query.all():
        try:
            resume_text = profile.extracted_text or extract_text(profile.resume_path)
            if not resume_text:
                continue

            start_time = time.time()
            
            score = compute_full_text_score(
    jd_embedding_str=jd.embedding_vector,
    profile_embedding_str=profile.embedding_vector,
    jd_text=jd_text,
    profile_text=profile.extracted_text,
    vertical=profile.vertical,
    experience_years=profile.experience_years,
    profile_skills=profile.skills,
    profile_projects=profile.projects if hasattr(profile, 'projects') else None,
    profile_certifications=profile.certifications if hasattr(profile, 'certifications') else None
)



            explanation_start = time.time()
            explanation = generate_explanation(jd_text, resume_text, use_gpt=True)

            explanation_latency = round(time.time() - explanation_start, 4)
            latency = round(time.time() - start_time, 4)
            label=get_label(score)

            match = MatchResult(
                jd_id=jd.id,
                profile_id=profile.id,
                resume_id=None,
                score=round(score,4),
                explanation=json.dumps(truncate_explanation_fields(explanation)),
                match_type='jd-to-resume',
                method=explanation.get("source", "MultiScore"),
                latency=latency,
                explanation_latency=explanation_latency
            )
            db.session.add(match)

            all_matches.append({
                "resume_id": None,
                "profile_id": profile.id,
                "emp_id": profile.emp_id,
                "name": profile.name,
                "email": profile.email,
                "vertical": profile.vertical,
                "role": profile.role,
                "status": profile.status,
                "resume_path": profile.resume_path,
                "score": round(score,4),
                "label": label,
                "explanation": explanation,
                "latency": latency,
                "rank": len(all_matches) + 1
            })

        except Exception as e:
            db.session.rollback()
            log_agent_error("MatchError", str(e), method="jd-to-resume")

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        log_agent_error("DBCommitError", str(e), method="jd-to-resume")
        return jsonify({"error": "Database commit failed"}), 500

    # Mark JD as processed
    jd.status = "Review"
    try:
        db.session.commit()
    except:
        db.session.rollback()

    # Deduplicate by emp_id
    seen_ids = set()
    unique_matches = []
    for match in all_matches:
        if match["emp_id"] not in seen_ids:
            seen_ids.add(match["emp_id"])
            unique_matches.append(match)

    unique_matches.sort(key=lambda x: x["score"], reverse=True)

    logger.info(f"Matching complete. Returning top {min(3, len(unique_matches))} profiles.")
    return jsonify({"top_matches": unique_matches[:3]})


# ─────────────────────────────────────────────
@match_bp.route('/match/one-to-one', methods=['POST'])
def one_to_one_match():
    try:
        data = request.json
        jd_id = data.get("jd_id")
        resume_id = data.get("resume_id")

        if not jd_id or not resume_id:
            return jsonify({"error": "Missing JD or Resume ID"}), 400

        jd = JD.query.get(jd_id)
        resume = Resume.query.get(resume_id)
        if not jd or not resume:
            return jsonify({"error": "JD or Resume not found"}), 404

        jd_text = jd.extracted_text or extract_text(jd.file_path)
        resume_text = resume.extracted_text or extract_text(resume.file_path)
        if not jd_text or not resume_text:
            return jsonify({"error": "Missing text content"}), 500

        start = time.time()
        score = compute_full_text_score(
    jd.embedding_vector,
    resume.embedding_vector,
    jd_text,
    resume_text,
    None,
    None
)


        explanation = generate_explanation(jd_text, resume_text,use_gpt=True)
        latency = round(time.time() - start, 4)

        match = MatchResult(
            jd_id=jd.id,
            resume_id=resume.id,
            score=round(score, 4),
            explanation=json.dumps(truncate_explanation_fields(explanation)),
            match_type='one-to-one',
            method=explanation.get("source", "BGE"),
            latency=latency,
            explanation_latency=0
        )
        db.session.add(match)
        db.session.commit()

        return jsonify({
            "score": round(score, 4),
            "label": get_label(score),
            "explanation": explanation,
            "latency": latency
        })

    except Exception as e:
        log_agent_error("OneToOneError", str(e), method="one-to-one")
        return jsonify({"error": "Internal server error"}), 500


# ─────────────────────────────────────────────
@match_bp.route('/match/resume-to-jds', methods=['POST'])
def match_resume_to_jds():
    data = request.json
    resume_id = data.get('resume_id')
    profile_id = data.get('profile_id')

    resume = Resume.query.get(resume_id) if resume_id else Profile.query.get(profile_id)

    if not resume:
        return jsonify({"error": "Resume/Profile not found"}), 404

    resume_text = resume.extracted_text or extract_text(resume.resume_path)
    all_matches = []
    start_time = time.time()

    for jd in JD.query.all():
        try:
            jd_text = jd.extracted_text or extract_text(jd.file_path)
            score = compute_full_text_score(
    jd.embedding_vector,
    resume.embedding_vector,
    jd_text,
    resume_text,
    None,
    None
)

            all_matches.append({
                "jd": jd,
                "score": round(score, 4),
                "jd_text": jd_text
            })
            latency = round(time.time() - start_time, 4)
        except Exception as e:
            log_agent_error("ResumeToJDMatchError", str(e), method="resume-to-jd")

    results = []
    for i, match in enumerate(sorted(all_matches, key=lambda x: x["score"], reverse=True)[:3], start=1):
        jd = match["jd"]
        explanation = generate_explanation(jd_text, resume_text, use_gpt=True)

        db.session.add(MatchResult(
            jd_id=jd.id,
            resume_id=resume_id if resume_id else None,
            score=match["score"],
            explanation=json.dumps(truncate_explanation_fields(explanation)),
            match_type='resume-to-jd',
            method=explanation.get("source", "MultiScore"),
            latency=latency,
            explanation_latency=0
        ))

        results.append({
            "jd_id": jd.id,
            "jd_file": os.path.basename(jd.file_path),
            "job_title": jd.job_title,
            "score": round(score, 4),
            "label": get_label(match["score"]),
            "explanation": explanation,
            "rank": i
        })

    db.session.commit()
    return jsonify({"top_matches": results})


# ─────────────────────────────────────────────
@match_bp.route('/match/results/<int:jd_id>', methods=['GET'])
def get_existing_matches(jd_id):
    matches = MatchResult.query.filter_by(jd_id=jd_id).order_by(MatchResult.score.desc()).limit(10).all()
    if not matches:
        return jsonify({"top_matches": []}), 200

    result = []
    for match in matches:
        profile = Profile.query.get(match.profile_id)
        if not profile:
            continue
        result.append({
            "profile_id": profile.id,
            "emp_id": profile.emp_id,
            "name": profile.name,
            "skills": profile.skills,
            "experience_years": profile.experience_years,
            "role": profile.role,
            "status": profile.status,
            "file_path": profile.resume_path,
            "score": round(match.score, 2),
            "vertical": profile.vertical
        })
    return jsonify({"top_matches": result})


@match_bp.route('/match/health', methods=['GET'])
def match_health():
    return jsonify({"status": "Match engine ready ✅"})


def get_label(score):
    if score >= 0.85:
        return "✅ Highly Recommended"
    elif score >= 0.70:
        return "☑️ Recommended"
    elif score >= 0.50:
        return "🟡 Decent – Can Explore"
    else:
        return "🔴 Not Recommended"
