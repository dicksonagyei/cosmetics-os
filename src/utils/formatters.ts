/**
 * Format integer cents into formatted currency string ($XX.XX)
 */
export function formatMoney(cents: number, currencySymbol = '$'): string {
  const dollars = (cents / 100).toFixed(2);
  return `${currencySymbol}${dollars}`;
}

/**
 * Format ISO datetime string to legible display format
 */
export function formatDateTime(isoString: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Check if a product expiry date is near (within 90 days) or expired
 */
export function getExpiryStatus(expiryDate?: string | null): {
  status: 'valid' | 'expiring_soon' | 'expired' | 'none';
  label: string;
} {
  if (!expiryDate) return { status: 'none', label: 'No Expiry' };

  try {
    const expiry = new Date(expiryDate).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { status: 'expired', label: 'EXPIRED' };
    } else if (diffDays <= 90) {
      return { status: 'expiring_soon', label: `Exp: ${diffDays}d` };
    } else {
      return { status: 'valid', label: expiryDate };
    }
  } catch {
    return { status: 'none', label: expiryDate };
  }
}
