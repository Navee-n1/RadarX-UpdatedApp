from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean, ForeignKey, Index

db = SQLAlchemy()

# ─────────────── USERS ────────────────
class User(db.Model):
    __tablename__ = 'user'
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, nullable=False)  # 'recruiter', 'ar', 'admin'
    password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─────────────── JOB DESCRIPTIONS ────────────────
class JD(db.Model):
    __tablename__ = 'jd'
 
    id = Column(Integer, primary_key=True)
    file_path = Column(String, nullable=False)
    uploaded_by = Column(String)
    project_code = Column(String)
    job_title = Column(String)
    extracted_text = Column(Text)
    embedding_vector = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
 
    status = Column(String, default="Pending")  # ✅ New column for tracking JD status
 
    match_results = db.relationship('MatchResult', backref='jd', lazy=True)


# ─────────────── CONSULTANT PROFILES ────────────────
class Profile(db.Model):
    __tablename__ = 'profile'
    id = Column(Integer, primary_key=True)
    emp_id = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    email=Column(String,nullable=False)
    role=Column(String, nullable=False)
    status=Column(String,nullable=False)
    vertical = Column(String)
    skills = Column(Text)
    experience_years = Column(Float)
    resume_path = Column(String)
    extracted_text = Column(Text)
    embedding_vector = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    match_results = db.relationship('MatchResult', backref='profile', lazy=True)


# ─────────────── LEGACY RESUMES ────────────────
class Resume(db.Model):
    __tablename__ = 'resume'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    file_path = Column(String, nullable=False)
    email = Column(String)
    skills = Column(Text)
    experience = Column(Integer)
    certifications = Column(Text)
    projects = Column(Text)
    domain = Column(String)
    extracted_text = Column(Text)
    embedding_vector = Column(Text)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    match_results = db.relationship('MatchResult', backref='resume', lazy=True)


# ─────────────── MATCH RESULTS ────────────────
class MatchResult(db.Model):
    __tablename__ = 'match_result'
    id = Column(Integer, primary_key=True)
    jd_id = Column(Integer, ForeignKey('jd.id'), nullable=False)
    profile_id = Column(Integer, ForeignKey('profile.id'), nullable=True)
    resume_id = Column(Integer, ForeignKey('resume.id'), nullable=True)
    score = Column(Float, nullable=False)
    explanation = Column(Text)
    match_type = Column(String)  # 'jd-to-profile', 'resume-to-jd', 'one-to-one'
    method = Column(String)      # 'SBERT', 'GPT', etc.
    latency = Column(Float)
    explanation_latency = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index('ix_match_unique', 'jd_id', 'profile_id', 'resume_id'),
    )


# ─────────────── EMAIL LOG ────────────────
class EmailLog(db.Model):
    __tablename__ = 'email_log'
    id = Column(Integer, primary_key=True)
    jd_id = Column(Integer, ForeignKey('jd.id'))
    sent_to = Column(String)
    cc = Column(String)
    status = Column(String)
    pdf_path = Column(String)
    success = Column(Boolean, default=True)
    sent_at = Column(DateTime, default=datetime.utcnow)
    latency = Column(Float)


# ─────────────── FEEDBACK ────────────────
class Feedback(db.Model):
    __tablename__ = 'feedback'
    id = Column(Integer, primary_key=True)
    jd_id = Column(Integer, ForeignKey('jd.id'))
    resume_id = Column(Integer, ForeignKey('resume.id'), nullable=True)
    profile_id = Column(Integer, ForeignKey('profile.id'), nullable=True)
    given_by = Column(String)
    vote = Column(String)  # 'up', 'down'
    reason = Column(String)
    signal = Column(Float, default=0.0)
    submitted_at = Column(DateTime, default=datetime.utcnow)


# ─────────────── CONFIG TABLE ────────────────
class Config(db.Model):
    __tablename__ = 'config'
    id = Column(Integer, primary_key=True)
    key = Column(String, unique=True, nullable=False)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ─────────────── MATCH LEARNING CACHE ────────────────
class MatchLearningCache(db.Model):
    __tablename__ = 'match_learning_cache'
    id = Column(Integer, primary_key=True)
    jd_id = Column(Integer, ForeignKey('jd.id'))
    profile_id = Column(Integer, ForeignKey('profile.id'), nullable=True)
    resume_id = Column(Integer, ForeignKey('resume.id'), nullable=True)
    cumulative_score_adjustment = Column(Float, default=0.0)
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    last_feedback_at = Column(DateTime, default=datetime.utcnow)

class LiveStatusTracker(db.Model):
    __tablename__ = 'live_status_tracker'
    id = Column(Integer, primary_key=True)
    jd_id = Column(Integer, ForeignKey('jd.id'), nullable=False, unique=True)
    compared = Column(Boolean, default=False)
    ranked = Column(Boolean, default=False)
    emailed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    jd = db.relationship('JD', backref='status_tracker')

class AgentErrorLog(db.Model):
    __tablename__ = 'agent_error_log'
    id = Column(Integer, primary_key=True)
    jd_id = Column(Integer, ForeignKey('jd.id'), nullable=True)
    resume_id = Column(Integer, ForeignKey('resume.id'), nullable=True)
    route = Column(String)
    method = Column(String)
    error_type = Column(String)
    error_message = Column(Text)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Prompt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True)
    content = db.Column(db.Text)
