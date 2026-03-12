/**
 * Currency formatting utilities.
 * Maps ISO currency codes to symbols and formatting.
 */

const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  THB: '฿',
  JPY: '¥',
  CNY: '¥',
  KRW: '₩',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  HKD: 'HK$',
  MYR: 'RM',
  PHP: '₱',
  IDR: 'Rp',
  VND: '₫',
  BRL: 'R$',
  MXN: 'MX$',
  AED: 'AED',
  SAR: 'SAR',
  NZD: 'NZ$',
  CHF: 'CHF',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  ZAR: 'R',
  TWD: 'NT$',
  PLN: 'zł',
  CZK: 'Kč',
  HUF: 'Ft',
  TRY: '₺',
  RUB: '₽',
  ILS: '₪',
  CLP: 'CL$',
  COP: 'COL$',
  PEN: 'S/.',
  ARS: 'AR$',
}

/**
 * Get the symbol for a currency code.
 * Falls back to the code itself (e.g., "XYZ").
 */
export function getCurrencySymbol(currency) {
  if (!currency) return '$'
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency
}

/**
 * Format a numeric value with the currency symbol.
 * e.g., formatCurrency(2750, 'THB') → '฿2,750'
 */
export function formatCurrency(value, currency) {
  const symbol = getCurrencySymbol(currency)
  return symbol + Number(value || 0).toLocaleString('en-US')
}
