"""
Main processing pipeline for ManhuaRush.
Orchestrates: scan → convert → rename → upload → manifest.
"""

import time
import json
import traceback
from pathlib import Path
from typing import Callable, Optional

import config
import converter
import naming
import uploader
import discord_webhook

# Load manhua data for Discord notifications
MANHUA_DATA = {}
try:
    data_path = Path(__file__).parent.parent / "lib" / "data" / "manhua-data.json"
    if data_path.exists():
        with open(data_path, 'r', encoding='utf-8') as f:
            manhua_raw = json.load(f)
            # Create lookup by mangadexId
            for key, manga in manhua_raw.items():
                if 'mangadexId' in manga:
                    MANHUA_DATA[manga['mangadexId']] = manga
except Exception as e:
    print(f"Warning: Could not load manhua data: {e}")


def get_manga_info(manga_id: str) -> dict:
    """Get manga info from manhua-data by mangadexId."""
    return MANHUA_DATA.get(manga_id, {})


# Global progress state for the server to read
progress_state = {
    "running": False,
    "phase": "idle",
    "current_manga": "",
    "current_chapter": "",
    "current_file": "",
    "files_processed": 0,
    "files_total": 0,
    "chapters_processed": 0,
    "chapters_total": 0,
    "logs": [],
    "errors": [],
    "stats": {
        "total_original_size": 0,
        "total_converted_size": 0,
        "total_uploaded": 0,
        "skipped_avif": 0,
        "converted_count": 0,
        "files_details": [],
    },
    "manifests": [],
    "chapters_for_discord": [],  # Track chapters for batch Discord notification
    "start_time": 0,
    "end_time": 0,
    # Delayed webhook fields
    "pending_discord_notifications": [],  # List of pending notifications with timestamps
    "discord_notification_scheduled_at": 0,  # When the next batch will be sent
    "discord_notification_delay_seconds": 300,  # Default 5 minutes
}


def reset_progress():
    """Reset the global progress state."""
    progress_state.update({
        "running": False,
        "phase": "idle",
        "current_manga": "",
        "current_chapter": "",
        "current_file": "",
        "files_processed": 0,
        "files_total": 0,
        "chapters_processed": 0,
        "chapters_total": 0,
        "logs": [],
        "errors": [],
        "stats": {
            "total_original_size": 0,
            "total_converted_size": 0,
            "total_uploaded": 0,
            "skipped_avif": 0,
            "converted_count": 0,
            "files_details": [],
        },
        "manifests": [],
        "chapters_for_discord": [],
        "start_time": 0,
        "end_time": 0,
        "pending_discord_notifications": [],
        "discord_notification_scheduled_at": 0,
        "discord_notification_delay_seconds": int(config.DISCORD_WEBHOOK_DELAY_MINUTES * 60),
    })


def log(message: str):
    """Add a log message."""
    timestamp = time.strftime("%H:%M:%S")
    entry = f"[{timestamp}] {message}"
    progress_state["logs"].append(entry)
    print(entry)


def log_error(message: str):
    """Add an error message."""
    timestamp = time.strftime("%H:%M:%S")
    entry = f"[{timestamp}] ERROR: {message}"
    progress_state["errors"].append(entry)
    progress_state["logs"].append(entry)
    print(entry)


def queue_discord_notification(
    manga_name: str,
    manga_id: str,
    chapter_number: str,
    total_panels: int,
    cover_image_url: str = "",
    read_url: str = "",
) -> dict:
    """
    Queue a Discord notification to be sent after a delay.
    If already scheduled, append to the pending list. If not scheduled, schedule it.
    
    Returns a dict with scheduling info.
    """
    notification = {
        "manga_name": manga_name,
        "manga_id": manga_id,
        "chapter_number": chapter_number,
        "total_panels": total_panels,
        "cover_image_url": cover_image_url,
        "read_url": read_url,
        "queued_at": time.time(),
    }
    
    progress_state["pending_discord_notifications"].append(notification)
    
    # Schedule notification if not already scheduled
    if progress_state["discord_notification_scheduled_at"] == 0:
        delay_seconds = progress_state["discord_notification_delay_seconds"]
        progress_state["discord_notification_scheduled_at"] = time.time() + delay_seconds
        log(f"📢 Discord notification scheduled in {delay_seconds}s ({delay_seconds // 60} min) for: {manga_name} Ch.{chapter_number}")
    else:
        log(f"📢 Added to pending Discord notifications: {manga_name} Ch.{chapter_number}")
    
    return {
        "queued": True,
        "scheduled_at": progress_state["discord_notification_scheduled_at"],
        "pending_count": len(progress_state["pending_discord_notifications"]),
    }


