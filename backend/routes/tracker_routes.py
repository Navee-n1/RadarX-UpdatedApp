from flask import Blueprint, jsonify
from sqlalchemy.sql import func
from datetime import datetime, timedelta
from collections import Counter
import re
from models import db, MatchResult, AgentErrorLog, JD, Resume, EmailLog, Profile
 
tracker_bp = Blueprint('tracker_bp', __name__)
 
@tracker_bp.route('/tracker/agent-health', methods=['GET'])
def get_agent_health_summary():
    # ────────────── Match Type Counts ──────────────
    total_matches = db.session.query(func.count(MatchResult.id)).scalar()
 
    jd_to_resume = db.session.query(func.count()).filter(MatchResult.match_type == 'jd-to-resume').scalar()
    resume_to_jd = db.session.query(func.count()).filter(MatchResult.match_type == 'resume-to-jd').scalar()
    one_to_one = db.session.query(func.count()).filter(MatchResult.match_type == 'one-to-one').scalar()
 
    # ────────────── Latency by Match Type ──────────────
    def avg_latency(match_type):
        return round(db.session.query(func.avg(MatchResult.latency))
                     .filter(MatchResult.match_type == match_type)
                     .scalar() or 0.0, 2)
 
    latency_stats = {
        "jd_to_resume": avg_latency("jd-to-resume"),
        "resume_to_jd": avg_latency("resume-to-jd"),
        "one_to_one": avg_latency("one-to-one")
    }
 
    # ────────────── Agent Latency (New) ──────────────
    comparison_latency = round(db.session.query(func.avg(MatchResult.latency)).scalar() or 0.0, 2)
    explanation_latency = round(db.session.query(func.avg(MatchResult.explanation_latency)).scalar() or 0.0, 2)
    email_latency = round(db.session.query(func.avg(EmailLog.latency)).scalar() or 0.0, 2)
 
    agent_latency = {
        "comparison_agent": comparison_latency,
        "explanation_agent": explanation_latency,
        "email_agent": email_latency
    }
 
    # ────────────── Daily Usage (Last 7 Days) ──────────────
    today = datetime.utcnow().date()
    daily_trend = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        count = db.session.query(func.count()).filter(
            func.date(MatchResult.created_at) == day
        ).scalar()
        daily_trend.append({"date": day.strftime("%b %d"), "matches": count})
 
    # ────────────── Error Stats ──────────────
    total_errors = db.session.query(func.count(AgentErrorLog.id)).scalar()
    unresolved_errors = db.session.query(func.count()).filter(AgentErrorLog.resolved == False).scalar()
    resolved_errors = total_errors - unresolved_errors
 
    most_common_error = db.session.query(
        AgentErrorLog.error_type, func.count().label('count')
    ).group_by(AgentErrorLog.error_type).order_by(func.count().desc()).first()
 
    # ────────────── Base Metrics ──────────────
    jd_uploaded = db.session.query(func.count(JD.id)).scalar()
    resumes_uploaded = db.session.query(func.count(Resume.id)).scalar()
 
    avg_match_score = round(db.session.query(func.avg(MatchResult.score)).scalar() or 0.0, 2)
    match_success_rate = round((total_matches / jd_uploaded) * 100, 2) if jd_uploaded else 0
 
    match_explainers = db.session.query(func.count()).filter(MatchResult.explanation.isnot(None)).scalar()
 
   
    # ────────────── Top Verticals ──────────────
    vertical_counts = db.session.query(
        Profile.vertical, func.count().label("count")
    ).group_by(Profile.vertical).order_by(func.count().desc()).limit(5).all()
    top_verticals = [{"vertical": v[0], "count": v[1]} for v in vertical_counts if v[0]]
 
    # ────────────── Errors by Match Type ──────────────
    error_by_type = db.session.query(
        AgentErrorLog.method, func.count().label("count")
    ).group_by(AgentErrorLog.method).order_by(func.count().desc()).all()
    error_match_types = [{"type": m[0], "count": m[1]} for m in error_by_type if m[0]]
 
    # ────────────── Most Explained Roles ──────────────
    explained_roles = db.session.query(
        JD.job_title, func.count(MatchResult.id)
    ).join(MatchResult, MatchResult.jd_id == JD.id
    ).filter(MatchResult.explanation.isnot(None)
    ).group_by(JD.job_title).order_by(func.count().desc()).limit(5).all()
    top_explained_roles = [{"job_title": r[0], "count": r[1]} for r in explained_roles if r[0]]

    print("RESUME → JD Matches:", resume_to_jd)
 
    # ────────────── Final Response ──────────────
    return jsonify({
        "total_matches": total_matches,
        "jd_to_resume": jd_to_resume,
        "resume_to_jd": resume_to_jd,
        "one_to_one": one_to_one,
 
        "latency_stats": latency_stats,
        "agent_latency": agent_latency,
 
        "total_errors": total_errors,
        "unresolved_errors": unresolved_errors,
        "resolved_errors": resolved_errors,
        "most_common_error": most_common_error[0] if most_common_error else "None",
        "most_common_error_count": most_common_error[1] if most_common_error else 0,
 
        "daily_usage": daily_trend,
 
        "jd_uploaded": jd_uploaded,
        "resumes_uploaded": resumes_uploaded,
        "avg_match_score": avg_match_score,
        "match_success_rate": match_success_rate,
        "match_explainers": match_explainers,
 
        
        "top_verticals": top_verticals,
        "error_match_types": error_match_types,
        "top_explained_roles": top_explained_roles
    })