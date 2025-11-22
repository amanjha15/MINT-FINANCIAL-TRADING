import { supabase } from "@/integrations/supabase/client";
import { stockCache } from "./stockCache";

export interface DetailedStockQuote {
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
  pe?: number;
  eps?: number;
  high52Week?: number;
  low52Week?: number;
  averageVolume?: number;
  dividendYield?: number;
}

const STOCK_BASE_DATA: { [key: string]: { price: number; name: string; marketCap?: number; pe?: number } } = {
  'RELIANCE.NS': { price: 1285, name: 'Reliance Industries', marketCap: 16500000000000, pe: 28.5 },
  'TCS.NS': { price: 2995, name: 'Tata Consultancy Services', marketCap: 13000000000000, pe: 32.1 },
  'HDFCBANK.NS': { price: 1740, name: 'HDFC Bank', marketCap: 12500000000000, pe: 19.8 },
  'INFY.NS': { price: 1920, name: 'Infosys', marketCap: 5900000000000, pe: 27.4 },
  'ICICIBANK.NS': { price: 1320, name: 'ICICI Bank', marketCap: 7400000000000, pe: 18.2 },
  'HINDUNILVR.NS': { price: 2345, name: 'Hindustan Unilever', marketCap: 5600000000000, pe: 58.9 },
  'ITC.NS': { price: 465, name: 'ITC Limited', marketCap: 5200000000000, pe: 26.7 },
  'SBIN.NS': { price: 835, name: 'State Bank of India', marketCap: 5600000000000, pe: 12.3 },
  'BHARTIARTL.NS': { price: 1665, name: 'Bharti Airtel', marketCap: 8900000000000, pe: 45.2 },
  'KOTAKBANK.NS': { price: 1720, name: 'Kotak Mahindra Bank', marketCap: 3500000000000, pe: 16.5 },
  'AAPL': { price: 180, name: 'Apple Inc.', marketCap: 2750000000000, pe: 29.8 },
  'MSFT': { price: 420, name: 'Microsoft Corporation', marketCap: 2820000000000, pe: 35.4 },
  'GOOGL': { price: 175, name: 'Alphabet Inc.', marketCap: 1760000000000, pe: 26.3 },
  'AMZN': { price: 210, name: 'Amazon.com Inc.', marketCap: 1700000000000, pe: 68.5 },
  'TSLA': { price: 350, name: 'Tesla Inc.', marketCap: 770000000000, pe: 72.1 },
};

// Fallback generator for when real API is unavailable
const generateFallbackQuote = (symbol: string): DetailedStockQuote => {
  const baseData = STOCK_BASE_DATA[symbol] || { price: 100, name: symbol };
  const variation = (Math.random() - 0.5) * 0.04;
  const currentPrice = baseData.price * (1 + variation);
  const previousClose = baseData.price;
  const change = currentPrice - previousClose;
  
  return {
    symbol,
    name: baseData.name,
    price: parseFloat(currentPrice.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(((change / previousClose) * 100).toFixed(2)),
    high: parseFloat((currentPrice * 1.02).toFixed(2)),
    low: parseFloat((currentPrice * 0.98).toFixed(2)),
    open: parseFloat((previousClose * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2)),
    previousClose: parseFloat(previousClose.toFixed(2)),
    volume: Math.floor(Math.random() * 10000000) + 1000000,
    marketCap: baseData.marketCap,
    pe: baseData.pe,
    eps: baseData.pe ? parseFloat((currentPrice / baseData.pe).toFixed(2)) : undefined,
    high52Week: parseFloat((currentPrice * 1.25).toFixed(2)),
    low52Week: parseFloat((currentPrice * 0.75).toFixed(2)),
    averageVolume: Math.floor(Math.random() * 8000000) + 2000000,
    dividendYield: Math.random() * 3,
  };
};

export interface IntradayDataPoint {
  timestamp: number;
  price: number;
  volume?: number;
}

export const getDetailedQuote = async (symbol: string): Promise<DetailedStockQuote> => {
  // Check browser cache first (but bypass if volume was missing)
  const cached = stockCache.get(`detailed_${symbol}`) as DetailedStockQuote | undefined;
  if (cached && cached.volume && cached.volume > 0) {
    return cached;
  }

  try {
    // Fetch from edge function
    const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
      body: { symbols: [symbol] }
    });

    if (error) throw error;

    if (data.success && data.data[symbol]) {
      const quote = data.data[symbol];
      let result: DetailedStockQuote = {
        symbol: quote.symbol,
        name: quote.name,
        price: quote.price,
        change: quote.change,
        changePercent: quote.change_percent,
        high: quote.high,
        low: quote.low,
        open: quote.open,
        previousClose: quote.previous_close,
        volume: quote.volume,
        marketCap: quote.market_cap,
        pe: quote.pe_ratio,
        eps: quote.pe_ratio ? parseFloat((quote.price / quote.pe_ratio).toFixed(2)) : undefined,
        high52Week: parseFloat((quote.price * 1.25).toFixed(2)),
        low52Week: parseFloat((quote.price * 0.75).toFixed(2)),
        averageVolume: Math.floor((quote.volume || 0) * 1.2),
        dividendYield: Math.random() * 3,
      };

      // If volume is missing (0), approximate using today's intraday sum
      if (!result.volume || result.volume === 0) {
        try {
          const { data: hData } = await supabase.functions.invoke('fetch-historical-data', {
            body: { symbol, period: '1d' }
          });
          if (hData?.success && Array.isArray(hData.data) && hData.data.length > 0) {
            const intradayVol = hData.data.reduce((sum: number, p: any) => sum + (Number(p.volume) || 0), 0);
            if (intradayVol > 0) {
              result.volume = intradayVol;
              result.averageVolume = Math.floor(intradayVol * 1.2);
            }
          }
        } catch (e) {
          console.warn('Could not enrich volume from intraday data:', e);
        }
      }
      
      // Cache in browser
      stockCache.set(`detailed_${symbol}`, result);
      return result;
    }
    
    // Fallback
    console.warn(`Using fallback data for ${symbol}`);
    return generateFallbackQuote(symbol);
  } catch (error) {
    console.error('Error fetching detailed quote:', error);
    return generateFallbackQuote(symbol);
  }
};

