from flask import Blueprint, jsonify
from models import JD, MatchResult, EmailLog

status_bp = Blueprint('status_bp', __name__)

@status_bp.route("/status/<int:jd_id>", methods=["GET"])
def get_jd_status(jd_id):
    jd = JD.query.get(jd_id)
    if not jd:
        return jsonify({"error": "JD not found"}), 404

    # Check: text extracted
    compared = bool(jd.extracted_text and len(jd.extracted_text) > 20)

    # Check: matched profiles exist
    from models import MatchResult
    ranked = MatchResult.query.filter_by(jd_id=jd_id).count() > 0

    # Check: any recommended matches
    recommended_found = MatchResult.query.filter_by(jd_id=jd_id).filter(MatchResult.score >= 0.5).count() > 0

    # Check: email sent
    from models import EmailLog
    emailed = EmailLog.query.filter_by(jd_id=jd_id).count() > 0

    return jsonify({
        "compared": compared,
        "ranked": ranked,
        "recommended": recommended_found,
        "emailed": emailed
    })
