# Logs Delete Function Fix

## Issue
When deleting log entries from the admin logs Activity section, the total count and admin email statistics were not updating properly.

## Root Cause
The `handleDeleteLog` function was only calling `loadLogs()` to refresh the logs list, but was not calling `loadLogsStats()` to refresh the statistics.

## Solution
Updated the `handleDeleteLog` function in `app/(admin-tabs)/settings.tsx` to reload both logs and statistics after deletion:

```typescript
// Before
await deleteLog(logId);
await loadLogs();

// After  
await deleteLog(logId);
await Promise.all([loadLogs(), loadLogsStats()]);
```

## What Gets Updated Now
After deleting a log entry, the following statistics will be properly refreshed:

- **Total Logs Count** (`totalLogs`)
- **Login Count** (`loginCount`) 
- **Logout Count** (`logoutCount`)
- **Admin Logins** (`adminLogins`)
- **User Logins** (`userLogins`)
- **Today's Logins** (`todayLogins`)

## Testing
1. Go to Admin Settings > Activity section
2. Delete any log entry
3. Verify that the statistics dashboard updates immediately
4. Check that total counts and admin email counts are accurate

## Files Modified
- `app/(admin-tabs)/settings.tsx` - Updated `handleDeleteLog` function
