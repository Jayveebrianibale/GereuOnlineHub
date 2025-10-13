// Configuration file for admin privileges and contact information
// Add or remove admin email addresses here

// ========================================
// ADMIN ROLES CONFIGURATION
// ========================================
// Define admin roles and their access permissions

export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin', // Can access everything
  APARTMENT_ADMIN: 'apartment_admin', // Can only access apartment module
  LAUNDRY_ADMIN: 'laundry_admin', // Can only access laundry module
  AUTO_ADMIN: 'auto_admin', // Can only access auto module
} as const;

// Admin email to role mapping
export const ADMIN_EMAIL_ROLES: Record<string, string> = {
  'xxc49540@gmail.com': ADMIN_ROLES.SUPER_ADMIN, // Super admin - can access everything
  'jayveebriani@gmail.com': ADMIN_ROLES.SUPER_ADMIN, // Super admin - can access everything
  
  // Add specific admin emails here
  // 'apartment@example.com': ADMIN_ROLES.APARTMENT_ADMIN,
  // 'laundry@example.com': ADMIN_ROLES.LAUNDRY_ADMIN,
  // 'auto@example.com': ADMIN_ROLES.AUTO_ADMIN,
};

// Legacy admin emails array for backward compatibility
export const ADMIN_EMAILS: string[] = Object.keys(ADMIN_EMAIL_ROLES);

// Module access permissions for each role
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ADMIN_ROLES.SUPER_ADMIN]: ['apartment', 'laundry', 'car', 'payments'],
  [ADMIN_ROLES.APARTMENT_ADMIN]: ['apartment'],
  [ADMIN_ROLES.LAUNDRY_ADMIN]: ['laundry'],
  [ADMIN_ROLES.AUTO_ADMIN]: ['car'],
};

// Admin Configuration Objects
export const APARTMENT_ADMIN = {
  email: 'apartment@example.com', // Change this to the actual apartment admin email
  name: 'Apartment Account',
  role: ADMIN_ROLES.APARTMENT_ADMIN,
};

export const LAUNDRY_ADMIN = {
  email: 'laundry@example.com', // Change this to the actual laundry admin email
  name: 'Laundry Account',
  role: ADMIN_ROLES.LAUNDRY_ADMIN,
};

export const AUTO_ADMIN = {
  email: 'auto@example.com', // Change this to the actual auto admin email
  name: 'Auto Account',
  role: ADMIN_ROLES.AUTO_ADMIN,
};

// Contact Information Configuration
export const CONTACT_INFO = {
  email: 'support@gereu.com',
  phone: '+639100870754', // Replace with your actual phone number
  website: 'https://www.gereu.com', // Replace when you have a website
};

// ========================================
// HELPER FUNCTIONS
// ========================================

// Function to check if an email has admin privileges
export const isAdminEmail = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

// Function to get admin role by email
export const getAdminRole = (email: string): string => {
  return ADMIN_EMAIL_ROLES[email.toLowerCase()] || ADMIN_ROLES.SUPER_ADMIN;
};

// Function to check if admin has access to a specific module
export const hasModuleAccess = (email: string, module: string): boolean => {
  const role = getAdminRole(email);
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(module);
};

// Function to get accessible modules for an admin
export const getAccessibleModules = (email: string): string[] => {
  const role = getAdminRole(email);
  return ROLE_PERMISSIONS[role] || [];
};

// Function to check if admin is super admin
export const isSuperAdmin = (email: string): boolean => {
  return getAdminRole(email) === ADMIN_ROLES.SUPER_ADMIN;
};
