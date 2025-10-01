export interface PasswordStrength {
  score: number; // 0-4 (0 = very weak, 4 = very strong)
  feedback: string[];
  isValid: boolean;
  requirements: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    specialChar: boolean;
  };
}

export const validatePasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
  };

  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }

  // Character type checks
  if (!requirements.lowercase) {
    feedback.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  if (!requirements.uppercase) {
    feedback.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  if (!requirements.number) {
    feedback.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  if (!requirements.specialChar) {
    feedback.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?~`)');
  } else {
    score += 1;
  }

  // Additional strength checks
  if (password.length >= 12) {
    score += 0.5;
  }
  if (password.length >= 16) {
    score += 0.5;
  }

  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeating characters (e.g., "aaa", "111")');
    score = Math.max(0, score - 1);
  }

  if (/123|abc|qwe|asd|zxc/i.test(password)) {
    feedback.push('Avoid common sequences (e.g., "123", "abc")');
    score = Math.max(0, score - 1);
  }

  // Check for common words
  const commonWords = ['password', '123456', 'qwerty', 'admin', 'letmein', 'welcome'];
  if (commonWords.some(word => password.toLowerCase().includes(word))) {
    feedback.push('Avoid common words or patterns');
    score = Math.max(0, score - 1);
  }

  const isValid = requirements.length && requirements.lowercase && 
                 requirements.uppercase && requirements.number && requirements.specialChar;

  return {
    score: Math.min(4, Math.max(0, Math.floor(score))),
    feedback,
    isValid,
    requirements,
  };
};

export const getPasswordStrengthLabel = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return 'Very Weak';
    case 2:
      return 'Weak';
    case 3:
      return 'Good';
    case 4:
      return 'Strong';
    default:
      return 'Very Weak';
  }
};

export const getPasswordStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return '#EF4444'; // Red
    case 2:
      return '#F59E0B'; // Orange
    case 3:
      return '#10B981'; // Green
    case 4:
      return '#059669'; // Dark Green
    default:
      return '#EF4444';
  }
};
