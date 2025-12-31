/**
 * Phone number normalization utility
 * Removes spaces, dashes, and other non-digit characters
 * Keeps only digits and leading + for country codes
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.trim();
  if (cleaned.startsWith('+')) {
    return '+' + cleaned.slice(1).replace(/\D/g, '');
  }
  return cleaned.replace(/\D/g, '');
}

/**
 * Validate phone number format
 * @param phone - Phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  // Minimum 10 digits (without country code) or 11+ with country code
  return normalized.length >= 10;
}

