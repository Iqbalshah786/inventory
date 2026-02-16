export const AED_PER_USD = Number(process.env.AED_PER_USD ?? 3.675);

/** Convert USD to AED (rounded to 2 dp – use for display only) */
export function convertToAED(usd: number): number {
  return Math.round(usd * AED_PER_USD * 100) / 100;
}

/** Convert AED to USD (rounded to 2 dp – use for display only) */
export function convertToUSD(aed: number): number {
  return Math.round((aed / AED_PER_USD) * 100) / 100;
}
