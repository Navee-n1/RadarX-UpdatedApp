import re
from collections import defaultdict

# Controlled vocabularies — can be expanded
LANGUAGES = {"python", "java", "c#", "c++", "typescript", "javascript", "html", "css", "sql", "c"}
FRAMEWORKS = {"react", "django", ".net", "asp.net", "spring", "flask", "express", "tailwind", "nunit"}
TOOLS = {"postman", "swagger", "vscode", "eclipse", "jupyter", "powerbi", "figma", "github"}
CLOUDS = {"aws", "azure", "gcp", "google cloud", "cloud", "oracle"}
LIBRARIES = {"jwt", "entity framework", "pandas", "numpy", "llm"}
SOFT = {"public speaking", "mentoring", "technical writing", "community", "event management"}

ALL_SKILLS = LANGUAGES | FRAMEWORKS | TOOLS | CLOUDS | LIBRARIES | SOFT

def extract_skills_contextual(text):
    clean_text = text.lower()
    detected = set()

    for skill in ALL_SKILLS:
        if re.search(rf"\b{re.escape(skill)}\b", clean_text):
            detected.add(skill)

    return sorted(detected)
