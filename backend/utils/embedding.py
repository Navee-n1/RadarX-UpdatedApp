from sentence_transformers import SentenceTransformer

# Load BGE model (optimized for role-specific embeddings)
model = SentenceTransformer("all-MiniLM-L6-v2")

def generate_embedding(text, instruction="Represent this as a candidate profile"):
    """
    Generate an instruction-based embedding using BGE.

    Args:
        text (str): The input JD or resume text.
        instruction (str): The instruction to help the model contextualize the input.

    Returns:
        List[float]: Embedding vector.
    """
    if not text or not text.strip():
        return []

    prompt = f"{instruction}: {text.strip()}"
    return model.encode(prompt, normalize_embeddings=True).tolist()
