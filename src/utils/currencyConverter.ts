// Currency conversion utility for stock simulator
// Converts USD stock prices to INR for consistent display

const USD_TO_INR_RATE = 83.50; // Approximate exchange rate (update periodically)

/**
 * Determines if a stock symbol represents a US stock or Indian stock
 */
export const isUSStock = (symbol: string): boolean => {
  // Indian stocks typically end with .NS (NSE) or .BO (BSE)
  return !symbol.endsWith('.NS') && !symbol.endsWith('.BO');
};

/**
 * Converts USD price to INR
 */
export const convertUSDToINR = (usdPrice: number): number => {
  return usdPrice * USD_TO_INR_RATE;
};

/**
 * Converts stock price to INR based on the symbol
 * If it's a US stock (AAPL, MSFT, etc.), converts from USD to INR
 * If it's an Indian stock (.NS, .BO), returns as is (already in INR)
 */
export const convertToINR = (price: number, symbol: string): number => {
  if (isUSStock(symbol)) {
    return convertUSDToINR(price);
  }
  return price;
};

/**
 * Formats a price in INR with proper locale formatting
 */
export const formatINR = (price: number, decimals: number = 2): string => {
  return `₹${price.toLocaleString('en-IN', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  })}`;
};

/**
 * Converts INR back to USD for a given stock symbol
 * Used when buying/selling US stocks to get the actual USD price
 */
export const convertFromINR = (inrPrice: number, symbol: string): number => {
  if (isUSStock(symbol)) {
    return inrPrice / USD_TO_INR_RATE;
  }
  return inrPrice;
};
