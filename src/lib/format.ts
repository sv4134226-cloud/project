export function formatINR(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCompactINR(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10_000_000) {
    return `₹${(value / 10_000_000).toFixed(2)} Cr`;
  }
  if (abs >= 100_000) {
    return `₹${(value / 100_000).toFixed(2)} L`;
  }
  if (abs >= 1_000) {
    return `₹${(value / 1_000).toFixed(1)} K`;
  }
  return formatINR(value, 0);
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
