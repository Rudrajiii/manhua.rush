"""
Image converter: handles JPEG/PNG/WEBP → AVIF conversion with maximum compression.
Skips files that are already in AVIF format.
Falls back to WebP if AVIF support is not available.

To enable AVIF support, install ONE of:
    pip install pillow-avif-plugin
    pip install pillow-heif
"""

import os
import re
from pathlib import Path
from typing import Optional

from PIL import Image

import config

# Detect AVIF support
_AVIF_AVAILABLE = False
_avif_method = "none"

# Method 1: pillow-avif-plugin (registers AVIF codec with Pillow)
try:
    import pillow_avif  # noqa: F401
    _AVIF_AVAILABLE = True
    _avif_method = "pillow-avif-plugin"
except ImportError:
    pass

# Method 2: pillow_heif (also registers AVIF codec)
if not _AVIF_AVAILABLE:
    try:
        from pillow_heif import register_avif_opener #type:ignore
        register_avif_opener()
        _AVIF_AVAILABLE = True
        _avif_method = "pillow-heif"
    except ImportError:
        pass

# Method 3: Test if Pillow natively supports AVIF (Pillow 10.1+ with libavif)
if not _AVIF_AVAILABLE:
    try:
        from PIL import features
        if features.check("avif"):
            _AVIF_AVAILABLE = True
            _avif_method = "pillow-native"
    except Exception:
        pass

# Determine output format
OUTPUT_FORMAT = "AVIF" if _AVIF_AVAILABLE else "WEBP"
OUTPUT_EXT = ".avif" if _AVIF_AVAILABLE else ".webp"

print(f"[converter] AVIF support: {'YES (' + _avif_method + ')' if _AVIF_AVAILABLE else 'NO — falling back to WebP'}")
if not _AVIF_AVAILABLE:
    print("[converter] To enable AVIF: pip install pillow-avif-plugin  OR  pip install pillow-heif")


def natural_sort_key(filename: str):
    """Sort filenames naturally so img_2 comes before img_10."""
    return [
        int(part) if part.isdigit() else part.lower()
        for part in re.split(r"(\d+)", filename)
    ]


def scan_folder(folder_path: Path) -> dict:
    """
    Scan the production folder and return a structured dict of all manga/chapter/images.
    Returns: {manga_id: {chapter: [sorted list of image filenames]}}
    """
    result = {}
    if not folder_path.exists():
        return result

    for manga_dir in sorted(folder_path.iterdir()):
        if not manga_dir.is_dir():
            continue
        manga_id = manga_dir.name
        result[manga_id] = {}

        for chapter_dir in sorted(manga_dir.iterdir(), key=lambda p: natural_sort_key(p.name)):
            if not chapter_dir.is_dir():
                continue
            chapter = chapter_dir.name

            images = []
            for f in chapter_dir.iterdir():
                if f.is_file() and f.suffix.lower() in config.IMAGE_EXTENSIONS:
                    images.append(f.name)
            images.sort(key=natural_sort_key)
            if images:
                result[manga_id][chapter] = images

    return result


def get_file_size(file_path: Path) -> int:
    """Get file size in bytes."""
    return file_path.stat().st_size if file_path.exists() else 0


def is_avif(file_path: Path) -> bool:
    """Check if a file is already AVIF format."""
    return file_path.suffix.lower() == ".avif"


def convert_to_avif(
    input_path: Path,
    output_path: Path,
    quality: int = config.AVIF_QUALITY,
    speed: int = config.AVIF_SPEED,
) -> dict:
    """
    Convert an image to AVIF format with high compression.
    Falls back to WebP if AVIF is not available.
    Returns dict with original_size, converted_size, skipped status.
    """
    original_size = get_file_size(input_path)

    # If already in target format, copy as-is
    if input_path.suffix.lower() == OUTPUT_EXT:
        if input_path != output_path:
            import shutil
            output_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(input_path, output_path)
        return {
            "original_size": original_size,
            "converted_size": original_size,
            "skipped": True,
            "output_path": str(output_path),
        }

    # Fix output extension to match actual format
    if output_path.suffix.lower() != OUTPUT_EXT:
        output_path = output_path.with_suffix(OUTPUT_EXT)

    # Convert
    output_path.parent.mkdir(parents=True, exist_ok=True)

    save_kwargs = {"quality": quality}
    if OUTPUT_FORMAT == "AVIF":
        save_kwargs["speed"] = speed
        save_kwargs["codec"] = "auto"
    elif OUTPUT_FORMAT == "WEBP":
        save_kwargs["method"] = 6  # Slowest/best compression for WebP

    with Image.open(input_path) as img:
        if img.mode in ("RGBA", "LA", "PA"):
            img.save(str(output_path), format=OUTPUT_FORMAT, **save_kwargs)
        else:
            img = img.convert("RGB")
            img.save(str(output_path), format=OUTPUT_FORMAT, **save_kwargs)

    converted_size = get_file_size(output_path)
    return {
        "original_size": original_size,
        "converted_size": converted_size,
        "skipped": False,
        "output_path": str(output_path),
    }


def get_folder_stats(folder_path: Path) -> dict:
    """Get total size stats for a folder."""
    total_size = 0
    file_count = 0
    for f in folder_path.rglob("*"):
        if f.is_file() and f.suffix.lower() in config.IMAGE_EXTENSIONS:
            total_size += get_file_size(f)
            file_count += 1
    return {"total_size": total_size, "file_count": file_count}
