import { CurrencyCode } from './types';

const RATES: Record<CurrencyCode, { rate: number; symbol: string }> = {
  USD: { rate: 1, symbol: '$' },
  LKR: { rate: 300, symbol: 'LKR ' },
  EUR: { rate: 0.92, symbol: '€' },
};

export function formatMoney(
  amountUsd: number,
  currency: CurrencyCode = 'USD',
  withCode = false,
): string {
  const cfg = RATES[currency] ?? RATES.USD;
  const converted = amountUsd * cfg.rate;
  const formatted =
    currency === 'LKR'
      ? `${cfg.symbol}${Math.round(converted).toLocaleString('en-US')}`
      : `${cfg.symbol}${converted.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

  return withCode ? `${formatted} ${currency}` : formatted;
}