def scan_production(production_dir: Optional[Path] = None) -> dict:
    """Scan the production directory and return structure info."""
    if production_dir is None:
        production_dir = config.PRODUCTION_DIR

    structure = converter.scan_folder(production_dir)

    total_files = 0
    total_chapters = 0
    total_size = 0
    scan_details = []

    for manga_id, chapters in structure.items():
        for chapter, images in chapters.items():
            total_chapters += 1
            chapter_dir = production_dir / manga_id / chapter
            chapter_size = 0
            for img_name in images:
                img_path = chapter_dir / img_name
                fsize = converter.get_file_size(img_path)
                chapter_size += fsize
                total_files += 1
                total_size += fsize

            scan_details.append({
                "manga_id": manga_id,
                "chapter": chapter,
                "image_count": len(images),
                "total_size": chapter_size,
                "total_size_fmt": uploader.format_bytes(chapter_size),
                "images": images,
            })

    return {
        "production_dir": str(production_dir),
        "total_manga": len(structure),
        "total_chapters": total_chapters,
        "total_files": total_files,
        "total_size": total_size,
        "total_size_fmt": uploader.format_bytes(total_size),
        "details": scan_details,
        "structure": {k: {ch: imgs for ch, imgs in v.items()} for k, v in structure.items()},
    }


