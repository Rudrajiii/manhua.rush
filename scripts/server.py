"""
Flask server for the ManhuaRush Panel Manager Dashboard.
Serves the HTML dashboard and provides API endpoints for processing.

Usage:
    python server.py

Then open http://localhost:5000 in your browser.
"""

import os
import sys
import json
import time
import threading
from pathlib import Path

from flask import Flask, Response, request, jsonify, send_file
from flask_cors import CORS

import config
import pipeline
import uploader
import converter
import discord_webhook

app = Flask(__name__)
CORS(app)

DASHBOARD_PATH = Path(__file__).parent / "dashboard.html"

# Background processing thread
_processing_thread = None
_webhook_executor_thread = None


def execute_pending_webhooks():
    """Background thread that executes pending Discord webhooks after delay."""
    while True:
        try:
            state = pipeline.progress_state
            now = time.time()
            
            # Check if notifications are scheduled and ready to send
            if (state["discord_notification_scheduled_at"] > 0 and 
                now >= state["discord_notification_scheduled_at"] and
                len(state["pending_discord_notifications"]) > 0):
                
                # Send all pending notifications
                pending = state["pending_discord_notifications"]
                pipeline.log(f"📢 Sending {len(pending)} queued Discord notifications...")
                
                for notification in pending:
                    try:
                        result = discord_webhook.send_chapter_notification(
                            webhook_url=config.DISCORD_WEBHOOK_URL,
                            manga_name=notification["manga_name"],
                            manga_id=notification["manga_id"],
                            chapter_number=notification["chapter_number"],
                            total_panels=notification["total_panels"],
                            cover_image_url=notification["cover_image_url"],
                            read_url=notification["read_url"],
                            color=3066993,
                        )
                        
                        if result["success"]:
                            pipeline.log(f"  ✓ Discord: {notification['manga_name']} Ch.{notification['chapter_number']}")
                        else:
                            pipeline.log_error(f"  Discord failed: {result.get('error', 'Unknown')}")
                    except Exception as e:
                        pipeline.log_error(f"  Discord error: {e}")
                
                # Clear scheduled notifications
                state["pending_discord_notifications"] = []
                state["discord_notification_scheduled_at"] = 0
        
        except Exception as e:
            print(f"Error in webhook executor: {e}")
        
        time.sleep(1)  # Check every 1 second


# Start webhook executor thread
_webhook_executor_thread = threading.Thread(target=execute_pending_webhooks, daemon=True)
_webhook_executor_thread.start()


@app.route("/")
def index():
    """Serve the dashboard HTML."""
    return send_file(str(DASHBOARD_PATH))


@app.route("/api/cloudinary-info")
def cloudinary_free_plan_info():
    """Return Cloudinary free plan information."""
    return jsonify({
        "plan_name": "Free",
        "credits_per_month": 25,
        "credit_breakdown": {
            "storage": "1 credit = 1 GB of managed storage",
            "bandwidth": "1 credit = 1 GB of net viewing bandwidth",
            "transformations": "1 credit = 1,000 transformations",
        },
        "limits": {
            "max_file_size": "10 MB",
            "max_image_pixels": "25 megapixels",
            "max_video_size": "100 MB",
        },
        "notes": [
            "25 credits shared across storage, bandwidth, and transformations",
            "Effectively ~25 GB storage on the free plan",
            "AVIF images are much smaller, so you can store many more panels",
            "Unused credits do NOT roll over to the next month",
        ],
    })


@app.route("/api/test-cloudinary")
def test_cloudinary():
    """Test Cloudinary connection and return usage stats."""
    try:
        result = uploader.check_connection()
        # If connected but has warnings, still return 200 with the info
        if result.get("connected"):
            return jsonify(result)
        else:
            # Not connected - return error
            return jsonify(result), 500
    except Exception as e:
        return jsonify({"connected": False, "error": str(e), "fix": "Check .env credentials"}), 500


@app.route("/api/scan", methods=["POST"])
def scan_folder():
    """Scan a production folder for images."""
    data = request.get_json() or {}
    folder = data.get("folder", str(config.PRODUCTION_DIR))
    folder_path = Path(folder)

    if not folder_path.exists():
        return jsonify({"error": f"Folder not found: {folder}"}), 404

    try:
        result = pipeline.scan_production(folder_path)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/process", methods=["POST"])
def start_processing():
    """Start the full processing pipeline in a background thread."""
    global _processing_thread

    if pipeline.progress_state.get("running"):
        return jsonify({"error": "Pipeline is already running"}), 409

    data = request.get_json() or {}
    folder = data.get("folder", str(config.PRODUCTION_DIR))
    skip_upload = data.get("skip_upload", False)
    folder_path = Path(folder)

    if not folder_path.exists():
        return jsonify({"error": f"Folder not found: {folder}"}), 404

    def run_pipeline():
        try:
            pipeline.process_all(
                production_dir=folder_path,
                skip_upload=skip_upload,
            )
        except Exception as e:
            pipeline.log_error(f"Pipeline crashed: {e}")
            pipeline.progress_state["running"] = False
            pipeline.progress_state["phase"] = "error"

    _processing_thread = threading.Thread(target=run_pipeline, daemon=True)
    _processing_thread.start()

    return jsonify({"status": "started", "folder": folder})


