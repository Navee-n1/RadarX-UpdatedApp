import os
import logging
from flask import Blueprint, request, jsonify
from utils.emailer import send_email_with_attachments
from models import db, EmailLog, JD
from utils.utils import log_agent_error
import time

# Setup logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.FileHandler('logs/email_routes.log')
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
if not logger.handlers:
    logger.addHandler(handler)

email_bp = Blueprint('email_bp', __name__)

# ─────────────────────────────────────────────
# Match Label Mapping
# ─────────────────────────────────────────────
def get_label(score):
    if score >= 0.8:
        return "✅ Highly Recommended"
    elif score >= 0.6:
        return "☑️ Recommended"
    elif score >= 0.4:
        return "🟡 Decent – Can Explore"
    else:
        return "❌ Not Recommended"

# ─────────────────────────────────────────────
# HTML Summary Generator
# ─────────────────────────────────────────────
def build_match_summary_html(matches, job_title="the uploaded Job Description"):
    strong_matches = [m for m in matches if m.get("label") in ["✅ Highly Recommended", "☑️ Recommended", "🟡 Decent – Can Explore"]]
    logger.info(f"Building HTML summary for {len(strong_matches)} strong matches")

    if strong_matches:
        rows = "\n".join([
            f"<tr><td style='padding:8px;border:1px solid #ddd;'>{m.get('emp_id')}</td>"
            f"<td style='padding:8px;border:1px solid #ddd;'>{m.get('name')}</td>"
            f"<td style='padding:8px;border:1px solid #ddd;'>{round(m.get('score', 0) * 100)}%</td>"
            f"<td style='padding:8px;border:1px solid #ddd;'>{m.get('label')}</td></tr>"
            for m in strong_matches
        ])
        return True, f"""
        <html><body>
        <p>Dear AR Requestor,</p>
        <p>Please find the top consultant matches below for <b>{job_title}</b>:</p>
        <table style="width:100%;border-collapse:collapse;">
            <thead>
                <tr>
                    <th style="padding:8px;border:1px solid #ddd;">Emp ID</th>
                    <th style="padding:8px;border:1px solid #ddd;">Name</th>
                    <th style="padding:8px;border:1px solid #ddd;">Match %</th>
                    <th style="padding:8px;border:1px solid #ddd;">Recommendation</th>
                </tr>
            </thead>
            <tbody>{rows}</tbody>
        </table>
        <p style="margin-top:20px;">Warm regards,<br><b>RadarX AI Assistant</b></p>
        </body></html>
        """
    else:
        logger.info("No strong matches found for email summary")
        return False, """
        <html><body>
        <p>Dear AR Requestor,</p>
        <p>Thank you for using RadarX AI.</p>
        <p>Unfortunately, there are no recommended matches for the uploaded Job Description at this time.</p>
        <p style="font-family: Arial, sans-serif; font-size:14px; color:#333; margin-top: 40px;">
  Warm regards,<br>
  <strong style="font-size:16px;">RadarX AI Assistant</strong><br>
  <span style="font-size:13px; color:#777;">The Radar for Talent</span>
</p>

        </body></html>
        """

# ─────────────────────────────────────────────
# Manual Email API
# ─────────────────────────────────────────────
@email_bp.route('/send-email/manual', methods=['POST'])
def send_manual_email():
    try:
        data = request.json
        jd_id = data.get('jd_id')
        to_email = data.get('to_email')
        cc_list = data.get('cc_list', [])
        attachments = data.get('attachments', [])
        top_matches = data.get('top_matches', [])
        job_title = data.get('job_title', 'the uploaded Job Description')
        
        start = time.time()
        logger.info(f"Manual email triggered for JD ID {jd_id} to {to_email} with {len(top_matches)} matches.")

        if not jd_id or not to_email:
            logger.warning("Missing jd_id or to_email in request.")
            return jsonify({"error": "Missing required fields"}), 400

        # Ensure labels exist
        for m in top_matches:
            if "label" not in m:
                m["label"] = get_label(m.get("score", 0))

        recommended = [m for m in top_matches if m["label"] in [
            "✅ Highly Recommended", "☑️ Recommended", "🟡 Decent – Can Explore"
        ]]

        has_matches = bool(recommended)
        subject = f"Top Matches for {job_title}" if has_matches else f"No Strong Matches Found for {job_title}"

        valid_attachments = [f for f in attachments if f and os.path.exists(f)] if has_matches else []
        if not has_matches:
            logger.info("No recommended matches. Email will be sent without attachments.")
        else:
            logger.info(f"Valid attachments: {valid_attachments}")

        _, html_body = build_match_summary_html(top_matches, job_title)
        
        status = send_email_with_attachments(
            subject=subject,
            to_email=to_email,
            cc_list=cc_list,
            html_body=html_body,
            attachments=valid_attachments
        )
        latency = round(time.time() - start, 4)

        email_log = EmailLog(
            jd_id=jd_id,
            sent_to=to_email,
            cc=", ".join(cc_list),
            status="Sent" if "success" in status.lower() else "Failed",
            pdf_path=", ".join(valid_attachments) if valid_attachments else None,
            latency=latency
        )
        db.session.add(email_log)
        db.session.commit()
        logger.info("Email log saved to database.")

        return jsonify({"message": status})

    except Exception as e:
        logger.error(f"Failed to send email: {e}", exc_info=True)
        log_agent_error("EmailError", str(e), method="send-email/manual")
        return jsonify({"error": "Internal Server Error"}), 500

