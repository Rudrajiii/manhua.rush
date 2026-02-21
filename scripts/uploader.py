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

        # Helper to safely extract numeric values from several possible key names
        def _num(dct, *keys, default=0):
            for k in keys:
                v = dct.get(k) if isinstance(dct, dict) else None
                if v is None:
                    continue
                try:
                    return int(v)
                except Exception:
                    try:
                        return int(float(v))
                    except Exception:
                        return default
            return default

        storage_section = usage.get("storage") or usage.get("storage_usage") or {}
        bandwidth_section = usage.get("bandwidth") or usage.get("transfer") or usage.get("bandwidth_usage") or {}
        credits_section = usage.get("credits") or {}
        transformations_section = usage.get("transformations") or {}

        storage_used = _num(storage_section, "used_bytes", "usage_bytes", "usage", "used")
        storage_limit = _num(storage_section, "limit", "limit_bytes", "max")
        storage_used_pct = _num(storage_section, "used_percent", "usage_percent", default=0)

        bandwidth_used = _num(bandwidth_section, "used_bytes", "usage_bytes", "usage", "used")
        bandwidth_limit = _num(bandwidth_section, "limit", "limit_bytes", "max")

        # If storage seems 0 or suspicious, try to compute by listing resources
        storage_computed = False
        if storage_used == 0:
            try:
                total = 0
                next_cursor = None
                fetched = 0
                # iterate pages of resources (careful: could be many resources)
                while True:
                    opts = {"max_results": 500}
                    if next_cursor:
                        opts["next_cursor"] = next_cursor
                    resp = cloudinary.api.resources(**opts)
                    rlist = resp.get("resources") or []
                    for r in rlist:
                        try:
                            total += int(r.get("bytes") or 0)
                        except Exception:
                            continue
                    fetched += len(rlist)
                    next_cursor = resp.get("next_cursor")
                    # safety: stop if too many resources
                    if not next_cursor or fetched > 5000:
                        break
                if total > 0:
                    storage_used = total
                    storage_computed = True
            except Exception:
                # ignore fallback failures
                pass

        return {
            "connected": True,
            "status": result.get("status", "ok"),
            "cloud_name": config.CLOUDINARY_CLOUD_NAME,
            "plan": usage.get("plan", "Free"),
            "storage_used": storage_used,
            "storage_limit": storage_limit,
            "storage_used_percent": storage_used_pct,
            "bandwidth_used": bandwidth_used,
            "bandwidth_limit": bandwidth_limit,
            "credits_used": _num(credits_section, "used_percent", "usage_percent", default=0),
            "transformations_used": _num(transformations_section, "usage", "count", default=0),
            "resources": _num(usage, "resources", default=0),
            "derived_resources": _num(usage, "derived_resources", default=0),
            "raw_usage": usage,
            "storage_computed": storage_computed,
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