@app.route("/api/progress")
def get_progress():
    """Server-Sent Events endpoint for real-time progress updates."""
    def generate():
        last_log_count = 0
        while True:
            state = pipeline.progress_state
            current_logs = state.get("logs", [])
            new_logs = current_logs[last_log_count:]
            last_log_count = len(current_logs)

            payload = {
                "running": state["running"],
                "phase": state["phase"],
                "current_manga": state["current_manga"],
                "current_chapter": state["current_chapter"],
                "current_file": state["current_file"],
                "files_processed": state["files_processed"],
                "files_total": state["files_total"],
                "chapters_processed": state["chapters_processed"],
                "chapters_total": state["chapters_total"],
                "new_logs": new_logs,
                "error_count": len(state["errors"]),
                "stats": {
                    "total_original_size": state["stats"]["total_original_size"],
                    "total_converted_size": state["stats"]["total_converted_size"],
                    "total_uploaded": state["stats"]["total_uploaded"],
                    "skipped_avif": state["stats"]["skipped_avif"],
                    "converted_count": state["stats"]["converted_count"],
                },
                "manifests_count": len(state["manifests"]),
            }

            # Add webhook timer info
            now = time.time()
            scheduled_at = state.get("discord_notification_scheduled_at", 0)
            delay_seconds = state.get("discord_notification_delay_seconds", 300)
            pending = state.get("pending_discord_notifications", [])
            
            if scheduled_at > 0 and len(pending) > 0:
                time_until_send = max(0, scheduled_at - now)
                time_percent = max(0, min(100, (1 - time_until_send / delay_seconds) * 100))
                payload["webhook"] = {
                    "has_pending": True,
                    "pending_count": len(pending),
                    "time_until_send": round(time_until_send, 1),
                    "progress_percent": round(time_percent, 1),
                    "scheduled_at": scheduled_at,
                }
            else:
                payload["webhook"] = {
                    "has_pending": False,
                    "pending_count": 0,
                    "time_until_send": 0,
                    "progress_percent": 0,
                }

            # Add timing info
            if state["start_time"] > 0:
                if state["end_time"] > 0:
                    payload["elapsed"] = round(state["end_time"] - state["start_time"], 1)
                else:
                    payload["elapsed"] = round(time.time() - state["start_time"], 1)

            yield f"data: {json.dumps(payload)}\n\n"

            # Stop streaming if done
            if not state["running"] and state["phase"] in ("completed", "error", "idle"):
                if state["phase"] != "idle":
                    # Send one final update
                    time.sleep(0.5)
                    yield f"data: {json.dumps(payload)}\n\n"
                break

            time.sleep(0.5)

    return Response(generate(), mimetype="text/event-stream")


@app.route("/api/manifests")
def list_manifests():
    """List all generated manifests."""
    manifests_dir = config.MANIFESTS_DIR
    manifests = []
    if manifests_dir.exists():
        for f in sorted(manifests_dir.iterdir()):
            if f.suffix == ".json":
                try:
                    with open(f, "r") as fh:
                        data = json.load(fh)
                    manifests.append({
                        "filename": f.name,
                        "manga_id": data.get("manga_id", ""),
                        "chapter": data.get("chapter", ""),
                        "total_panels": data.get("total_panels", 0),
                        "stats": data.get("stats", {}),
                    })
                except Exception:
                    manifests.append({"filename": f.name, "error": "Failed to parse"})
    return jsonify(manifests)


@app.route("/api/manifest/<filename>")
def get_manifest(filename):
    """Get a specific manifest file content."""
    manifest_path = config.MANIFESTS_DIR / filename
    if not manifest_path.exists():
        return jsonify({"error": "Manifest not found"}), 404
    try:
        with open(manifest_path, "r") as f:
            return jsonify(json.load(f))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/stop", methods=["POST"])
def stop_processing():
    """Signal to stop processing (best-effort, next iteration will check)."""
    pipeline.progress_state["running"] = False
    pipeline.progress_state["phase"] = "stopped"
    pipeline.log("Pipeline stop requested by user.")
    return jsonify({"status": "stop_requested"})


@app.route("/api/config")
def get_config():
    """Return current configuration (no secrets)."""
    return jsonify({
        "production_dir": str(config.PRODUCTION_DIR),
        "cloudinary_root_folder": config.CLOUDINARY_ROOT_FOLDER,
        "avif_quality": config.AVIF_QUALITY,
        "avif_speed": config.AVIF_SPEED,
        "manifests_dir": str(config.MANIFESTS_DIR),
        "cloud_name": config.CLOUDINARY_CLOUD_NAME or "(not set)",
    })