# ─────────────────────────────────────────────
# Email Status Check
# ─────────────────────────────────────────────
@email_bp.route('/email/sent/<int:jd_id>', methods=['GET'])
def check_email_sent(jd_id):
    sent = EmailLog.query.filter_by(jd_id=jd_id).first() is not None
    return jsonify({"emailed": sent})


#duplicate of send mauel email
@email_bp.route('/send-email/matches-final', methods=['POST'])
def send_manual_email_final():
    try:
        data = request.json
        jd_id = data.get('jd_id')
        to_email = data.get('to_email')
        cc_list = data.get('cc_list', [])
        attachments = data.get('attachments', [])
        top_matches = data.get('top_matches', [])
        job_title = data.get('job_title', 'the uploaded Job Description')
        start = time.time()
 
        logger.info(f"Manual email triggered for JD ID {jd_id} to {to_email} with {len(top_matches)} matches.")
 
        if not jd_id or not to_email:
            logger.warning("Missing jd_id or to_email in request.")
            return jsonify({"error": "Missing required fields"}), 400
 
        # Ensure labels exist
        for m in top_matches:
            if "label" not in m:
                m["label"] = get_label(m.get("score", 0))
 
        recommended = [m for m in top_matches if m["label"] in [
            "✅ Highly Recommended",
            "☑️ Recommended",
            "🟡 Decent – Can Explore"
        ]]
        has_matches = bool(recommended)
 
        subject = f"Top Matches for {job_title}" if has_matches else f"No Strong Matches Found for {job_title}"
        valid_attachments = [f for f in attachments if f and os.path.exists(f)] if has_matches else []
 
        if not has_matches:
            logger.info("No recommended matches. Email will be sent without attachments.")
        else:
            logger.info(f"Valid attachments: {valid_attachments}")
 
        _, html_body = build_match_summary_html(top_matches, job_title)
 
        status = send_email_with_attachments(
            subject=subject,
            to_email=to_email,
            cc_list=cc_list,
            html_body=html_body,
            attachments=valid_attachments
        )
 
        latency = round(time.time() - start, 4)
 
        # ✅ Log the email
        email_log = EmailLog(
            jd_id=jd_id,
            sent_to=to_email,
            cc=", ".join(cc_list),
            status="Sent" if "success" in status.lower() else "Failed",
            pdf_path=", ".join(valid_attachments) if valid_attachments else None,
            latency=latency
        )
        db.session.add(email_log)
        db.session.commit()
        logger.info("Email log saved to database.")
 
        # ✅ Update JD status to 'Completed' if it was in 'Review'
        try:
            jd = JD.query.get(jd_id)
            if jd and jd.status == 'Review':
                jd.status = 'Completed'
                db.session.commit()
                logger.info(f"✅ JD ID {jd_id} status updated to Completed after email sent.")
        except Exception as e:
            db.session.rollback()
            logger.error(f"❌ Failed to update JD status to Completed: {e}", exc_info=True)
 
        return jsonify({"message": status})
 
    except Exception as e:
        logger.error(f"Failed to send email: {e}", exc_info=True)
        log_agent_error("EmailError", str(e), method="send-email/matches-final")
        return jsonify({"error": "Internal Server Error"}), 500
    
@email_bp.route('/send-email/recommended-profile', methods=['POST'])
def send_email_to_consultant():
    try:
        data = request.json
        to_email = data.get('to_email')
        from_email = data.get('from_email')  # recruiter
        cc_list = data.get('cc_list', [])
        jd_id = data.get('jd_id')
        consultant_name = data.get('consultant_name')
        job_title = data.get('job_title', 'your role')
 
        subject = f"Opportunity Matching Your Profile - {job_title}"
        html_body = f"""
        <html><body>
        <p>Dear {consultant_name},</p>
        <p>We found a job opening that matches your profile for the role of <b>{job_title}</b>.</p>
        <p>Please let us know your interest to proceed further.</p>
        <p style="font-family: Arial, sans-serif; font-size:14px; color:#333; margin-top: 40px;">
  Warm regards,<br>
  <strong style="font-size:16px;">RadarX AI Assistant</strong><br>
  <span style="font-size:13px; color:#777;">The Radar for Talent</span>
</p>

        </body></html>
        """
 
        status = send_email_with_attachments(
            subject=subject,
            to_email=to_email,
            cc_list=cc_list,
            html_body=html_body,
            attachments=[]
        )
 
        return jsonify({"message": status})
    except Exception as e:
        log_agent_error("SendConsultantEmail", str(e), method="send-email/recommended-profile")
        return jsonify({"error": "Internal Server Error"}), 500