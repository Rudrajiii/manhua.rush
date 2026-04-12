# ManhuaRush Webhook Timer - Complete Testing Guide

## Issues Fixed

### Root Cause Analysis
1. **Duplicate SSE Streams**: `startSSE()` was being called both during pipeline AND after pipeline completion in `loadWebhookStatus()`, causing conflicting updates
2. **Excessive API Calls**: Polling was running every 500ms AND SSE was running simultaneously
3. **Config Fetching in Every Poll**: webhook-config was being fetched every 500ms instead of just once
4. **Race Conditions**: Too many concurrent requests were creating UI rendering blocks

### Changes Made to dashboard.html

#### 1. Removed Duplicate SSE (Line ~1610)
**Before**: 
```javascript
if (!eventSource) {
  startSSE();  // <- Creates duplicate connection after pipeline
}
startWebhookPolling();  // <- Also running polling
```

**After**:
```javascript
// Only use polling for webhook timer after pipeline
// SSE is already managed by startPipeline() during execution
startWebhookPolling();
```

#### 2. Optimized Polling Interval (Line ~1646)
**Before**: 500ms (too frequent)
**After**: 1000ms (1 second - reasonable for UI updates)

#### 3. Prevent Duplicate Polling
**Added check**:
```javascript
if (webhookPollingInterval) {
  console.debug('Webhook polling already active');
  return;
}
```

#### 4. Only Fetch Status in Polling Loop
**Before**: Would have fetched config in every poll
**After**: Only fetches `/api/webhook-status`, config fetched separately once

---

## Step-by-Step Testing

### Terminal 1: Start Server
```bash
cd c:\Users\Rudra\OneDrive\Desktop\ManhuaRush\manhua-rush\scripts
python server.py
# Wait for: "Running on http://127.0.0.1:5900"
```

### Terminal 2: Run Monitoring Script  
```bash
cd c:\Users\Rudra\OneDrive\Desktop\ManhuaRush\manhua-rush\scripts
python test_webhook_state.py
# This will show webhook status updates every 1 second
```

### Terminal 3: Browser Testing
```bash
# Open in browser: http://localhost:5900
```

---

## Manual Test Procedure

### Step 1: Configure Webhook Delay
1. On dashboard, scroll to "Discord Webhook Settings" card
2. Change delay from 5 min to **3 min** (180 seconds)
3. Click **Update** button
4. **Expected**: In Terminal 2, you should see:
   ```
   ⏱️ Webhook Config:
     delay_minutes: 3
     delay_seconds: 180
   ```

### Step 2: Start Pipeline Processing
1. Go to Step 1: "Configure & Scan"
2. Click **🔍 Scan Folder** 
3. Go to Step 3: "Process & Upload"
4. Click **Full Pipeline** button
5. **Expected**: 
   - Progress bar starts moving
   - Logs appear in log viewer
   - In Terminal 2, you should see pipeline progress updates

### Step 3: Monitor Webhook State During Processing
In Terminal 2 (test script), watch for:
```
⏱️ No pending webhooks
```

### Step 4: Wait for Pipeline Completion
- Let pipeline run to completion
- You should see final stats appear
- **In Terminal 2, you should now see**:
  ```
  ⏱️ TIMER STATE:
     Pending: N notification(s)  
     Time remaining: 3m 0s
     Progress: 0.0%
  ```

### Step 5: Verify Timer Display in UI
**CRITICAL**: Look at the UI progress card on the dashboard:
1. Should see 🤖 **Discord Webhook Timer** section
2. Should show badge: **"N PENDING"**
3. Should show countdown: **"3:00"** (and counting down)
4. Progress bar should start filling
5. Should be able to click **"Send Now"** button

### Step 6: Check Terminal 2 Updates
In Terminal 2, confirm:
- Time remaining decreases by ~1 second every 1 second
- Progress percentage increases smoothly
- No repeated requests to same endpoint

### Step 7: Manual Webhook Trigger (Optional)
To test manually sending:
1. On dashboard, click **Send Now** button
2. **Expected**: Timer disappears, webhooks sent to Discord
3. In Terminal 2: `has_pending` should change to `false`

---

## Expected vs Actual Results

### Expected API Call Pattern (Terminal 1 Server Logs)
```
[12/Apr/2026 23:59:36] "GET /api/progress HTTP/1.1" 200 -
[12/Apr/2026 23:59:36] "GET /api/webhook-status HTTP/1.1" 200 -
[12/Apr/2026 23:59:37] "GET /api/webhook-status HTTP/1.1" 200 -
[12/Apr/2026 23:59:38] "GET /api/webhook-status HTTP/1.1" 200 -
```

**NOT**:
```
GET /api/webhook-config (repeated every second)
GET /api/progress (repeated every second)  
Multiple duplicate SSE connections
```

### Expected Terminal 2 Output
```
[23:59:36] === State Update ===

  📊 Webhook Status:
     has_pending: True
     pending_count: 3
     time_until_send: 178.5
     progress_percent: 0.6

  ⚙️ Webhook Config:
     delay_minutes: 3
     delay_seconds: 180
     
  ⏱️ TIMER STATE:
     Pending: 3 notification(s)
     Time remaining: 2m 58s
     Progress: 1.1%
```

### Expected UI Display
✅ Discord Webhook Timer section visible
✅ "3 PENDING" badge showing
✅ "2:58" countdown visible and updating  
✅ Purple progress bar filling smoothly
✅ "Send Now" button clickable

---

## Troubleshooting

### Timer Not Showing
1. Check browser console (F12) for JavaScript errors
2. Check Terminal 1 logs for API errors (5xx errors)
3. Verify webhook-status endpoint returns `has_pending: true`
4. Check if webhookTimerSection element exists: F12 → Elements → search "webhookTimerSection"

### Timer Not Updating
1. Check Terminal 2 - is time_until_send decreasing?
2. If not in Terminal 2, server-side issue
3. If yes in Terminal 2 but not UI - browser/JavaScript issue
4. Check browser console for update errors

### Multiple API Calls (Still High)
1. Check if polling interval is truly 1000ms (Terminal 2 should show updates ~every 1 sec)
2. Check server logs - should see ~1 request per second to /api/webhook-status
3. If seeing multiple per second, check if loadWebhookPolling() is being called multiple times

### Cannot Click Timer Area
1. Verify timer section has `display: block` (F12 → Elements)
2. Check if something is covering it (overlay, modal)
3. Try clicking the "Send Now" button specifically
4. Check browser console for click handler errors

---

## Success Criteria

✅ Only ~1 API request per second to webhook-status (not 2-4)
✅ Webhook-config fetched only once, not repeatedly  
✅ Timer displays immediately after pipeline completes
✅ Countdown updates smoothly every 1 second
✅ "Send Now" button is clickable
✅ No JavaScript errors in console
✅ Server logs show clean pattern (one /api/webhook-status per second)
✅ Terminal 2 test script shows state changes smoothly

