import { supabase } from "@/integrations/supabase/client";
import { stockCache } from "./stockCache";

const USD_TO_INR_RATE = 83.50; // Approximate exchange rate

// Helper to check if stock is US-based
const isUSStock = (symbol: string): boolean => {
  return !symbol.endsWith('.NS') && !symbol.endsWith('.BO');
};

// Convert USD to INR for US stocks
const convertToINR = (price: number, symbol: string): number => {
  return isUSStock(symbol) ? price * USD_TO_INR_RATE : price;
};

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  marketCap?: number;
  peRatio?: number;
}

export interface ChartData {
  timestamp: number;
  price: number;
}

// Popular stocks for trading
export const POPULAR_STOCKS = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
  { symbol: 'INFY.NS', name: 'Infosys' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever' },
  { symbol: 'ITC.NS', name: 'ITC Limited' },
  { symbol: 'SBIN.NS', name: 'State Bank of India' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel' },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank' },
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'TSLA', name: 'Tesla' },
];

// Fallback mock data for when API is unavailable
const generateFallbackData = (symbol: string): StockQuote => {
  // Updated base prices (as of late 2024)
  const basePrices: { [key: string]: number } = {
    'RELIANCE.NS': 1285,
    'TCS.NS': 2995,
    'HDFCBANK.NS': 1740,
    'INFY.NS': 1920,
    'ICICIBANK.NS': 1320,
    'HINDUNILVR.NS': 2345,
    'ITC.NS': 465,
    'SBIN.NS': 835,
    'BHARTIARTL.NS': 1665,
    'KOTAKBANK.NS': 1720,
    'AAPL': 180,
    'MSFT': 420,
    'GOOGL': 175,
    'AMZN': 210,
    'TSLA': 350,
  };

  const basePrice = basePrices[symbol] || 100;
  const variation = (Math.random() - 0.5) * 0.02;
  const currentPrice = basePrice * (1 + variation);
  
  // Convert to INR if US stock
  const priceInINR = convertToINR(currentPrice, symbol);
  const basePriceINR = convertToINR(basePrice, symbol);
  
  return {
    symbol,
    name: POPULAR_STOCKS.find(s => s.symbol === symbol)?.name || symbol,
    price: parseFloat(priceInINR.toFixed(2)),
    change: parseFloat((priceInINR - basePriceINR).toFixed(2)),
    changePercent: parseFloat((variation * 100).toFixed(2)),
    high: parseFloat((priceInINR * 1.015).toFixed(2)),
    low: parseFloat((priceInINR * 0.985).toFixed(2)),
    open: parseFloat((basePriceINR * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2)),
    previousClose: parseFloat(basePriceINR.toFixed(2)),
    volume: Math.floor(Math.random() * 10000000) + 1000000,
  };
};

export const getStockQuote = async (symbol: string): Promise<StockQuote> => {
  // Check browser cache first
  const cached = stockCache.get(symbol);
  if (cached) {
    return cached;
  }

  try {
    // Fetch from edge function (which checks DB cache)
    const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
      body: { symbols: [symbol] }
    });

    if (error) throw error;

    if (data.success && data.data[symbol]) {
      const quote = data.data[symbol];
      const result = {
        symbol: quote.symbol,
        name: quote.name,
        price: convertToINR(quote.price, symbol),
        change: convertToINR(quote.change, symbol),
        changePercent: quote.change_percent,
        high: convertToINR(quote.high, symbol),
        low: convertToINR(quote.low, symbol),
        open: convertToINR(quote.open, symbol),
        previousClose: convertToINR(quote.previous_close, symbol),
        volume: quote.volume,
        marketCap: quote.market_cap ? convertToINR(quote.market_cap, symbol) : undefined,
        peRatio: quote.pe_ratio,
      };
      
      // Cache in browser
      stockCache.set(symbol, result);
      return result;
    }
    
    // Fallback to mock data if API fails
    console.warn(`Using fallback data for ${symbol}`);
    return generateFallbackData(symbol);
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    return generateFallbackData(symbol);
  }
};

