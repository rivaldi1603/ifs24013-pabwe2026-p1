/**
 * Utility functions for JelajahToba
 */

export function formatCurrency(amount) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return 'Rp 0';
  }
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

export function formatRating(rating) {
  if (rating === null || rating === undefined || Number.isNaN(Number(rating))) {
    return '0.0';
  }
  return Number(rating).toFixed(1);
}

export function formatServiceType(type) {
  const map = {
    'homestay': 'Homestay Warga',
    'cultural_experience': 'Workshop & Budaya',
    'tour_guide': 'Pemandu Lokal',
    'adventure': 'Petualangan Air/Alam',
    'boat_rental': 'Sewa Solu / Perahu'
  };
  return map[type] || 'Layanan Lokal';
}

export function truncateText(text, max = 100) {
  if (!text) return '';
  if (typeof text !== 'string') text = String(text);
  return text.length > max ? text.substring(0, max) + '...' : text;
}

export function slugify(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .trim()
    .split('')
    .map(ch => {
      if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9')) return ch;
      if (ch <= ' ' || ch === '_' || ch === '-') return '-';
      return '';
    })
    .join('')
    .split('-')
    .filter(Boolean)
    .join('-');
}

export function getEstimatedPrice(min, max, unit = '') {
  if (!min && !max) return 'Hubungi Pengelola';
  const unitSuffix = unit ? ` / ${unit}` : '';
  if (min && max && min !== max) {
    return `${formatCurrency(min)} – ${formatCurrency(max)}${unitSuffix}`;
  }
  return `${formatCurrency(min || max)}${unitSuffix}`;
}

export function generateSessionId() {
  return 'jt_' + Math.random().toString(36).substring(2, 9);
}
