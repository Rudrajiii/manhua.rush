"""
Test script to monitor webhook state and pipeline progress.
Run this while testing the UI to understand what's happening in the backend.
"""

import requests
import json
import time
import sys

# Configuration
API_URL = "http://localhost:5900"
MONITOR_INTERVAL = 1  # seconds

def get_webhook_status():
    """Get webhook status from API"""
    try:
        res = requests.get(f"{API_URL}/api/webhook-status", timeout=5)
        return res.json() if res.ok else {"error": f"HTTP {res.status_code}"}
    except Exception as e:
        return {"error": str(e)}

def get_webhook_config():
    """Get webhook config from API"""
    try:
        res = requests.get(f"{API_URL}/api/webhook-config", timeout=5)
        return res.json() if res.ok else {"error": f"HTTP {res.status_code}"}
    except Exception as e:
        return {"error": str(e)}

def get_progress():
    """Get pipeline progress state"""
    try:
        res = requests.get(f"{API_URL}/api/progress", timeout=5, stream=True)
        if res.ok:
            # Read first event from SSE stream
            for line in res.iter_lines():
                if line and line.startswith(b'data:'):
                    return json.loads(line[6:].decode())
        return {"error": f"HTTP {res.status_code}"}
    except Exception as e:
        return {"error": str(e)}

def pretty_print(title, data, indent=0):
    """Pretty print data"""
    prefix = "  " * indent
    print(f"\n{prefix}{title}:")
    for key, value in data.items():
        if isinstance(value, dict):
            pretty_print(key, value, indent + 1)
        elif isinstance(value, list):
            if len(value) > 3:
                print(f"{prefix}  {key}: [{len(value)} items]")
            else:
                print(f"{prefix}  {key}: {value}")
        elif isinstance(value, str) and len(str(value)) > 80:
            print(f"{prefix}  {key}: {str(value)[:80]}...")
        else:
            print(f"{prefix}  {key}: {value}")

def main():
    print("\n" + "="*80)
    print("  ManhuaRush Webhook State Monitor")
    print("="*80)
    print(f"  Monitoring: {API_URL}")
    print(f"  Update interval: {MONITOR_INTERVAL}s")
    print(f"  Press Ctrl+C to stop\n")
    
    last_status = None
    last_config = None
    
    try:
        while True:
            print(f"\n[{time.strftime('%H:%M:%S')}] === State Update ===")
            
            # Get current state
            status = get_webhook_status()
            config = get_webhook_config()
            
            # Print webhook status
            if status != last_status:
                pretty_print("📊 Webhook Status", status)
                last_status = status
            
            # Print webhook config
            if config != last_config:
                pretty_print("⚙️ Webhook Config", config)
                last_config = config
            
            # Show timer calculation if pending
            if status.get("has_pending") and status.get("pending_count", 0) > 0:
                time_until = status.get("time_until_send", 0)
                progress_pct = status.get("progress_percent", 0)
                pending = status.get("pending_count", 0)
                
                mins = int(time_until // 60)
                secs = int(time_until % 60)
                
                print(f"\n  ⏱️ TIMER STATE:")
                print(f"     Pending: {pending} notification(s)")
                print(f"     Time remaining: {mins}m {secs}s")
                print(f"     Progress: {progress_pct:.1f}%")
                print(f"     Schedule time: {status.get('scheduled_at')}")
            else:
                print(f"\n  ⏱️ No pending webhooks")
            
            time.sleep(MONITOR_INTERVAL)
    
    except KeyboardInterrupt:
        print(f"\n\n[INFO] Monitor stopped")
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR] {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