export const getMultipleQuotes = async (symbols: string[], forceRefresh: boolean = false): Promise<{ [symbol: string]: StockQuote }> => {
  // Check cache for all symbols first (skip if force refresh)
  const quotes: { [symbol: string]: StockQuote } = {};
  const symbolsToFetch: string[] = [];

  if (!forceRefresh) {
    for (const symbol of symbols) {
      const cached = stockCache.get(symbol);
      if (cached) {
        quotes[symbol] = cached;
      } else {
        symbolsToFetch.push(symbol);
      }
    }
  } else {
    // Force refresh all symbols
    symbolsToFetch.push(...symbols);
    // Clear cache for these symbols
    symbols.forEach(symbol => stockCache.clear(symbol));
  }

  // Only fetch uncached symbols
  if (symbolsToFetch.length === 0) {
    return quotes;
  }

  try {
    // Batch fetch from edge function
    const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
      body: { symbols: symbolsToFetch }
    });

    if (error) throw error;

    if (data.success && data.data) {
      for (const symbol of symbolsToFetch) {
        if (data.data[symbol]) {
          const quote = data.data[symbol];
          const result = {
            symbol: quote.symbol,
            name: quote.name,
            price: convertToINR(quote.price, symbol),
            change: convertToINR(quote.change, symbol),
            changePercent: quote.change_percent,
            high: convertToINR(quote.high, symbol),
            low: convertToINR(quote.low, symbol),
            open: convertToINR(quote.open, symbol),
            previousClose: convertToINR(quote.previous_close, symbol),
            volume: quote.volume,
            marketCap: quote.market_cap ? convertToINR(quote.market_cap, symbol) : undefined,
            peRatio: quote.pe_ratio,
          };
          quotes[symbol] = result;
          stockCache.set(symbol, result);
        } else {
          quotes[symbol] = generateFallbackData(symbol);
        }
      }
      
      return quotes;
    }
    
    // Fallback
    for (const symbol of symbolsToFetch) {
      quotes[symbol] = generateFallbackData(symbol);
    }
    return quotes;
  } catch (error) {
    console.error('Error fetching multiple quotes:', error);
    for (const symbol of symbolsToFetch) {
      quotes[symbol] = generateFallbackData(symbol);
    }
    return quotes;
  }
};

export const searchStocks = async (query: string): Promise<{ symbol: string; name: string }[]> => {
  if (!query.trim()) {
    return POPULAR_STOCKS;
  }
  
  try {
    const { data, error } = await supabase.functions.invoke('search-stocks', {
      body: { query },
    });

    if (error) {
      console.error('Error searching stocks:', error);
      // Fallback to local search
      const searchTerm = query.toLowerCase();
      return POPULAR_STOCKS.filter(
        stock => 
          stock.symbol.toLowerCase().includes(searchTerm) ||
          stock.name.toLowerCase().includes(searchTerm)
      );
    }

    return data.results || [];
  } catch (error) {
    console.error('Error searching stocks:', error);
    // Fallback to local search
    const searchTerm = query.toLowerCase();
    return POPULAR_STOCKS.filter(
      stock => 
        stock.symbol.toLowerCase().includes(searchTerm) ||
        stock.name.toLowerCase().includes(searchTerm)
    );
  }
};

// Get historical price for a specific date
export const getHistoricalPrice = async (symbol: string, date: string): Promise<number> => {
  try {
    const targetDate = new Date(date);
    const endDate = new Date(targetDate);
    endDate.setDate(endDate.getDate() + 1);

    const { data, error } = await supabase.functions.invoke('fetch-historical-data', {
      body: { 
        symbol,
        period: 'custom',
        startDate: targetDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });

    if (error) throw error;

    if (data.success && data.data && data.data.length > 0) {
      const price = data.data[0].close;
      return convertToINR(price, symbol);
    }
    
    // Fallback
    return generateFallbackData(symbol).price;
  } catch (error) {
    console.error('Error fetching historical price:', error);
    return generateFallbackData(symbol).price;
  }
};

// Get multiple historical prices at once
export const getMultipleHistoricalPrices = async (
  symbols: string[], 
  date: string
): Promise<{ [symbol: string]: number }> => {
  const prices: { [symbol: string]: number } = {};
  
  await Promise.all(
    symbols.map(async (symbol) => {
      prices[symbol] = await getHistoricalPrice(symbol, date);
    })
  );
  
  return prices;
};

export const getChartData = (symbol: string, days: number = 30): ChartData[] => {
  const data: ChartData[] = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  // Get base price for the stock
  const quote = generateFallbackData(symbol);
  let price = quote.previousClose;
  
  // Generate historical data with random walk
  for (let i = days; i >= 0; i--) {
    const timestamp = now - (i * dayMs);
    
    // Random walk: ±1.5% daily movement
    const change = (Math.random() - 0.5) * 0.03;
    price = price * (1 + change);
    
    data.push({
      timestamp,
      price: parseFloat(price.toFixed(2))
    });
  }
  
  return data;
};

// Simulate real-time price updates
export const subscribeToStockUpdates = (
  symbols: string[],
  callback: (updates: { [symbol: string]: number }) => void
): () => void => {
  const interval = setInterval(async () => {
    const updates: { [symbol: string]: number } = {};
    
    for (const symbol of symbols) {
      const quote = await getStockQuote(symbol);
      updates[symbol] = quote.price;
    }
    
    callback(updates);
  }, 10000); // Update every 10 seconds

  return () => clearInterval(interval);
};
