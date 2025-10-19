# Laundry Services Auto-Load Fix

## Issue
In the admin panel, after logging in, Laundry Services required tapping "Tap to load laundry services" instead of loading automatically.

## Root Cause
The laundry services were only loaded on-demand when the user interacted with the laundry card, even for admins who have access to the laundry module.

## Solution
Added automatic loading of laundry services when an admin has access to the laundry module.

## Changes Made

### 1. Added Auto-Load Logic
Added a new useEffect that automatically loads laundry services for admins with laundry access:

```typescript
// Auto-load laundry services if admin has access to laundry module
useEffect(() => {
  if (accessibleModules.includes('laundry') && !laundryServicesLoaded) {
    console.log('🔄 Auto-loading laundry services for laundry admin...');
    setLaundryServicesLoaded(true);
  }
}, [accessibleModules, laundryServicesLoaded]);
```

### 2. Removed Manual Load UI
Removed the "Tap to load laundry services" fallback UI since laundry services now load automatically for laundry admins.

## Expected Behavior Now

### Before
- Laundry admin logs in
- Sees "Tap to load laundry services" message
- Must tap to load laundry services
- Then sees laundry service carousel

### After
- Laundry admin logs in
- Laundry services automatically load
- Immediately sees laundry service carousel
- No manual interaction required

### For Non-Laundry Admins
- Still see the default laundry service image
- No auto-loading (as expected)

## Benefits
- ✅ **Better UX**: No manual step required for laundry admins
- ✅ **Immediate Access**: Laundry services load right away
- ✅ **Role-Based**: Only loads for admins with laundry access
- ✅ **Consistent**: Matches behavior of other service types

## Testing
1. Login as laundry admin (`laundry@gmail.com`)
2. Verify laundry services load automatically
3. Login as super admin
4. Verify laundry services load automatically
5. Login as apartment admin
6. Verify laundry services don't auto-load (no access)

## Files Modified
- `app/admin-dashboard.tsx` - Added auto-load logic for laundry services
