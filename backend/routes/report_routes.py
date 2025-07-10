from flask import Blueprint, send_file, request, jsonify
from utils.pdf_generator import generate_pdf_report
from models import JD, MatchResult, Profile
from flask import Blueprint, jsonify
import os

report_bp = Blueprint('report_bp', __name__)

@report_bp.route('/generate-pdf/<int:jd_id>', methods=['GET'])
def generate_pdf(jd_id):
    """
    Generate a match summary PDF for the given JD, including top 3 unique profile matches.
    """
    jd = JD.query.get(jd_id)
    if not jd:
        return jsonify({"error": "JD not found"}), 404

    matches = (
        MatchResult.query.filter_by(jd_id=jd_id)
        .order_by(MatchResult.score.desc())
        .all()
    )

    top_matches = []
    seen_profile_ids = set()

    for match in matches:
        if not match.profile_id or match.profile_id in seen_profile_ids:
            continue
        profile = Profile.query.get(match.profile_id)
        if not profile:
            continue
        top_matches.append({
            "name": profile.name,
            "emp_id": profile.emp_id,
            "score": round(match.score * 100, 2)
        })
        seen_profile_ids.add(profile.id)
        if len(top_matches) >= 3:
            break

    if not top_matches:
        return jsonify({"error": "No valid profile matches found"}), 404

    filepath = generate_pdf_report(jd_id, jd.project_code or f"JD-{jd_id}", top_matches)

    if not os.path.exists(filepath):
        return jsonify({"error": "PDF generation failed"}), 500

    return send_file(filepath, as_attachment=True)

@report_bp.route('/recruiter/summary', methods=['GET'])
def recruiter_summary():
    profile_count = Profile.query.count()
    jd_count = JD.query.count()
    match_count = MatchResult.query.count()

    return jsonify({
        "profiles": profile_count,
        "jds": jd_count,
        "matches": match_count
    })
