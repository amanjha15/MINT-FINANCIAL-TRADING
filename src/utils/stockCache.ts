// Browser-level cache for stock data to minimize API calls

interface CachedStockData {
  data: any;
  timestamp: number;
}

// Aggressive caching: 1 minute during market hours, 1 hour when closed
const CACHE_DURATION_MARKET_OPEN = 1 * 60 * 1000; // 1 minute
const CACHE_DURATION_MARKET_CLOSED = 60 * 60 * 1000; // 60 minutes
const CACHE_PREFIX = 'stock_cache_';

// Simple market hours check (approximation for client-side)
const isMarketLikelyOpen = (): boolean => {
  const now = new Date();
  const day = now.getDay();
  const utcHours = now.getUTCHours();
  
  // Weekend check
  if (day === 0 || day === 6) return false;
  
  // Rough check: US market (9:30 AM - 4 PM ET) or Indian market (9:15 AM - 3:30 PM IST)
  // Convert to approximate hours that cover both markets
  const hour = now.getHours();
  return hour >= 6 && hour <= 23; // Covers most trading hours globally
};

export const stockCache = {
  get: (symbol: string): any | null => {
    try {
      const cached = localStorage.getItem(CACHE_PREFIX + symbol);
      if (!cached) return null;

      const { data, timestamp }: CachedStockData = JSON.parse(cached);
      const age = Date.now() - timestamp;
      const maxAge = isMarketLikelyOpen() ? CACHE_DURATION_MARKET_OPEN : CACHE_DURATION_MARKET_CLOSED;

      if (age < maxAge) {
        return data;
      }

      // Cache expired, remove it
      localStorage.removeItem(CACHE_PREFIX + symbol);
      return null;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  },

  set: (symbol: string, data: any): void => {
    try {
      const cached: CachedStockData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_PREFIX + symbol, JSON.stringify(cached));
    } catch (error) {
      // If localStorage is full, clear old entries
      console.warn('Cache write error, clearing old entries:', error);
      stockCache.clearOld();
      try {
        const cached: CachedStockData = { data, timestamp: Date.now() };
        localStorage.setItem(CACHE_PREFIX + symbol, JSON.stringify(cached));
      } catch (retryError) {
        console.error('Cache write failed after cleanup:', retryError);
      }
    }
  },

  clear: (symbol?: string): void => {
    if (symbol) {
      localStorage.removeItem(CACHE_PREFIX + symbol);
    } else {
      // Clear all stock cache
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
  },

  clearOld: (): void => {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    const maxAge = isMarketLikelyOpen() ? CACHE_DURATION_MARKET_OPEN : CACHE_DURATION_MARKET_CLOSED;
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp }: CachedStockData = JSON.parse(cached);
            if (now - timestamp > maxAge) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          localStorage.removeItem(key);
        }
      }
    });
  },
};
