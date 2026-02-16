"""
CLI entry point for ManhuaRush panel processing pipeline.
Usage:
    python main.py scan                 # Scan production folder
    python main.py process              # Full pipeline (convert + upload)
    python main.py process --no-upload  # Convert only, skip upload
    python main.py test-cloudinary      # Test Cloudinary connection
"""

import sys
import json
from pathlib import Path

import config
import pipeline
import uploader


def cmd_scan():
    """Scan and display the production folder structure."""
    print(f"\nScanning: {config.PRODUCTION_DIR}\n")
    result = pipeline.scan_production()

    print(f"Total manga:    {result['total_manga']}")
    print(f"Total chapters: {result['total_chapters']}")
    print(f"Total files:    {result['total_files']}")
    print(f"Total size:     {result['total_size_fmt']}")
    print()

    for detail in result["details"]:
        print(f"  {detail['manga_id'][:12]}... / ch.{detail['chapter']} "
              f"- {detail['image_count']} images ({detail['total_size_fmt']})")

    return result


def cmd_process(skip_upload: bool = False):
    """Run the full processing pipeline."""
    print(f"\n{'='*60}")
    print("ManhuaRush Panel Processing Pipeline")
    print(f"{'='*60}")
    print(f"Production dir:  {config.PRODUCTION_DIR}")
    print(f"Cloudinary root: {config.CLOUDINARY_ROOT_FOLDER}")
    print(f"AVIF quality:    {config.AVIF_QUALITY}")
    print(f"AVIF speed:      {config.AVIF_SPEED}")
    print(f"Skip upload:     {skip_upload}")
    print(f"{'='*60}\n")

    result = pipeline.process_all(skip_upload=skip_upload)

    # Save summary
    summary_path = config.SCRIPTS_DIR / "last_run_summary.json"
    with open(summary_path, "w") as f:
        # Don't dump the full logs to JSON, just stats
        summary = {
            "phase": result["phase"],
            "files_processed": result["files_processed"],
            "files_total": result["files_total"],
            "chapters_processed": result["chapters_processed"],
            "stats": result["stats"],
            "manifests": result["manifests"],
            "elapsed": result["end_time"] - result["start_time"],
        }
        # Remove files_details from stats for summary (too large)
        summary["stats"] = {k: v for k, v in summary["stats"].items() if k != "files_details"}
        json.dump(summary, f, indent=2)

    print(f"\nSummary saved to: {summary_path}")


def cmd_test_cloudinary():
    """Test Cloudinary connection."""
    print("\nTesting Cloudinary connection...")
    result = uploader.check_connection()

    if result["connected"]:
        print(f"  ✓ Connected to: {result['cloud_name']}")
        print(f"  Plan: {result['plan']}")
        print(f"  Storage used: {uploader.format_bytes(result['storage_used'])} / {uploader.format_bytes(result['storage_limit'])}")
        print(f"  Bandwidth used: {uploader.format_bytes(result['bandwidth_used'])} / {uploader.format_bytes(result['bandwidth_limit'])}")
        print(f"  Credits used: {result['credits_used']}%")
        print(f"  Resources: {result['resources']}")
    else:
        print(f"  ✗ Connection failed: {result['error']}")

    return result


def main():
    args = sys.argv[1:]

    if not args or args[0] == "--help":
        print(__doc__)
        return

    command = args[0].lower()

    if command == "scan":
        cmd_scan()
    elif command == "process":
        skip_upload = "--no-upload" in args
        cmd_process(skip_upload=skip_upload)
    elif command == "test-cloudinary":
        cmd_test_cloudinary()
    else:
        print(f"Unknown command: {command}")
        print(__doc__)


if __name__ == "__main__":
    main()
