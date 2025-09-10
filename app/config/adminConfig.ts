// Configuration file for admin privileges and contact information
// Add or remove admin email addresses here

export const ADMIN_EMAILS: string[] = [
  'jayveebriani@gmail.com',
  'pedro1@gmail.com',
  // Add more admin emails here as needed
  // 'admin2@example.com',
  // 'admin3@example.com',
];

// Contact Information Configuration
export const CONTACT_INFO = {
  email: 'support@gereu.com',
  phone: '+639100870754', // Replace with your actual phone number
  website: 'https://www.gereu.com', // Replace when you have a website
};

// Function to check if an email has admin privileges
export const isAdminEmail = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.toLowerCase());
};
