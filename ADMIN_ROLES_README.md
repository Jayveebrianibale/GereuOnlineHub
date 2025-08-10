# Admin Role Management

This document explains how admin roles are managed in the Gereu Online Hub application.

## How It Works

The application now uses **email-based role assignment** instead of display name checking. This provides a more secure and reliable way to manage admin privileges.

## Adding Admin Users

To grant admin privileges to a user:

1. **Open the configuration file**: `app/config/adminConfig.ts`
2. **Add the email address** to the `ADMIN_EMAILS` array:

```typescript
export const ADMIN_EMAILS: string[] = [
  'jayveebrianibale@gmail.com',
  'newadmin@example.com',  // Add new admin emails here
  'another.admin@company.com',
];
```

3. **Save the file** - changes take effect immediately

## Removing Admin Users

To revoke admin privileges:

1. **Open the configuration file**: `app/config/adminConfig.ts`
2. **Remove the email address** from the `ADMIN_EMAILS` array
3. **Save the file**

## Current Admin Users

- `jayveebrianibale@gmail.com` - Primary admin

## Security Notes

- **Email addresses are case-insensitive** - the system automatically converts to lowercase
- **Changes are immediate** - no server restart required
- **Only the email address matters** - display names and other profile information don't affect roles
- **Admin privileges persist** - even if a user changes their display name

## How Authentication Works

1. User signs in with their email and password
2. The system checks if their email is in the `ADMIN_EMAILS` list
3. If yes → User gets `admin` role and access to admin features
4. If no → User gets `user` role and access to regular user features

## Automatic Navigation

The `RoleBasedNavigator` component automatically redirects users to the appropriate section:
- **Admin users** → `/(admin-tabs)` (Admin Dashboard)
- **Regular users** → `/(user-tabs)` (User Dashboard)

## Troubleshooting

- **User not getting admin access?** Check if their email is exactly correct in the config
- **Role not updating?** Try signing out and signing back in
- **Navigation issues?** Ensure the user has the correct role in the auth context

## Future Enhancements

Consider implementing:
- Database-stored admin roles for persistence
- Role-based permissions system
- Admin role management interface
- Audit logging for role changes
