# Role-Based Access Control Test Guide

## Overview
This document outlines how to test the role-based access control for the admin reservations tab.

## Test Scenarios

### 1. Super Admin Access
**Email:** `xxc49540@gmail.com` or `jayveebriani@gmail.com`
**Expected Behavior:**
- Can see ALL reservations (apartment, laundry, auto)
- Header shows "Manage all customer reservations"
- No role indicator card displayed
- All reservation types visible in the list

### 2. Apartment Admin Access
**Email:** `apartment@gmail.com`
**Expected Behavior:**
- Can ONLY see apartment reservations
- Header shows "Manage Apartment Admin reservations"
- Role indicator shows "Access: Apartment"
- Only apartment reservations visible in the list
- Laundry and auto reservations are filtered out

### 3. Laundry Admin Access
**Email:** `laundry@gmail.com`
**Expected Behavior:**
- Can ONLY see laundry reservations
- Header shows "Manage Laundry Admin reservations"
- Role indicator shows "Access: Laundry"
- Only laundry reservations visible in the list
- Apartment and auto reservations are filtered out

### 4. Auto Admin Access
**Email:** `auto@gmail.com`
**Expected Behavior:**
- Can ONLY see auto reservations
- Header shows "Manage Auto Admin reservations"
- Role indicator shows "Access: Car"
- Only auto reservations visible in the list
- Apartment and laundry reservations are filtered out

## Implementation Details

### AdminReservationContext Changes
1. **Role Detection:** Automatically detects admin role based on email
2. **Filtering Logic:** Filters reservations based on accessible modules
3. **Real-time Updates:** Filtering applies to both initial load and real-time updates
4. **Super Admin Bypass:** Super admins see all reservations without filtering

### Reservations Screen Changes
1. **Dynamic Header:** Shows role-specific messaging
2. **Access Indicator:** Displays accessible modules for non-super admins
3. **Filtered Display:** Only shows reservations the admin has access to
4. **Role Information Card:** Explains access level and limitations

## Testing Steps

1. **Login with different admin accounts**
2. **Navigate to Admin > Reservations tab**
3. **Verify header text matches expected role**
4. **Check role indicator card (for non-super admins)**
5. **Confirm only appropriate reservations are displayed**
6. **Test real-time updates by creating new reservations**

## Expected Results

- ✅ Apartment admin only sees apartment reservations
- ✅ Laundry admin only sees laundry reservations  
- ✅ Auto admin only sees auto reservations
- ✅ Super admin sees all reservations
- ✅ UI clearly indicates access level
- ✅ Real-time filtering works correctly
- ✅ Search and filter functions work within accessible modules

## Configuration

The role-based access is configured in `app/config/adminConfig.ts`:

```typescript
export const ADMIN_EMAIL_ROLES: Record<string, string> = {
  'xxc49540@gmail.com': ADMIN_ROLES.SUPER_ADMIN,
  'jayveebriani@gmail.com': ADMIN_ROLES.SUPER_ADMIN,
  'apartment@gmail.com': ADMIN_ROLES.APARTMENT_ADMIN,
  'laundry@gmail.com': ADMIN_ROLES.LAUNDRY_ADMIN,
  'auto@gmail.com': ADMIN_ROLES.AUTO_ADMIN,
};
```

## Notes

- The filtering happens at the context level, so all components using `useAdminReservation` will automatically get filtered data
- The filtering is based on `serviceType` field in reservations
- Module mapping: `apartment` → `apartment`, `laundry` → `laundry`, `auto` → `car`
- Super admins bypass all filtering and see everything
