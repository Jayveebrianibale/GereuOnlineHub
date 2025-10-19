# Laundry Services User Information Display

## Issue
In the admin panel under the Reservation tab, the Laundry Services section was not displaying the name and Gmail of the person who availed the service.

## Root Cause
The laundry services reservation display was missing user information (name and email) that would help admins identify who made the reservation.

## Solution
Added user information display for both Laundry Services and Auto Services in the reservation details section.

## Changes Made

### 1. Added User Information for Laundry Services
Added customer name and email display for laundry service reservations:

```typescript
{/* User Information for Laundry Services */}
{reservation.serviceType === 'laundry' && (
  <>
    <View key="laundry-user-name" style={styles.detailRow}>
      <MaterialIcons name="person" size={16} color={subtitleColor} />
      <ThemedText style={[styles.detailText, { color: textColor }]}>
        Customer: {reservation.userName || 'N/A'}
      </ThemedText>
    </View>
    
    <View key="laundry-user-email" style={styles.detailRow}>
      <MaterialIcons name="email" size={16} color={subtitleColor} />
      <ThemedText style={[styles.detailText, { color: textColor }]}>
        Email: {reservation.userEmail || 'N/A'}
      </ThemedText>
    </View>
  </>
)}
```

### 2. Added User Information for Auto Services
Added the same user information display for auto service reservations for consistency:

```typescript
{/* User Information for Auto Services */}
{reservation.serviceType === 'auto' && (
  <>
    <View key="auto-user-name" style={styles.detailRow}>
      <MaterialIcons name="person" size={16} color={subtitleColor} />
      <ThemedText style={[styles.detailText, { color: textColor }]}>
        Customer: {reservation.userName || 'N/A'}
      </ThemedText>
    </View>
    
    <View key="auto-user-email" style={styles.detailRow}>
      <MaterialIcons name="email" size={16} color={subtitleColor} />
      <ThemedText style={[styles.detailText, { color: textColor }]}>
        Email: {reservation.userEmail || 'N/A'}
      </ThemedText>
    </View>
  </>
)}
```

## Expected Behavior Now

### Laundry Services Reservations
Now display:
- ✅ **Customer Name** - Shows the name of the person who made the reservation
- ✅ **Customer Email** - Shows the Gmail/email of the person who made the reservation
- ✅ **Service Details** - All existing service information (delivery type, pickup details, etc.)
- ✅ **Status Information** - Reservation status and other details

### Auto Services Reservations
Also display:
- ✅ **Customer Name** - Shows the name of the person who made the reservation
- ✅ **Customer Email** - Shows the Gmail/email of the person who made the reservation
- ✅ **Service Details** - All existing service information

### Apartment Reservations
Already had user information in the professional summary card, so no changes needed.

## Visual Layout
The user information appears as:
- 👤 **Customer: [Name]**
- 📧 **Email: [email@example.com]**

This information is displayed right after the service type and location information, before the shipping details for laundry services.

## Benefits
- ✅ **Better Customer Service** - Admins can easily identify who made each reservation
- ✅ **Contact Information** - Direct access to customer email for communication
- ✅ **Consistent Display** - Same format for both laundry and auto services
- ✅ **Professional Look** - Clean, organized display with appropriate icons

## Testing
1. Go to Admin > Reservations tab
2. Look for laundry service reservations
3. Verify customer name and email are displayed
4. Check auto service reservations for the same information
5. Confirm information is properly formatted and readable

## Files Modified
- `app/(admin-tabs)/reservations.tsx` - Added user information display for laundry and auto services
