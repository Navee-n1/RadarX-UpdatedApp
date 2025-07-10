import os
import re
import docx2txt
import PyPDF2
import spacy
import logging
from sentence_transformers import SentenceTransformer, util

nlp = spacy.load("en_core_web_sm")
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# Extract Raw Text from Resume or JD
# ─────────────────────────────────────────────

model = SentenceTransformer("BAAI/bge-base-en-v1.5")

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
def extract_text(path):
    ext = os.path.splitext(path)[1].lower()
    text = ""

    try:
        if ext == ".pdf":
            with open(path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                all_text = [page.extract_text() or "" for page in reader.pages]
                text = " ".join(all_text)

        elif ext == ".docx":
            text = docx2txt.process(path)

        elif ext == ".txt":
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()

        elif ext == ".doc":
            try:
                import textract
                text = textract.process(path).decode("utf-8")
            except ImportError:
                logger.warning("textract not installed. Skipping .doc file.")
                return None
        else:
            raise ValueError("Unsupported file type")

        # Optional UTF-8 sanitization
        text = text.encode("utf-8", errors="ignore").decode("utf-8")

    except Exception as e:
        logger.error(f"❌ Error reading file {os.path.basename(path)}: {e}")
        return None

    cleaned = clean_text(text)
    return cleaned if cleaned and len(cleaned.strip()) >= 30 else None

# ─────────────────────────────────────────────
# Clean Text (removes blank lines and spaces)
# ─────────────────────────────────────────────
def clean_text(text):
    if not text:
        return ""
    lines = text.split("\n")
    lines = [line.strip() for line in lines if line.strip()]
    return "\n".join(lines)

# ─────────────────────────────────────────────
# Extract Name and Email
# ─────────────────────────────────────────────
def extract_basic_info(text):
    email_match = re.search(r'\b[\w\.-]+@[\w\.-]+\.\w+\b', text)
    email = email_match.group(0) if email_match else None

    name = None
    try:
        doc = nlp(text[:500])
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                name = ent.text.strip()
                break
    except:
        pass

    if not name:
        name = text.strip().split("\n")[0]

    return {
        "name": name,
        "email": email
    }

# ─────────────────────────────────────────────
# Extract Experience (in years)
# ─────────────────────────────────────────────


CERT_KEYWORDS = [
    "certified", "certification", "certifications", "certificate",
    "aws certified", "azure certified", "google cloud", "scrum", "pmp", "ccna", "cissp"
]

PROJECT_KEYWORDS = [
    "developed", "built", "implemented", "designed", "launched",
    "led a team", "engineered", "created", "architected"
]

# ✅ Extract email from text
def extract_email(text):
    match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.\w{2,}\b', text)
    return match.group(0) if match else None

# ✅ Extract certifications based on keyword signals
def extract_certifications(text):
    lines = text.split('\n')
    found = []

    for line in lines:
        line_lower = line.lower()
        if any(kw in line_lower for kw in CERT_KEYWORDS):
            # Only include if it has "certified", "certificate", etc. as whole words
            if re.search(r'\b(certified|certification|certificate)\b', line_lower):
                clean_line = re.sub(r'[^a-zA-Z0-9,\-\(\)\.\s]', '', line)
                if len(clean_line.strip()) > 6:
                    found.append(clean_line.strip())

    return found[:5]


# ✅ Extract projects based on triggers or 'Projects' section
def extract_projects(text):
    projects = []

    for line in text.split('\n'):
        line_lower = line.lower()

        # Must match project trigger like 'developed', 'implemented', etc.
        if any(trigger in line_lower for trigger in PROJECT_KEYWORDS):
            if len(line.strip()) >= 10:
                clean = line.strip()

                # Exclude lines about team building, leading, etc.
                if not clean.lower().startswith('• built and led') and 'team' not in clean.lower():
                    projects.append(clean)

    return list(dict.fromkeys(projects))[:5]


# ✅ Optional: Extract experience in years
def extract_experience(text):
    match = re.search(r'(\d{1,2})\+?\s?(?:years?|yrs?)', text.lower())
    return int(match.group(1)) if match else None

def infer_domain_from_text(text):
    if not text:
        return None

    try:
        text_embed = model.encode(text, convert_to_tensor=True)
        best_match = None
        best_score = 0.0

        for domain, concept in VERTICAL_SIGNAL_CONCEPTS.items():
            concept_embed = model.encode(concept, convert_to_tensor=True)
            sim = float(util.cos_sim(text_embed, concept_embed)[0][0])
            if sim > best_score:
                best_score = sim
                best_match = domain

        return best_match if best_score > 0.5 else None
    except:
        return None
