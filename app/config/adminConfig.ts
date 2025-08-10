// Configuration file for admin privileges
// Add or remove admin email addresses here

export const ADMIN_EMAILS: string[] = [
  'jayveebriani@gmail.com',
  // Add more admin emails here as needed
  // 'admin2@example.com',
  // 'admin3@example.com',
];

// Function to check if an email has admin privileges
export const isAdminEmail = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.toLowerCase());
};
