"""
Obfuscated naming system for manhua panels.
Uses HMAC-SHA256 to generate deterministic but unpredictable filenames.
The original order is preserved via a manifest file.
"""

import hmac
import hashlib
import json
from pathlib import Path
from typing import List, Optional

import config

# Import the actual output extension from converter
try:
    from converter import OUTPUT_EXT
except ImportError:
    OUTPUT_EXT = ".avif"


def generate_obfuscated_name(
    secret_key: str,
    manga_id: str,
    chapter: str,
    sequence: int,
    extension: str = None,
) -> str:
    """
    Generate a deterministic but unpredictable filename using HMAC-SHA256.
    Without the secret key, it's impossible to guess the next filename.
    """
    if extension is None:
        extension = OUTPUT_EXT
    message = f"{manga_id}/{chapter}/{sequence:06d}"
    h = hmac.new(secret_key.encode("utf-8"), message.encode("utf-8"), hashlib.sha256)
    # 16 hex chars = 64 bits of entropy, plenty to prevent guessing
    name_hash = h.hexdigest()[:16]
    return f"{name_hash}{extension}"


def generate_names_for_chapter(
    manga_id: str,
    chapter: str,
    image_count: int,
    secret_key: str = config.NAMING_SECRET_KEY,
) -> List[str]:
    """Generate obfuscated names for all images in a chapter."""
    return [
        generate_obfuscated_name(secret_key, manga_id, chapter, i + 1)
        for i in range(image_count)
    ]


def create_manifest(
    manga_id: str,
    chapter: str,
    panels: List[dict],
    output_dir: Optional[Path] = None,
) -> dict:
    """
    Create and save a manifest JSON mapping order → obfuscated filenames + Cloudinary URLs.

    Each panel dict should have:
      - order: int
      - original_name: str
      - obfuscated_name: str
      - cloudinary_url: str (optional, filled after upload)
      - cloudinary_public_id: str (optional, filled after upload)
      - original_size: int
      - converted_size: int
    """
    total_original = sum(p.get("original_size", 0) for p in panels)
    total_converted = sum(p.get("converted_size", 0) for p in panels)
    compression_ratio = (
        round(total_converted / total_original, 4) if total_original > 0 else 1.0
    )

    manifest = {
        "manga_id": manga_id,
        "chapter": chapter,
        "total_panels": len(panels),
        "panels": panels,
        "stats": {
            "total_original_size": total_original,
            "total_converted_size": total_converted,
            "compression_ratio": compression_ratio,
            "space_saved_bytes": total_original - total_converted,
            "space_saved_percent": round((1 - compression_ratio) * 100, 2),
        },
    }

    if output_dir is None:
        output_dir = config.MANIFESTS_DIR

    output_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = output_dir / f"{manga_id}_{chapter}.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    return manifest


def load_manifest(manga_id: str, chapter: str, manifests_dir: Optional[Path] = None) -> Optional[dict]:
    """Load an existing manifest if it exists."""
    if manifests_dir is None:
        manifests_dir = config.MANIFESTS_DIR
    manifest_path = manifests_dir / f"{manga_id}_{chapter}.json"
    if manifest_path.exists():
        with open(manifest_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None
