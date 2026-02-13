const AED_PER_USD = Number(process.env.AED_PER_USD ?? 3.6725);

/** Convert USD to AED */
export function convertToAED(usd: number): number {
  return Math.round(usd * AED_PER_USD * 100) / 100;
}

/** Convert AED to USD */
export function convertToUSD(aed: number): number {
  return Math.round((aed / AED_PER_USD) * 100) / 100;
}
