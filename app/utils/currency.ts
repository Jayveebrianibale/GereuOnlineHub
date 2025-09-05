export function formatPHP(value: number | string): string {
  if (typeof value === 'number') {
    try {
      return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
    } catch {
      return `₱${Math.round(value).toLocaleString('en-PH')}`;
    }
  }

  const trimmed = (value ?? '').toString().trim();
  if (trimmed.length === 0) return '₱0';

  if (/^\$/.test(trimmed)) {
    return trimmed.replace(/^\$/, '₱');
  }

  if (!/^₱/.test(trimmed) && /^\d|^\.\d/.test(trimmed)) {
    return `₱${trimmed}`;
  }

  return trimmed.replace(/\$/g, '₱');
}