export const getIntradayData = async (
  symbol: string,
  interval: '1m' | '2m' | '5m' | '15m' | '30m' | '60m' | '90m' | '1h' | '1d' = '5m'
): Promise<IntradayDataPoint[]> => {
  return await getHistoricalData(symbol, '1d');
};

export const getHistoricalData = async (
  symbol: string,
  period: '1d' | '5d' | '1mo' | '6mo' | '1y' | '5y' | 'max' = '1mo'
): Promise<IntradayDataPoint[]> => {
  try {
    console.log(`Fetching historical data for ${symbol} (${period})`);
    
    // Try to fetch real historical data from edge function
    const { data, error } = await supabase.functions.invoke('fetch-historical-data', {
      body: { symbol, period }
    });

    if (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }

    if (data.success && data.data && data.data.length > 0) {
      console.log(`Using ${data.cached ? 'cached' : 'fresh'} historical data: ${data.data.length} points`);
      const points = data.data.map((point: any) => ({
        timestamp: point.timestamp,
        price: point.close,
        volume: point.volume,
      }));
      
      // Log the date range for debugging
      if (points.length > 0) {
        console.log(`Data range: ${new Date(points[0].timestamp).toLocaleString()} to ${new Date(points[points.length - 1].timestamp).toLocaleString()}`);
      }
      
      return points;
    }

    // Fallback: Generate realistic synthetic data
    console.warn(`No data returned, generating fallback data for ${symbol} (${period})`);
    return await generateRealisticFallbackData(symbol, period);
  } catch (error) {
    console.error('Error in getHistoricalData:', error);
    return await generateRealisticFallbackData(symbol, period);
  }
};

// Helper to check if market is currently open (Mon-Fri, 9:30 AM - 4:00 PM EST)
function isMarketOpen(): boolean {
  const now = new Date();
  const day = now.getDay();
  
  // Weekend check
  if (day === 0 || day === 6) return false;
  
  // Get EST time (simplified - doesn't account for DST transitions)
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const estOffset = -5; // EST is UTC-5
  const estHours = (utcHours + estOffset + 24) % 24;
  const currentMinutes = estHours * 60 + utcMinutes;
  
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM
  
  return currentMinutes >= marketOpen && currentMinutes < marketClose;
}

