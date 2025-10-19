# Admin Login Logs Feature

## Overview
An admin-only logging system that tracks user and admin login/logout activities with date-based filtering. This feature is exclusively available to administrators for monitoring system access.

## Features

### ✅ **Core Features:**
- **Login/Logout Tracking**: Automatically logs all user and admin login/logout activities
- **Date Filtering**: Filter logs by specific dates (Today button for quick access)
- **Role-based Filtering**: Filter by user role (Admin/User/All)
- **Action Filtering**: Filter by login or logout actions
- **Real-time Updates**: Live updates when new login/logout activities occur
- **Statistics Dashboard**: Overview of login counts and activity

### 📱 **Admin Interface:**
- **Admin Logs Tab**: Comprehensive interface for viewing and managing login activities
- **Statistics Dashboard**: Detailed analytics and login counts
- **Log Management**: Delete individual logs and clear old logs
- **Responsive Design**: Works on all screen sizes
- **Dark Mode Support**: Consistent with app theme

### 🔧 **Technical Features:**
- **Automatic Logging**: Login/logout activities are automatically logged
- **Firebase Integration**: Uses Firebase Realtime Database for data storage
- **Type Safety**: Full TypeScript support with proper interfaces
- **Error Handling**: Robust error handling for all operations

## File Structure

```
app/
├── services/
│   └── logsService.ts          # Core logging service
├── utils/
│   └── loggingUtils.ts         # Logging utilities
├── (admin-tabs)/
│   └── logs.tsx               # Admin logs screen (Admin Only)
└── contexts/
    └── AuthContext.tsx        # Updated with logging integration

utils/
└── authUtils.ts               # Updated with automatic logging
```

## Usage

### For Admins Only:
1. Navigate to the "Logs" tab in admin panel
2. View all user and admin login activities
3. Use filters to find specific activities:
   - **Role**: Filter by Admin/User/All
   - **Action**: Filter by Login/Logout/All
   - **Date**: Click "Today" to see today's activities
4. View comprehensive statistics
5. Manage logs (delete individual logs, clear old logs)

## Data Structure

### Log Entry:
```typescript
interface LogEntry {
  id: string;                    // Unique log ID
  userId: string;                // User ID
  userEmail: string;             // User email
  userRole: 'admin' | 'user';    // User role
  action: 'login' | 'logout';    // Action type
  timestamp: number;             // Unix timestamp
  date: string;                  // Date (YYYY-MM-DD)
  time: string;                  // Time (HH:MM:SS)
}
```

### Statistics:
```typescript
interface LogStats {
  totalLogs: number;             // Total number of logs
  loginCount: number;            // Total login count
  logoutCount: number;           // Total logout count
  adminLogins: number;           // Admin login count
  userLogins: number;            // User login count
  todayLogins: number;           // Today's login count
}
```

## Automatic Logging

The system automatically logs login/logout activities when:
- User signs in successfully
- User signs out
- Admin signs in successfully
- Admin signs out

No manual intervention required - logging happens transparently in the background.

## Filtering Options

### Date Filtering:
- **Today Button**: Quick access to today's activities
- **Date Range**: Filter by specific date ranges (future enhancement)

### Role Filtering:
- **All**: Show all activities
- **Admin**: Show only admin activities
- **User**: Show only user activities

### Action Filtering:
- **All**: Show all actions
- **Login**: Show only login activities
- **Logout**: Show only logout activities

## Admin Features

### Log Management:
- **Delete Individual Logs**: Remove specific log entries
- **Clear Old Logs**: Remove logs older than 30 days
- **Refresh Data**: Manually refresh log data

### Statistics:
- **Today's Logins**: Count of logins today
- **Total Logins**: Overall login count
- **Admin Logins**: Admin-specific login count
- **User Logins**: User-specific login count
- **Logout Count**: Total logout count

## Future Enhancements

- Date range picker for more flexible date filtering
- Export logs functionality
- Advanced search capabilities
- Login attempt tracking (failed logins)
- IP address logging
- Device information logging

## Technical Notes

- Uses Firebase Realtime Database for data storage
- Implements real-time listeners for live updates
- Includes proper error handling and user feedback
- Follows the app's existing design patterns and color scheme
- Fully responsive and accessible
