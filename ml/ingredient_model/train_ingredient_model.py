"""
Training script skeleton for the Ingredient Intelligence Engine.

This module wires together:
- Ingredient text preprocessing.
- Sentence-transformers embeddings (GPU-accelerated when available).
- A simple multi-label classifier implemented in PyTorch.

Expected dataset format (e.g. CSV):

    ingredient_text,added_sugar,artificial_color,preservative,emulsifier,artificial_flavor,caffeine,palm_oil,natural_protein_source,fiber_source
    "Sugar, palm oil, cocoa powder, emulsifier (soy lecithin), vanilla flavor",1,0,0,1,1,0,1,0,0
    "Whole grain oats, almonds, chicory root fiber, honey",0,0,0,0,0,0,0,1,1

- `ingredient_text` (str): raw ingredient string from packaging.
- Each label column (int): 1 for present/relevant, 0 otherwise.

This script is a skeleton: you should adapt batch sizes, epochs,
hyperparameters, and proper dataset loading for production training.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import List

import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import pandas as pd
from torch.utils.data import Dataset, DataLoader

from .embedder import encode_ingredients
from .preprocess import preprocess_ingredients


LABEL_COLUMNS: List[str] = [
    "added_sugar",
    "artificial_color",
    "preservative",
    "emulsifier",
    "artificial_flavor",
    "caffeine",
    "palm_oil",
    "natural_protein_source",
    "fiber_source",
]


class IngredientDataset(Dataset):
    """
    Simple dataset wrapping ingredient texts and multi-label targets.
    """

    def __init__(self, df: pd.DataFrame):
        self.texts = df["ingredient_text"].astype(str).tolist()
        self.labels = df[LABEL_COLUMNS].astype("float32").values

    def __len__(self) -> int:
        return len(self.texts)

    def __getitem__(self, idx: int):
        return self.texts[idx], self.labels[idx]


class IngredientClassifier(nn.Module):
    """
    Small feed-forward network on top of frozen sentence-transformer embeddings.

    The embeddings capture semantic information; this head learns to map
    them to ingredient-category probabilities.
    """

    def __init__(self, embedding_dim: int, num_labels: int):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(embedding_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, num_labels),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


@dataclass
class TrainingConfig:
    data_path: Path
    output_path: Path = Path("ml/saved_models/ingredient_model.pkl")
    batch_size: int = 32
    num_epochs: int = 5
    learning_rate: float = 1e-3


def collate_batch(batch):
    texts, labels = zip(*batch)
    # Preprocess ingredient strings then get embeddings.
    processed = [preprocess_ingredients(t) for t in texts]
    # .clone() escapes inference mode so the tensor can be used with autograd.
    embeddings = encode_ingredients(processed).clone()  # (batch_size, embedding_dim)
    labels_tensor = torch.tensor(np.array(labels), dtype=torch.float32, device=embeddings.device)
    return embeddings, labels_tensor


def train_ingredient_model(cfg: TrainingConfig) -> None:
    """
    High-level training loop.

    Loads data, builds the model, trains, and saves the model parameters
    plus label metadata to `cfg.output_path`.
    """
    df = pd.read_csv(cfg.data_path)
    dataset = IngredientDataset(df)
    dataloader = DataLoader(
        dataset,
        batch_size=cfg.batch_size,
        shuffle=True,
        collate_fn=collate_batch,
    )

    # Peek one batch to infer embedding dimension and device.
    sample_embeddings, _ = next(iter(dataloader))
    embedding_dim = sample_embeddings.shape[1]
    device = sample_embeddings.device

    model = IngredientClassifier(embedding_dim=embedding_dim, num_labels=len(LABEL_COLUMNS)).to(
        device
    )
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=cfg.learning_rate)

    model.train()
    for epoch in range(cfg.num_epochs):
        epoch_loss = 0.0
        for embeddings, targets in dataloader:
            optimizer.zero_grad()
            logits = model(embeddings)
            loss = criterion(logits, targets)
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item() * embeddings.size(0)

        avg_loss = epoch_loss / len(dataset)
        print(f"Epoch {epoch + 1}/{cfg.num_epochs} - loss: {avg_loss:.4f}")

    cfg.output_path.parent.mkdir(parents=True, exist_ok=True)

    # Save model state_dict and label metadata in a pickle-friendly dict.
    checkpoint = {
        "state_dict": model.state_dict(),
        "label_columns": LABEL_COLUMNS,
        "embedding_model_name": "all-MiniLM-L6-v2",
    }
    torch.save(checkpoint, cfg.output_path)
    print(f"Saved ingredient model to {cfg.output_path}")


if __name__ == "__main__":
    # Example usage:
    #
    # Place a CSV file at `ml/data/ingredient_labels.csv` with the schema
    # described in the module docstring, then run:
    #
    #   python -m ml.ingredient_model.train_ingredient_model
    #
    # or from the project root:
    #
    #   python -m ml.ingredient_model.train_ingredient_model --data ml/data/ingredient_labels.csv
    #
    import argparse

    parser = argparse.ArgumentParser(description="Train Ingredient Intelligence model.")
    parser.add_argument(
        "--data",
        type=str,
        default="ml/data/ingredient_labels.csv",
        help="Path to CSV file with ingredient_text and label columns.",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="ml/saved_models/ingredient_model.pkl",
        help="Path to save trained model checkpoint.",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=5,
        help="Number of training epochs.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=32,
        help="Mini-batch size.",
    )
    args = parser.parse_args()

    config = TrainingConfig(
        data_path=Path(args.data),
        output_path=Path(args.output),
        num_epochs=args.epochs,
        batch_size=args.batch_size,
    )
    train_ingredient_model(config)

