from models import db, AgentErrorLog, MatchLearningCache
from datetime import datetime

def log_agent_error(error_type, error_message, method="unknown"):
    """
    Logs errors occurring within agent matching processes into the database.
    If logging fails, prints to console as fallback.
    """
    try:
        error = AgentErrorLog(
            error_type=error_type,
            error_message=error_message,
            method=method
        )
        db.session.add(error)
        db.session.commit()
    except Exception as e:
        print("[AGENT LOGGING ERROR]", e)