// Get last market close time
function getLastMarketClose(): Date {
  const now = new Date();
  const day = now.getDay();
  const utcHours = now.getUTCHours();
  const estOffset = -5;
  const estHours = (utcHours + estOffset + 24) % 24;
  
  let daysBack = 0;
  
  // If it's weekend, go back to Friday
  if (day === 0) daysBack = 2; // Sunday -> Friday
  else if (day === 6) daysBack = 1; // Saturday -> Friday
  // If it's before market close, use previous trading day
  else if (estHours < 16) {
    if (day === 1) daysBack = 3; // Monday before close -> Friday
    else daysBack = 1;
  }
  
  const lastClose = new Date(now);
  lastClose.setDate(lastClose.getDate() - daysBack);
  lastClose.setUTCHours(16 + 5, 0, 0, 0); // 4 PM EST in UTC
  
  return lastClose;
}

// Helper to check if a date is a trading day (Monday-Friday)
function isTradingDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6; // Not Sunday or Saturday
}

// Improved fallback data generation with market hours
async function generateRealisticFallbackData(
  symbol: string,
  period: '1d' | '5d' | '1mo' | '6mo' | '1y' | '5y' | 'max'
): Promise<IntradayDataPoint[]> {
  const quote = await getDetailedQuote(symbol);
  const currentPrice = quote.price;
  const currentHigh = quote.high;
  const currentLow = quote.low;
  
  const data: IntradayDataPoint[] = [];
  const lastClose = getLastMarketClose();
  
  // Determine interval based on period
  const intervalMinutes = period === '1d' ? 5 : period === '5d' ? 15 : period === '1mo' ? 60 : 1440;
  const daysToGenerate = period === '1d' ? 1 : period === '5d' ? 5 : period === '1mo' ? 30 : 180;
  
  // Start from N trading days ago
  const startDate = new Date(lastClose);
  let tradingDaysBack = 0;
  while (tradingDaysBack < daysToGenerate) {
    startDate.setDate(startDate.getDate() - 1);
    if (isTradingDay(startDate)) {
      tradingDaysBack++;
    }
  }
  
  let price = period === '1d' ? quote.previousClose : currentPrice * (0.88 + Math.random() * 0.10);
  const volatility = period === '1d' ? 0.002 : period === '5d' ? 0.005 : 0.012;
  
  // Generate data points
  let currentDate = new Date(startDate);
  let pointCount = 0;
  const maxPoints = period === '1d' ? 78 : period === '5d' ? 130 : period === '1mo' ? 300 : 500;
  
  while (currentDate <= lastClose && pointCount < maxPoints) {
    // Skip weekends
    if (!isTradingDay(currentDate)) {
      currentDate.setMinutes(currentDate.getMinutes() + intervalMinutes);
      continue;
    }
    
    // For intraday periods, only include market hours
    if (period === '1d' || period === '5d') {
      const hours = currentDate.getUTCHours();
      const minutes = currentDate.getUTCMinutes();
      const estHours = (hours - 5 + 24) % 24;
      const totalMinutes = estHours * 60 + minutes;
      
      // Market hours: 9:30 AM - 4:00 PM EST
      if (totalMinutes < 9 * 60 + 30 || totalMinutes >= 16 * 60) {
        currentDate.setMinutes(currentDate.getMinutes() + intervalMinutes);
        continue;
      }
    }
    
    // Calculate price movement
    const progress = pointCount / maxPoints;
    const targetPrice = currentPrice;
    const trendFactor = (targetPrice - price) / (maxPoints - pointCount || 1);
    
    price += trendFactor;
    price += (Math.random() - 0.5) * volatility * price;
    
    // Add cyclical movement
    const cyclical = Math.sin((pointCount / 15) * Math.PI * 2) * volatility * price * 0.3;
    price += cyclical;
    
    // Constrain to realistic ranges
    if (period === '1d') {
      price = Math.max(currentLow * 0.998, Math.min(currentHigh * 1.002, price));
    }
    
    const baseVolume = period === '1d' ? 100000 : 5000000;
    const volumeVariance = 0.5 + Math.random();
    const volumeSpike = Math.random() > 0.9 ? (2 + Math.random()) : 1;
    const volume = Math.floor(baseVolume * volumeVariance * volumeSpike);
    
    data.push({
      timestamp: currentDate.getTime(),
      price: parseFloat(price.toFixed(2)),
      volume,
    });
    
    pointCount++;
    currentDate.setMinutes(currentDate.getMinutes() + intervalMinutes);
  }
  
  // Force last point to be current price
  if (data.length > 0) {
    data[data.length - 1].price = currentPrice;
  }
  
  console.log(`Generated ${data.length} fallback data points from ${new Date(data[0]?.timestamp).toLocaleString()} to ${new Date(data[data.length - 1]?.timestamp).toLocaleString()}`);
  
  return data;
}
