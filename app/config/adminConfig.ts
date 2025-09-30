// Configuration file for admin privileges and contact information
// Add or remove admin email addresses here

export const ADMIN_EMAILS: string[] = [
  'xxc49540@gmail.com',
  'bton79538@gmail.com',
  'ketbe800@gmail.com',

  // Add more admin emails here as needed
  // 'admin2@example.com',
  // 'admin3@example.com',
];

// Apartment Admin Configuration
export const APARTMENT_ADMIN = {
  email: 'xxc49540@gmail.com', // Change this to the correct email for 'Apartment Account'
  name: 'Apartment Account',
};

// Laundry Admin Configuration
export const LAUNDRY_ADMIN = {
  email: 'bton79538@gmail.com', // Change this to the correct email for 'Laundry Account'
  name: 'Laundry Account',
};

// Car and Motor Part Admin Configuration
export const AUTO_ADMIN = {
  email: 'ketbe800@gmail.com', // Change this to the correct email for 'Car and Motor Part' account
  name: 'Car and Motor Part',
};

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
