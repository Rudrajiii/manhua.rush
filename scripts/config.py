"""
Configuration loader for ManhuaRush scripts.
Reads from .env file and provides defaults.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the scripts directory
SCRIPTS_DIR = Path(__file__).parent.resolve()
ENV_PATH = SCRIPTS_DIR / ".env"
load_dotenv(ENV_PATH)


def get(key: str, default: str = "") -> str:
    return os.getenv(key, default)


CLOUDINARY_CLOUD_NAME = get("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = get("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = get("CLOUDINARY_API_SECRET")
NAMING_SECRET_KEY = get("NAMING_SECRET_KEY", "default-insecure-key-change-me")
PRODUCTION_DIR = Path(get("PRODUCTION_DIR", "../manhua-rush/production"))
CLOUDINARY_ROOT_FOLDER = get("CLOUDINARY_ROOT_FOLDER", "manhua-rush-production")
AVIF_QUALITY = int(get("AVIF_QUALITY", "50"))
AVIF_SPEED = int(get("AVIF_SPEED", "4"))

# Resolve production dir relative to scripts dir
if not PRODUCTION_DIR.is_absolute():
    PRODUCTION_DIR = (SCRIPTS_DIR / PRODUCTION_DIR).resolve()

# Directories created at runtime
MANIFESTS_DIR = SCRIPTS_DIR / "manifests"
TEMP_DIR = SCRIPTS_DIR / "temp"
MANIFESTS_DIR.mkdir(exist_ok=True)
TEMP_DIR.mkdir(exist_ok=True)

# Supported image extensions
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".bmp", ".tiff"}
