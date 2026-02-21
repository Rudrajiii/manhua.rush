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

app = Flask(__name__)
CORS(app)

DASHBOARD_PATH = Path(__file__).parent / "dashboard.html"

# Background processing thread
_processing_thread = None


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
        return jsonify(result)
    except Exception as e:
        return jsonify({"connected": False, "error": str(e)}), 500


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


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  ManhuaRush Panel Manager Dashboard")
    print("=" * 60)
    print(f"  Dashboard:  http://localhost:5000")
    print(f"  Prod dir:   {config.PRODUCTION_DIR}")
    print(f"  Cloud root: {config.CLOUDINARY_ROOT_FOLDER}")
    print("=" * 60 + "\n")

    app.run(host="0.0.0.0", port=5000, debug=True, threaded=True)
