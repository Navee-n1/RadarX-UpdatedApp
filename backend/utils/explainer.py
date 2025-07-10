import re
import cohere
from sentence_transformers import SentenceTransformer, util
from utils.skill_extractor import extract_skills_contextual
from utils.parser import extract_experience
from utils.utils import log_agent_error
from models import Config
from flask import current_app as app

# ✅ Use BGE embedding model
model = SentenceTransformer('BAAI/bge-base-en-v1.5')
MAX_SUMMARY_CHARS = 2000

BONUS_SIGNALS = [
    "open source", "published", "mentored", "led team", "founded", "speaker",
    "initiated", "whitepaper", "conference"
]

CERT_SIGNALS = [
    "certified", "certification", "certificate", "aws certified", "google certified",
    "microsoft certified", "scrum master", "pmp", "ccna", "cissp", "azure certified"
]

PROJECT_SIGNALS = [
    "end-to-end", "architecture", "designed", "built", "launched", "deployed",
    "developed", "managed", "solution"
]

# ─────────────────────────────────────
# Helpers
# ─────────────────────────────────────

def fetch_genai_config():
    with app.app_context():
        provider_cfg = Config.query.filter_by(key="genai_provider").first()
        key_cfg = Config.query.filter_by(key="genai_key").first()
        enabled_cfg = Config.query.filter_by(key="genai_enabled").first()
        prompt_cfg = Config.query.filter_by(key="genai_prompt").first()

        return {
            "provider": (provider_cfg.value or "").strip().lower() if provider_cfg else "",
            "api_key": (key_cfg.value or "").strip() if key_cfg else "",
            "enabled": (enabled_cfg.value or "false").strip().lower() == "true" if enabled_cfg else False,
            "prompt": (prompt_cfg.value or "").strip() if prompt_cfg else ""
        }

def semantic_skill_score(jd_skills, resume_skills, threshold=0.5):
    if not jd_skills or not resume_skills:
        return [], 0.0

    jd_skills = [s.strip() for s in jd_skills if isinstance(s, str) and s.strip()]
    resume_skills = [s.strip() for s in resume_skills if isinstance(s, str) and s.strip()]

    jd_emb = model.encode(jd_skills, convert_to_tensor=True)
    res_emb = model.encode(resume_skills, convert_to_tensor=True)

    matched = []
    used = set()
    for i, jd_vec in enumerate(jd_emb):
        scores = util.pytorch_cos_sim(jd_vec, res_emb)[0]
        for j, score in sorted(enumerate(scores), key=lambda x: x[1], reverse=True):
            if score >= threshold and j not in used:
                matched.append((jd_skills[i], resume_skills[j], round(float(score), 2)))
                used.add(j)
                break

    ratio = len(matched) / max(len(jd_skills), 1)
    return matched, round(ratio, 2)

def semantic_signal_score(text, keywords, threshold=0.5):
    if not text:
        return []
    found = []
    text_emb = model.encode(text, convert_to_tensor=True)
    for k in keywords:
        k_emb = model.encode(k, convert_to_tensor=True)
        sim = float(util.cos_sim(text_emb, k_emb)[0][0])
        if sim >= threshold:
            found.append(k)
    return found
