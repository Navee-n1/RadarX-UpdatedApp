import json
import torch
import re
from sentence_transformers import SentenceTransformer, util
from utils.utils import log_agent_error
from utils.skill_extractor import extract_skills_contextual
from utils.parser import extract_certifications, extract_projects

# 🔁 Use BGE embedding model
model = SentenceTransformer("BAAI/bge-base-en-v1.5")

# ──────────────────────────────────────
# Boost Categories
# ──────────────────────────────────────
HUMAN_SIGNAL_CONCEPTS = [
    "published research", "mentored juniors", "open source", "led a team",
    "speaker", "initiated project", "founded group", "recognized by org"
]

CERTIFICATION_CONCEPTS = [
    "industry certification", "cloud certified", "cybersecurity certificate",
    "AI credential", "project management certified", "data engineering certification"
]

PROJECT_SIGNAL_CONCEPTS = [
    "built application", "deployed product", "end-to-end project",
    "designed architecture", "managed rollout", "handled migration"
]

VERTICAL_SIGNAL_CONCEPTS = {
    "GEN-AI": "generative ai, prompt engineering, llm applications",
    "Banking": "financial domain, credit risk, investment platforms",
    "Insurance": "insurance policies, claims processing, underwriting systems",
    "GTT": "network infrastructure, telecom operations, global routing",
    "HTPS": "clinical systems, healthcare workflows, diagnosis tools",
    "Cloud": "cloud-native, devops, aws, azure, kubernetes, lambda",
    "Hexavarsity": "training platform, student management, internal lms",
    "Global Travel": "travel booking, ifs erp, flight scheduling, international systems"
}

# ──────────────────────────────────────
# Main Matching Function
# ──────────────────────────────────────
def compute_full_text_score(
    jd_embedding_str,
    profile_embedding_str,
    jd_text=None,
    profile_text=None,
    vertical=None,
    experience_years=None,
    profile_skills=None,
    profile_projects=None,
    profile_certifications=None
):
    try:
        jd_vec = torch.tensor([float(x) for x in json.loads(jd_embedding_str)]).unsqueeze(0)
        profile_vec = torch.tensor([float(x) for x in json.loads(profile_embedding_str)]).unsqueeze(0)

        cosine_score = float(util.cos_sim(jd_vec, profile_vec)[0][0])

        # Fall back to extractors if needed
        if not profile_skills and profile_text:
            profile_skills = extract_skills_contextual(profile_text)
        if not profile_projects and profile_text:
            profile_projects = extract_projects(profile_text)
        if not profile_certifications and profile_text:
            profile_certifications = extract_certifications(profile_text)

        # Boost scores
        skill_score = compute_skill_overlap(jd_text, profile_skills)
        experience_score = compute_experience_alignment(jd_text, experience_years)
        project_alignment = compute_project_alignment(profile_projects)
        certification_boost = compute_certification_boost(profile_certifications)
        uniqueness_score = semantic_signal_score(profile_text, HUMAN_SIGNAL_CONCEPTS)
        vertical_boost = vertical_signal_score(jd_text, vertical)

        total_score = (
            cosine_score * 0.5 +
            skill_score * 0.15 +
            experience_score * 0.1 +
            project_alignment * 0.1 +
            certification_boost * 0.05 +
            uniqueness_score * 0.05 +
            vertical_boost * 0.05
        )

        return round(min(total_score, 1.0), 4)

    except Exception as e:
        log_agent_error("ScoringError", str(e), method="compute_full_text_score")
        return 0.0

# ──────────────────────────────────────
# Label Generator
# ──────────────────────────────────────
def get_label(score):
    if score >= 0.85:
        return "Perfect Match"
    elif score >= 0.7:
        return "Strong Match"
    elif score >= 0.5:
        return "Good Match"
    elif score >= 0.35:
        return "Average Match"
    return "Weak Match"

# ──────────────────────────────────────
# Subscore Helpers
# ──────────────────────────────────────

def compute_skill_overlap(jd_text, profile_input):
    if not jd_text or not profile_input:
        return 0.0
    jd_tokens = set(jd_text.lower().split())
    if isinstance(profile_input, str):
        profile_tokens = set(profile_input.lower().split())
    else:
        profile_tokens = set([s.lower() for s in profile_input if isinstance(s, str)])
    match = jd_tokens & profile_tokens
    return min(len(match) / 15.0, 1.0)

def compute_experience_alignment(jd_text, experience_years):
    if not jd_text or not experience_years:
        return 0.0
    try:
        match = re.search(r'(\d{1,2})\+?\s?(?:years?|yrs?)', jd_text.lower())
        if match:
            required = int(match.group(1))
            ratio = experience_years / required
            return min(max(ratio, 0.0), 1.2) - 0.2
    except:
        pass
    return 0.0

def compute_project_alignment(projects):
    if not projects:
        return 0.0
    if isinstance(projects, str):
        projects = [projects]
    hits = sum(1 for p in projects for signal in PROJECT_SIGNAL_CONCEPTS if signal.lower() in p.lower())
    return min(hits * 0.05, 0.15)

def compute_certification_boost(certs):
    if not certs:
        return 0.0
    if isinstance(certs, str):
        certs = [certs]
    hits = sum(1 for c in certs for signal in CERTIFICATION_CONCEPTS if signal.lower() in c.lower())
    return min(hits * 0.05, 0.15)

def semantic_signal_score(text, concepts):
    if not text:
        return 0.0
    try:
        text_embed = model.encode(text, convert_to_tensor=True)
        count = 0
        for concept in concepts:
            concept_embed = model.encode(concept, convert_to_tensor=True)
            sim = float(util.cos_sim(text_embed, concept_embed)[0][0])
            if sim >= 0.5:
                count += 1
        return min(count * 0.05, 0.15)
    except:
        return 0.0

def vertical_signal_score(jd_text, vertical):
    if not jd_text or not vertical:
        return 0.0
    vertical_concept = VERTICAL_SIGNAL_CONCEPTS.get(vertical, None)
    if not vertical_concept:
        return 0.0
    try:
        jd_embed = model.encode(jd_text, convert_to_tensor=True)
        concept_embed = model.encode(vertical_concept, convert_to_tensor=True)
        sim = float(util.cos_sim(jd_embed, concept_embed)[0][0])
        return min(max(sim, 0.0), 1.0) * 0.15 if sim > 0.5 else 0.0
    except:
        return 0.0
