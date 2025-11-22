import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FinnhubQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

interface FinnhubProfile {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  high: number;
  low: number;
  open: number;
  previous_close: number;
  volume: number;
  market_cap: number | null;
  pe_ratio: number | null;
  updated_at: string;
}

// Fetch from Finnhub API
async function fetchFromFinnhub(symbol: string, apiKey: string): Promise<StockData | null> {
  try {
    // Fetch quote data
    const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
    const quoteResponse = await fetch(quoteUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!quoteResponse.ok) {
      console.error(`Finnhub quote API returned ${quoteResponse.status} for ${symbol}`);
      return null;
    }

    const quoteData: FinnhubQuote = await quoteResponse.json();
    
    // Check if we got valid data (Finnhub returns 0s for invalid symbols)
    if (quoteData.c === 0 && quoteData.h === 0 && quoteData.l === 0) {
      console.error(`Finnhub returned empty data for ${symbol}`);
      return null;
    }

    // Fetch company profile for additional data
    let companyName = symbol;
    let marketCap: number | null = null;
    
    try {
      const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`;
      const profileResponse = await fetch(profileUrl, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (profileResponse.ok) {
        const profileData: FinnhubProfile = await profileResponse.json();
        if (profileData.name) {
          companyName = profileData.name;
        }
        if (profileData.marketCapitalization) {
          // Round to integer since DB column is bigint
          marketCap = Math.round(profileData.marketCapitalization * 1000000);
        }
      }
    } catch (profileError) {
      console.warn(`Could not fetch profile for ${symbol}:`, profileError);
    }

    return {
      symbol: symbol,
      name: companyName,
      price: quoteData.c,
      change: quoteData.d,
      change_percent: quoteData.dp,
      high: quoteData.h,
      low: quoteData.l,
      open: quoteData.o,
      previous_close: quoteData.pc,
      volume: 0, // Finnhub doesn't provide volume in quote endpoint
      market_cap: marketCap,
      pe_ratio: null,
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error in fetchFromFinnhub for ${symbol}:`, error);
    return null;
  }
}