def extract_sentences_with_keywords(text, keywords):
    lines = text.split('\n')
    found = []

    BAD_PATTERNS = [
        "phone", "linkedin", "github", "email", "college", "junior college",
        "bachelor", "intermediate", "school", "university", "cgpa", "gpa",
        "tadepalligudem", "vijayawada", "chennai", "ap", "tamilnadu", "andhra", "education",
        "engineer", "technologies", "role", "experience", "project", "intern", "present", "past",
        "location", "designation", "years", "months"
    ]

    for line in lines:
        l = line.lower()
        if any(k in l for k in keywords):
            clean = re.sub(
                r"(email:\s*[\w\.-]+@[\w\.-]+\.\w+)|"
                r"(phone:\s*(\+?\d[\d\s\-\(\)]{7,}\d))|"
                r"(github:\s*(https?://)?(www\.)?github\.com/\S+)|"
                r"(https?://(www\.)?github\.com/\S+)|"
                r"\b[\w\.-]+@[\w\.-]+\.\w+\b|"
                r"linkedin\.com/\S+|github\.com/\S+|"
                r"\b\d{10}\b|"
                r"^\s*[\u2600-\u26FF\u2700-\u27BF]+.*",
                "", line, flags=re.I
            )
            clean = re.sub(r"^\s*(?:[\-\*\•]|(\d+)[\.\)\-])\s*", "", clean)

            if len(clean.strip().split()) < 3:
                continue

            if any(bad in clean.lower() for bad in BAD_PATTERNS):
                continue

            found.append(clean.strip())

    return found[:5]

def clean_highlights(lines):
    # Optional: further cleanup if needed
    cleaned = []
    seen = set()
    for line in lines:
        if line not in seen and len(line.split()) > 3:
            cleaned.append(line)
            seen.add(line)
    return cleaned[:5]

# ─────────────────────────────────────
# Main Explanation Generator
# ─────────────────────────────────────

def generate_explanation(jd_text, resume_text, use_gpt=False):
    jd_skills = extract_skills_contextual(jd_text)
    res_skills = extract_skills_contextual(resume_text)

    jd_exp = extract_experience(jd_text)
    res_exp = extract_experience(resume_text)
    exp_match = abs(jd_exp - res_exp) <= 1 if jd_exp and res_exp else False

    exact_match = sorted(set(jd_skills) & set(res_skills))
    missing = sorted(set(jd_skills) - set(res_skills))

    semantic_pairs, semantic_ratio = semantic_skill_score(jd_skills, res_skills)

    certs = semantic_signal_score(resume_text, CERT_SIGNALS)
    bonus_signals = semantic_signal_score(resume_text, BONUS_SIGNALS)
    project_signals = semantic_signal_score(resume_text, PROJECT_SIGNALS)

    raw_highlights = extract_sentences_with_keywords(resume_text, exact_match + certs + bonus_signals)
    highlights = clean_highlights(raw_highlights)

    explanation = {
        "summary": f"{len(exact_match)} exact, {len(semantic_pairs)} semantic skills. "
                   f"Experience: {res_exp} vs {jd_exp} yrs — {'✅ OK' if exp_match else '⚠️ Mismatch'}",
        "skills_matched": exact_match[:15],
        "skills_semantic": [f"{pair[0]} ↔ {pair[1]}" for pair in semantic_pairs[:5]],
        "skills_missing": missing[:10],
        "resume_highlights": highlights,
        "certifications": certs,
        "bonus_signals": bonus_signals,
        "project_signals": project_signals,
        "experience_years_resume": res_exp,
        "experience_years_jd": jd_exp,
        "source": "BGE"
    }

    try:
        config = fetch_genai_config()
        if use_gpt and config["enabled"] and config["provider"] == "cohere" and config["api_key"]:
            co = cohere.Client(config["api_key"])
            prompt = config["prompt"] or "Summarize fit quality, skills match, experience, certifications, and any unique strength."
            final_prompt = f"""
You are a technical recruiter. Analyze how well this resume matches the job.

Job Description:
{jd_text[:1500]}

Resume:
{resume_text[:1500]}

Instruction:
{prompt}
            """.strip()
            response = co.chat(message=final_prompt, model="command-r")
            explanation["gpt_summary"] = response.text.strip()[:MAX_SUMMARY_CHARS] if hasattr(response, "text") else "⚠️ No GenAI output"
            explanation["source"] = "Cohere"
    except Exception as e:
        log_agent_error("GenAIExplanationError", str(e), method="generate_explanation")
        explanation["gpt_summary"] = f"⚠️ GenAI failed: {e}"
        explanation["source"] = "BGE"

    return explanation
