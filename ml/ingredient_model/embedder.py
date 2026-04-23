from functools import lru_cache
from typing import List

import torch
from sentence_transformers import SentenceTransformer


MODEL_NAME = "all-MiniLM-L6-v2"


def _get_device() -> str:
    """
    Select GPU if available, otherwise CPU.

    This is used for both training and inference so that embeddings benefit
    from hardware acceleration automatically on capable machines.
    """
    return "cuda" if torch.cuda.is_available() else "cpu"


@lru_cache(maxsize=1)
def get_embedder() -> SentenceTransformer:
    """
    Load the sentence-transformers model once and cache it.

    This function is safe to call from both training and inference code:
    the model will be loaded a single time per process.
    """
    device = _get_device()
    model = SentenceTransformer(MODEL_NAME, device=device)
    return model


def encode_ingredients(texts: List[str]) -> torch.Tensor:
    """
    Encode a list of ingredient strings into dense embedding vectors.

    Returns:
        Tensor of shape (batch_size, embedding_dim) on the current device.
    """
    if not texts:
        raise ValueError("encode_ingredients() received an empty list of texts.")

    model = get_embedder()
    # `convert_to_tensor=True` returns a torch.Tensor on the model's device.
    embeddings = model.encode(texts, convert_to_tensor=True, show_progress_bar=False)
    return embeddings