def process_all(
    production_dir: Optional[Path] = None,
    skip_upload: bool = False,
    callback: Optional[Callable] = None,
) -> dict:
    """
    Main pipeline: convert all images to AVIF, rename with obfuscated names,
    upload to Cloudinary, and generate manifests.
    """
    if production_dir is None:
        production_dir = config.PRODUCTION_DIR

    reset_progress()
    progress_state["running"] = True
    progress_state["start_time"] = time.time()
    progress_state["phase"] = "scanning"
    log(f"Starting pipeline for: {production_dir}")
    log(f"Cloudinary root folder: {config.CLOUDINARY_ROOT_FOLDER}")

    # Initialize Cloudinary if uploading
    if not skip_upload:
        try:
            log("Initializing Cloudinary connection...")
            uploader.init_cloudinary()
            log("Cloudinary connected successfully.")
        except Exception as e:
            log_error(f"Cloudinary initialization failed: {e}")
            progress_state["running"] = False
            progress_state["phase"] = "error"
            return progress_state

    # Scan
    log("Scanning production folder...")
    structure = converter.scan_folder(production_dir)

    total_files = 0
    total_chapters = 0
    for manga_id, chapters in structure.items():
        for chapter, images in chapters.items():
            total_chapters += 1
            total_files += len(images)

    progress_state["files_total"] = total_files
    progress_state["chapters_total"] = total_chapters
    log(f"Found {total_files} images across {total_chapters} chapters in {len(structure)} manga.")

    # Process each manga/chapter
    progress_state["phase"] = "processing"

    for manga_id, chapters in structure.items():
        progress_state["current_manga"] = manga_id
        log(f"\n{'='*60}")
        log(f"Processing manga: {manga_id}")
        log(f"{'='*60}")

        for chapter, images in chapters.items():
            progress_state["current_chapter"] = chapter
            log(f"\n--- Chapter {chapter} ({len(images)} images) ---")

            # Generate obfuscated names
            obfuscated_names = naming.generate_names_for_chapter(
                manga_id, chapter, len(images)
            )

            panels_data = []
            chapter_dir = production_dir / manga_id / chapter

            for idx, (original_name, obfuscated_name) in enumerate(
                zip(images, obfuscated_names)
            ):
                progress_state["current_file"] = original_name
                original_path = chapter_dir / original_name

                log(f"  [{idx + 1}/{len(images)}] {original_name} → {obfuscated_name}")

                # Convert to AVIF (or copy if already AVIF)
                temp_output = config.TEMP_DIR / obfuscated_name
                try:
                    conv_result = converter.convert_to_avif(original_path, temp_output)

                    if conv_result["skipped"]:
                        log(f"    ✓ Already AVIF, copied as-is ({uploader.format_bytes(conv_result['original_size'])})")
                        progress_state["stats"]["skipped_avif"] += 1
                    else:
                        saved = conv_result["original_size"] - conv_result["converted_size"]
                        ratio = (
                            conv_result["converted_size"] / conv_result["original_size"] * 100
                            if conv_result["original_size"] > 0
                            else 100
                        )
                        log(
                            f"    ✓ Converted: {uploader.format_bytes(conv_result['original_size'])} → "
                            f"{uploader.format_bytes(conv_result['converted_size'])} "
                            f"(saved {uploader.format_bytes(saved)}, {ratio:.1f}%)"
                        )
                        progress_state["stats"]["converted_count"] += 1

                    progress_state["stats"]["total_original_size"] += conv_result["original_size"]
                    progress_state["stats"]["total_converted_size"] += conv_result["converted_size"]

                except Exception as e:
                    log_error(f"    ✗ Conversion failed for {original_name}: {e}")
                    traceback.print_exc()
                    progress_state["files_processed"] += 1
                    continue

                # Upload to Cloudinary
                cloud_url = ""
                cloud_public_id = ""
                if not skip_upload:
                    try:
                        cloud_folder = uploader.build_cloudinary_folder(manga_id, chapter)
                        # Public ID is the name without extension
                        pub_id = obfuscated_name.rsplit(".", 1)[0]

                        upload_result = uploader.upload_image(
                            str(temp_output),
                            pub_id,
                            folder=cloud_folder,
                        )
                        cloud_url = upload_result["secure_url"]
                        cloud_public_id = upload_result["public_id"]
                        progress_state["stats"]["total_uploaded"] += 1
                        log(f"    ☁ Uploaded → {cloud_public_id}")
                    except Exception as e:
                        log_error(f"    ✗ Upload failed for {obfuscated_name}: {e}")
                        traceback.print_exc()

                panel_info = {
                    "order": idx + 1,
                    "original_name": original_name,
                    "obfuscated_name": obfuscated_name,
                    "cloudinary_url": cloud_url,
                    "cloudinary_public_id": cloud_public_id,
                    "original_size": conv_result["original_size"],
                    "converted_size": conv_result["converted_size"],
                    "skipped_conversion": conv_result["skipped"],
                }
                panels_data.append(panel_info)

                progress_state["stats"]["files_details"].append({
                    "manga_id": manga_id,
                    "chapter": chapter,
                    **panel_info,
                })

                progress_state["files_processed"] += 1

                # Clean up temp file
                try:
                    temp_output.unlink(missing_ok=True)
                except Exception:
                    pass

            # Create manifest for this chapter
            try:
                manifest = naming.create_manifest(manga_id, chapter, panels_data)
                progress_state["manifests"].append({
                    "manga_id": manga_id,
                    "chapter": chapter,
                    "path": str(config.MANIFESTS_DIR / f"{manga_id}_{chapter}.json"),
                    "stats": manifest["stats"],
                })
                log(f"  ✓ Manifest saved: {manga_id}_{chapter}.json")

                # Queue Discord notification for this chapter (will be sent after delay)
                if config.DISCORD_WEBHOOK_URL:
                    try:
                        # Get manga info
                        manga_info = get_manga_info(manga_id)
                        manga_name = manga_info.get('name', manga_id)
                        cover_image_url = manga_info.get('cachedCoverUrl', '')
                        
                        # Calculate chapter stats
                        total_panels = len([p for p in panels_data if p['cloudinary_url']])

                        # Build read URL
                        read_url = f"{config.SITE_BASE_URL}/reader/{manga_id}/{chapter}"

                        # Queue notification with delay
                        queue_result = queue_discord_notification(
                            manga_name=manga_name,
                            manga_id=manga_id,
                            chapter_number=chapter,
                            total_panels=total_panels,
                            cover_image_url=cover_image_url,
                            read_url=read_url,
                        )

                        scheduled_at = queue_result.get("scheduled_at", 0)
                        if scheduled_at > 0:
                            pending = queue_result.get("pending_count", 0)
                            log(f"  ✓ Discord notification queued ({pending} pending)")

                    except Exception as e:
                        log_error(f"  Failed to queue Discord notification: {e}")
                        traceback.print_exc()

            except Exception as e:
                log_error(f"  ✗ Manifest creation failed: {e}")

            progress_state["chapters_processed"] += 1

    # Final stats
    progress_state["phase"] = "completed"
    progress_state["running"] = False
    progress_state["end_time"] = time.time()

    elapsed = progress_state["end_time"] - progress_state["start_time"]
    stats = progress_state["stats"]

    log(f"\n{'='*60}")
    log(f"PIPELINE COMPLETE")
    log(f"{'='*60}")
    log(f"Time elapsed: {elapsed:.1f}s")
    log(f"Files processed: {progress_state['files_processed']}/{progress_state['files_total']}")
    log(f"Converted: {stats['converted_count']}, Skipped (already AVIF): {stats['skipped_avif']}")
    log(f"Original total size: {uploader.format_bytes(stats['total_original_size'])}")
    log(f"Converted total size: {uploader.format_bytes(stats['total_converted_size'])}")
    saved = stats['total_original_size'] - stats['total_converted_size']
    ratio = (
        stats['total_converted_size'] / stats['total_original_size'] * 100
        if stats['total_original_size'] > 0
        else 100
    )
    log(f"Space saved: {uploader.format_bytes(saved)} ({100 - ratio:.1f}% reduction)")
    log(f"Uploaded to Cloudinary: {stats['total_uploaded']}")
    log(f"Manifests generated: {len(progress_state['manifests'])}")

    return progress_state
