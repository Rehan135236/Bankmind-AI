from typing import List
from sentence_transformers import SentenceTransformer
from app.core.config import settings

_model = None

def get_embedding_model() -> SentenceTransformer:
    global _model
    if _model is None:
        # Load local Hugging Face sentence-transformers model
        _model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
    return _model


def embed_texts(texts: List[str]) -> List[List[float]]:
    model = get_embedding_model()
    embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
    return embeddings.tolist()


def embed_query(query: str) -> List[float]:
    model = get_embedding_model()
    embedding = model.encode([query], convert_to_numpy=True, normalize_embeddings=True)
    return embedding[0].tolist()
