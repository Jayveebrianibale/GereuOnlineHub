// ========================================
// CURRENCY UTILITIES - PAMAMAHALA NG CURRENCY FORMATTING
// ========================================
// Ang file na ito ay naghahandle ng currency formatting utilities
// May functions para sa pag-format ng PHP currency values
// Ginagamit sa buong app para sa price display

// ========================================
// CURRENCY FORMATTING FUNCTIONS
// ========================================
// Main functions para sa currency formatting

// Function para sa pag-format ng PHP currency values
export function formatPHP(value: number | string): string {
  // ========================================
  // NUMBER FORMATTING
  // ========================================
  if (typeof value === 'number') {
    try {
      // I-format ang number gamit ang Intl.NumberFormat para sa PHP currency
      return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
    } catch {
      // Fallback formatting kung nag-fail ang Intl.NumberFormat
      return `₱${Math.round(value).toLocaleString('en-PH')}`;
    }
  }

  // ========================================
  // STRING FORMATTING
  // ========================================
  const trimmed = (value ?? '').toString().trim();
  if (trimmed.length === 0) return '₱0';

  // I-convert ang $ sign to ₱ sign
  if (/^\$/.test(trimmed)) {
    return trimmed.replace(/^\$/, '₱');
  }

  // I-add ang ₱ sign kung walang currency symbol
  if (!/^₱/.test(trimmed) && /^\d|^\.\d/.test(trimmed)) {
    return `₱${trimmed}`;
  }

  // I-replace ang lahat ng $ signs with ₱
  return trimmed.replace(/\$/g, '₱');
}


