# Dashboard Role-Based Reservation Count Fix

## Issue
In the admin dashboard, when an admin has single access to only Laundry Services, the reservation count was showing ALL reservations instead of only laundry reservations.

## Root Cause
The reservation count logic in the dashboard was not applying role-based filtering. It was counting all valid reservations regardless of the admin's access permissions.

## Solution
Updated the admin dashboard to apply role-based filtering to both:
1. **Reservation Count** - Only counts reservations for accessible modules
2. **Unread Count** - Only counts unread notifications for accessible modules

## Changes Made

### 1. Reservation Count Filtering
Updated the admin reservations listener to filter reservations based on admin role:

```typescript
// Filter reservations based on admin role and accessible modules
const filteredReservations = validReservations.filter((reservation: any) => {
  if (isSuperAdminUser) {
    // Super admin can see all reservations
    return true;
  }
  
  // Filter reservations based on accessible modules
  const moduleMapping: Record<string, string> = {
    'apartment': 'apartment',
    'laundry': 'laundry',
    'auto': 'car'
  };

  const module = moduleMapping[reservation.serviceType];
  return module && accessibleModules.includes(module);
});
```

### 2. Unread Count Filtering
Applied the same filtering logic to the unread notifications count.

### 3. Dependency Updates
Added role-based variables to useEffect dependencies to ensure proper re-filtering when admin role changes.

## Expected Behavior Now

### Super Admin
- Sees ALL reservations in count
- Sees ALL unread notifications

### Apartment Admin (single access)
- Sees ONLY apartment reservations in count
- Sees ONLY apartment unread notifications

### Laundry Admin (single access)  
- Sees ONLY laundry reservations in count
- Sees ONLY laundry unread notifications

### Auto Admin (single access)
- Sees ONLY auto reservations in count  
- Sees ONLY auto unread notifications

## Testing
1. Login as a laundry admin (`laundry@gmail.com`)
2. Check dashboard reservation count
3. Verify it only shows laundry reservations, not apartment or auto reservations
4. Test with other admin roles to ensure proper filtering

## Files Modified
- `app/admin-dashboard.tsx` - Added role-based filtering to reservation counts