// Fetch from Yahoo Finance API (fallback)
async function fetchFromYahoo(symbol: string): Promise<StockData | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://finance.yahoo.com/',
        'Origin': 'https://finance.yahoo.com',
      },
    });

    if (!response.ok) {
      console.error(`Yahoo Finance API returned ${response.status} for ${symbol}`);
      return null;
    }

    const data = await response.json();
    
    if (data.chart?.result?.[0]) {
      const result = data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators?.quote?.[0];
      
      if (meta && meta.regularMarketPrice) {
        const currentPrice = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose || meta.previousClose || currentPrice;
        const change = currentPrice - previousClose;
        
        return {
          symbol: meta.symbol,
          name: meta.longName || meta.shortName || symbol,
          price: currentPrice,
          change: change,
          change_percent: (change / previousClose) * 100,
          high: meta.regularMarketDayHigh || currentPrice,
          low: meta.regularMarketDayLow || currentPrice,
          open: quote?.open?.[0] || meta.regularMarketOpen || currentPrice,
          previous_close: previousClose,
          volume: meta.regularMarketVolume || 0,
          market_cap: meta.marketCap || null,
          pe_ratio: null,
          updated_at: new Date().toISOString(),
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error in fetchFromYahoo for ${symbol}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { symbols } = await req.json();
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Symbols array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching stock data for symbols:', symbols);

    // Check if market is open to adjust cache strategy
    const now = new Date();
    const day = now.getUTCDay(); // Use UTC day for consistency
    
    // Check US market hours (NYSE/NASDAQ: 9:30 AM - 4:00 PM ET)
    // ET is UTC-5 (EST) or UTC-4 (EDT) depending on DST
    // To handle DST properly, we check if current date is in DST period
    const year = now.getUTCFullYear();
    const dstStart = new Date(Date.UTC(year, 2, 14)); // March (rough DST start)
    const dstEnd = new Date(Date.UTC(year, 10, 7));   // November (rough DST end)
    const isDST = now >= dstStart && now < dstEnd;
    const utcOffset = isDST ? 4 : 5; // EDT or EST
    
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const etHours = (utcHours - utcOffset + 24) % 24;
    const totalMinutesET = etHours * 60 + utcMinutes;
    
    // Check Indian market hours (NSE/BSE: 9:15 AM - 3:30 PM IST)
    // IST is UTC+5:30
    const istHours = (utcHours + 5) % 24;
    const istMinutes = utcMinutes + 30;
    const totalMinutesIST = istHours * 60 + istMinutes;
    
    const isWeekend = day === 0 || day === 6;
    const isUSMarketOpen = !isWeekend && totalMinutesET >= (9 * 60 + 30) && totalMinutesET < (16 * 60);
    const isIndianMarketOpen = !isWeekend && totalMinutesIST >= (9 * 60 + 15) && totalMinutesIST < (15 * 60 + 30);
    
    const isAnyMarketOpen = isUSMarketOpen || isIndianMarketOpen;
    
    console.log(`Market status: ${isAnyMarketOpen ? 'OPEN' : 'CLOSED'}`);
    console.log(`  US Market (${isDST ? 'EDT' : 'EST'}): ${isUSMarketOpen ? 'OPEN' : 'CLOSED'} at ${etHours}:${utcMinutes.toString().padStart(2, '0')}`);
    console.log(`  Indian Market (IST): ${isIndianMarketOpen ? 'OPEN' : 'CLOSED'} at ${istHours}:${istMinutes.toString().padStart(2, '0')}`);
    console.log(`  Day: ${isWeekend ? 'Weekend' : 'Weekday'}`);

    // Aggressive caching strategy: short cache during market hours, long cache when closed
    const cacheResults: any = {};
    const symbolsToFetch: string[] = [];
    const cacheMinutes = isAnyMarketOpen ? 1 : 60; // 1 minute during market hours, 60 minutes when closed

    for (const symbol of symbols) {
      const { data: cached, error } = await supabase
        .from('stock_quotes')
        .select('*')
        .eq('symbol', symbol)
        .single();

      if (!error && cached) {
        const cacheAge = now.getTime() - new Date(cached.updated_at).getTime();
        if (cacheAge < cacheMinutes * 60 * 1000) {
          console.log(`Using cached data for ${symbol} (${Math.round(cacheAge / 1000)}s old)`);
          cacheResults[symbol] = cached;
          continue;
        } else {
          console.log(`Cache expired for ${symbol} (${Math.round(cacheAge / 1000)}s old)`);
        }
      }
      symbolsToFetch.push(symbol);
    }

    // Fetch fresh data for symbols not in cache
    const freshData: any = {};
    
    if (symbolsToFetch.length > 0) {
      console.log('Fetching fresh data for:', symbolsToFetch);
      
      const finnhubApiKey = Deno.env.get('FINNHUB_API_KEY');
      
      for (const symbol of symbolsToFetch) {
        let stockData: StockData | null = null;
        
        // Primary: Try Finnhub first
        if (finnhubApiKey) {
          try {
            console.log(`Attempting Finnhub for ${symbol}`);
            stockData = await fetchFromFinnhub(symbol, finnhubApiKey);
            if (stockData) {
              console.log(`✓ Successfully fetched ${symbol} from Finnhub: $${stockData.price}`);
            }
          } catch (finnhubError) {
            console.error(`Finnhub failed for ${symbol}:`, finnhubError);
          }
        }
        
        // Fallback: Try Yahoo Finance if Finnhub failed
        if (!stockData) {
          try {
            console.log(`Attempting Yahoo Finance for ${symbol}`);
            stockData = await fetchFromYahoo(symbol);
            if (stockData) {
              console.log(`✓ Successfully fetched ${symbol} from Yahoo Finance: $${stockData.price}`);
            }
          } catch (yahooError) {
            console.error(`Yahoo Finance failed for ${symbol}:`, yahooError);
          }
        }
        
        // If we got data from either source, cache it
        if (stockData) {
          // Cache in legacy stock_quotes table
          const { error: upsertError } = await supabase
            .from('stock_quotes')
            .upsert(stockData, { onConflict: 'symbol' });

          if (upsertError) {
            console.error(`Error caching data for ${symbol}:`, upsertError);
          }
          
          // Also store in comprehensive realtime quotes table
          const { error: realtimeError } = await supabase
            .from('stock_quotes_realtime')
            .insert({
              symbol: stockData.symbol,
              name: stockData.name,
              price: stockData.price,
              change: stockData.change,
              change_percent: stockData.change_percent,
              open: stockData.open,
              high: stockData.high,
              low: stockData.low,
              previous_close: stockData.previous_close,
              volume: stockData.volume,
              market_cap: stockData.market_cap,
              pe_ratio: stockData.pe_ratio,
              source: stockData === await fetchFromFinnhub(symbol, finnhubApiKey || '') ? 'finnhub' : 'yahoo',
              timestamp: new Date().toISOString()
            });
          
          if (realtimeError && realtimeError.code !== '23505') { // Ignore duplicate timestamp errors
            console.error(`Error storing realtime quote for ${symbol}:`, realtimeError);
          }
          
          freshData[symbol] = stockData;
        } else {
          console.error(`Failed to fetch ${symbol} from all sources`);
        }
      }
    }

    // Combine cached and fresh data
    const allData = { ...cacheResults, ...freshData };

    // Clean old cache entries
    await supabase.rpc('clean_old_stock_quotes');

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: allData,
        cached: Object.keys(cacheResults).length,
        fetched: Object.keys(freshData).length,
        marketStatus: {
          isOpen: isAnyMarketOpen,
          usMarket: isUSMarketOpen,
          indianMarket: isIndianMarketOpen,
          isWeekend,
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in fetch-stock-data function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false,
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
