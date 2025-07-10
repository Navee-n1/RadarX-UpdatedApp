from flask import Blueprint, request, jsonify

from sqlalchemy import or_


from models import JD, MatchResult, Profile
from sqlalchemy.orm import joinedload

profile_bp = Blueprint('profile_bp', __name__)

@profile_bp.route('/profiles/search', methods=['GET'])
def search_profiles():
    emp_id = request.args.get('emp_id', '').strip()
    name = request.args.get('name', '').strip()
    vertical = request.args.get('vertical', '').strip()
    skills = request.args.get('skills', '').strip()
    min_exp = request.args.get('min_exp', type=float)
    max_exp = request.args.get('max_exp', type=float)

    query = Profile.query

    # 🔍 Shared search input for emp_id or name
    if emp_id or name:
        search_term = (emp_id or name).lower()
        query = query.filter(or_(
            Profile.name.ilike(f"%{search_term}%"),
            Profile.emp_id.ilike(f"%{search_term}%")
        ))

    if vertical:
        query = query.filter(Profile.vertical.ilike(f"%{vertical}%"))

    if skills:
        skill_list = [s.strip().lower() for s in skills.split(',') if s.strip()]
        for skill in skill_list:
            query = query.filter(Profile.skills.ilike(f"%{skill}%"))

    if min_exp is not None:
        query = query.filter(Profile.experience_years >= min_exp)

    if max_exp is not None:
        query = query.filter(Profile.experience_years <= max_exp)

    results = query.order_by(Profile.created_at.desc()).all()

    return jsonify([
        {
            "id": p.id,
            "emp_id": p.emp_id,
            "name": p.name,
            "vertical": p.vertical,
            "skills": p.skills,
            "experience_years": p.experience_years,
            "role": p.role,         # ✅ Newly added
            "status": p.status
        } for p in results
    ])



@profile_bp.route('/jd/<int:jd_id>/matches', methods=['GET'])
def get_matches_for_jd(jd_id):
    jd = JD.query.get(jd_id)
    if not jd:
        return jsonify({"error": "JD not found"}), 404

    results = (
        MatchResult.query
        .filter_by(jd_id=jd_id, match_type='jd-to-profile')
        .order_by(MatchResult.score.desc())
        .options(joinedload(MatchResult.profile))
        .all()
    )

    matches = []
    for r in results:
        if r.profile:
            matches.append({
                "profile_id": r.profile.emp_id,
                "name": r.profile.name,
                "vertical": r.profile.vertical,
                "skills": r.profile.skills.split(','),
                "role": r.role,         # ✅ Newly added
                "status": r.status,
                "experience_years": r.profile.experience_years,
                "resume_path": r.profile.resume_path,
                "match_score": round(r.score, 2),
                "explanation": r.explanation or ""
            })

    return jsonify({
        "jd_id": jd.id,
        "job_title": jd.job_title,
        "uploaded_by": jd.uploaded_by,
        "project_code": jd.project_code,
        "matches": matches
    })


