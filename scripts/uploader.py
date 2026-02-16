"""
Cloudinary upload utilities for ManhuaRush.
Handles initialization, upload, connection testing, and usage stats.
"""

import config

# Lazy imports - cloudinary is only needed when actually uploading
cloudinary = None

def _ensure_cloudinary():
    global cloudinary
    if cloudinary is None:
        import cloudinary as _cl
        import cloudinary.uploader
        import cloudinary.api
        cloudinary = _cl


_initialized = False


def init_cloudinary():
    """Initialize Cloudinary SDK with credentials from config."""
    global _initialized
    if _initialized:
        return True

    _ensure_cloudinary()

    if not all([config.CLOUDINARY_CLOUD_NAME, config.CLOUDINARY_API_KEY, config.CLOUDINARY_API_SECRET]):
        raise ValueError(
            "Cloudinary credentials not set. "
            "Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env"
        )

    cloudinary.config(
        cloud_name=config.CLOUDINARY_CLOUD_NAME,
        api_key=config.CLOUDINARY_API_KEY,
        api_secret=config.CLOUDINARY_API_SECRET,
        secure=True,
    )
    _initialized = True
    return True


def check_connection() -> dict:
    """Test Cloudinary connection and return account info."""
    init_cloudinary()
    try:
        result = cloudinary.api.ping()
        usage = cloudinary.api.usage()
        return {
            "connected": True,
            "status": result.get("status", "ok"),
            "cloud_name": config.CLOUDINARY_CLOUD_NAME,
            "plan": usage.get("plan", "Free"),
            "storage_used": usage.get("storage", {}).get("used_bytes", 0),
            "storage_limit": usage.get("storage", {}).get("limit", 0),
            "storage_used_percent": usage.get("storage", {}).get("used_percent", 0),
            "bandwidth_used": usage.get("bandwidth", {}).get("used_bytes", 0),
            "bandwidth_limit": usage.get("bandwidth", {}).get("limit", 0),
            "credits_used": usage.get("credits", {}).get("used_percent", 0),
            "transformations_used": usage.get("transformations", {}).get("usage", 0),
            "resources": usage.get("resources", 0),
            "derived_resources": usage.get("derived_resources", 0),
        }
    except Exception as e:
        return {"connected": False, "error": str(e)}


def upload_image(
    local_path: str,
    public_id: str,
    folder: str = "",
    resource_type: str = "image",
) -> dict:
    """
    Upload a single image to Cloudinary.

    Args:
        local_path: Path to local file
        public_id: The public ID (filename without extension) in Cloudinary
        folder: Cloudinary folder path (creates folder structure in Media Library)
        resource_type: 'image', 'raw', or 'auto'

    Returns: Cloudinary upload result dict
    """
    init_cloudinary()

    upload_params = {
        "public_id": public_id,
        "resource_type": resource_type,
        "overwrite": True,
        "type": "upload",
        # Deliver as-is, no server-side transformations
        "format": None,
        # Access control
        "access_mode": "public",
    }

    # Use Cloudinary's folder parameter for proper Media Library folder structure
    # This creates visible folders in the dashboard instead of flat Home directory
    if folder:
        upload_params["folder"] = folder
        # asset_folder ensures correct folder display in fixed-folder-mode accounts
        upload_params["asset_folder"] = folder

    result = cloudinary.uploader.upload(local_path, **upload_params)

    return {
        "public_id": result.get("public_id", ""),
        "secure_url": result.get("secure_url", ""),
        "url": result.get("url", ""),
        "format": result.get("format", ""),
        "bytes": result.get("bytes", 0),
        "width": result.get("width", 0),
        "height": result.get("height", 0),
        "version": result.get("version", ""),
        "asset_id": result.get("asset_id", ""),
    }


def build_cloudinary_folder(manga_id: str, chapter: str) -> str:
    """Build the Cloudinary folder path matching production structure."""
    return f"{config.CLOUDINARY_ROOT_FOLDER}/{manga_id}/{chapter}"


def get_signed_url(public_id: str, expires_at: int = 0) -> str:
    """
    Generate a signed/time-limited Cloudinary URL.
    This makes hotlinking and scraping harder.

    Args:
        public_id: Cloudinary public ID
        expires_at: Unix timestamp for URL expiry (0 = no expiry)
    """
    init_cloudinary()
    import time

    if expires_at == 0:
        expires_at = int(time.time()) + 3600  # 1 hour from now

    url, _options = cloudinary.utils.cloudinary_url(
        public_id,
        sign_url=True,
        type="authenticated",
        secure=True,
    )
    return url


def delete_folder(folder_path: str) -> dict:
    """Delete a folder in Cloudinary (for cleanup)."""
    init_cloudinary()
    try:
        result = cloudinary.api.delete_resources_by_prefix(folder_path)
        cloudinary.api.delete_folder(folder_path)
        return {"success": True, "result": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


def format_bytes(size_bytes: int) -> str:
    """Format bytes into human-readable string."""
    if size_bytes == 0:
        return "0 B"
    units = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    size = float(size_bytes)
    while size >= 1024 and i < len(units) - 1:
        size /= 1024
        i += 1
    return f"{size:.2f} {units[i]}"