@app.route("/api/upload-production", methods=["POST"])
def upload_production():
    """Upload files into the production folder.

    Expects multipart form-data with a `mangadexId` field and multiple files.
    Each uploaded file may include a relative path in its filename (e.g. "12/img.png").
    On a single upload, the existing production folder is removed entirely
    and replaced with the newly uploaded contents.
    """
    try:
        manga_id = request.form.get("mangadexId")
        if not manga_id:
            return jsonify({"error": "mangadexId is required"}), 400

        # Remove existing production directory completely for a fresh upload
        prod_dir = config.PRODUCTION_DIR
        if prod_dir.exists():
            import shutil
            try:
                shutil.rmtree(prod_dir)
            except Exception as e:
                return jsonify({"error": f"Failed to clear production dir: {e}"}), 500

        # Recreate production dir
        prod_dir.mkdir(parents=True, exist_ok=True)

        # Save all uploaded files. Flask/Werkzeug preserves the filename string that
        # the client provided, so we rely on that to contain relative paths like
        # "<chapter>/<image>.png". We'll safely normalize paths and prevent
        # path traversal attacks.
        saved = []
        from pathlib import Path
        import os

        for key in request.files:
            for file_storage in request.files.getlist(key):
                raw_name = file_storage.filename or ""
                # Normalize and strip drive letters
                norm = os.path.normpath(raw_name).lstrip("/\\")
                parts = Path(norm).parts
                # Prevent traversal
                if any(p == ".." for p in parts):
                    continue

                # Destination: production/<manga_id>/<norm>
                dest = prod_dir / manga_id / Path(*parts)
                dest.parent.mkdir(parents=True, exist_ok=True)
                try:
                    file_storage.save(str(dest))
                    saved.append(str(dest.relative_to(prod_dir)))
                except Exception as e:
                    return jsonify({"error": f"Failed to save {raw_name}: {e}"}), 500

        return jsonify({"status": "ok", "saved": saved, "production_dir": str(prod_dir)}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/webhook-status")
def webhook_status():
    """Get the status of pending Discord webhooks and timer."""
    state = pipeline.progress_state
    now = time.time()
    
    scheduled_at = state.get("discord_notification_scheduled_at", 0)
    delay_seconds = state.get("discord_notification_delay_seconds", 300)
    pending = state.get("pending_discord_notifications", [])
    
    if scheduled_at > 0 and len(pending) > 0:
        time_until_send = max(0, scheduled_at - now)
        time_percent = max(0, min(100, (1 - time_until_send / delay_seconds) * 100))
    else:
        time_until_send = 0
        time_percent = 0
    
    return jsonify({
        "has_pending": len(pending) > 0,
        "pending_count": len(pending),
        "scheduled_at": scheduled_at,
        "time_until_send": round(time_until_send, 1),
        "delay_minutes": delay_seconds // 60,
        "delay_seconds": delay_seconds,
        "progress_percent": round(time_percent, 1),
        "pending_notifications": [
            {
                "manga_name": n["manga_name"],
                "chapter_number": n["chapter_number"],
                "queued_at": n["queued_at"],
            }
            for n in pending
        ],
    })


@app.route("/api/webhook-config", methods=["GET", "POST"])
def webhook_config():
    """Get or set Discord webhook delay configuration."""
    state = pipeline.progress_state
    
    if request.method == "POST":
        data = request.get_json() or {}
        delay_minutes = data.get("delay_minutes")
        
        if delay_minutes is None or delay_minutes < 1 or delay_minutes > 60:
            return jsonify({"error": "delay_minutes must be between 1 and 60"}), 400
        
        state["discord_notification_delay_seconds"] = int(delay_minutes * 60)
        pipeline.log(f"⚙️ Discord webhook delay updated to {delay_minutes} minutes")
        
        return jsonify({
            "status": "updated",
            "delay_minutes": delay_minutes,
            "delay_seconds": state["discord_notification_delay_seconds"],
        })
    else:
        # GET
        delay_seconds = state.get("discord_notification_delay_seconds", 300)
        return jsonify({
            "delay_minutes": delay_seconds // 60,
            "delay_seconds": delay_seconds,
            "min_delay": 1,
            "max_delay": 60,
        })


@app.route("/api/webhook-execute", methods=["POST"])
def webhook_execute():
    """Manually trigger pending webhook execution."""
    state = pipeline.progress_state
    pending = state.get("pending_discord_notifications", [])
    
    if len(pending) == 0:
        return jsonify({"error": "No pending notifications"}), 404
    
    # Force execution by setting scheduled_at to now
    state["discord_notification_scheduled_at"] = time.time()
    pipeline.log(f"Manual webhook execution triggered for {len(pending)} pending notifications")
    
    return jsonify({
        "status": "executing",
        "count": len(pending),
        "message": f"Sending {len(pending)} webhooks immediately",
    })


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  ManhuaRush Panel Manager Dashboard")
    print("=" * 60)
    print(f"  Dashboard:  http://localhost:5000")
    print(f"  Prod dir:   {config.PRODUCTION_DIR}")
    print(f"  Cloud root: {config.CLOUDINARY_ROOT_FOLDER}")
    print("=" * 60 + "\n")

    app.run(host="0.0.0.0", port=5900, debug=True, threaded=True)
