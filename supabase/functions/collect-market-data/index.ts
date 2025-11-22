import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to check if market is currently open
function isMarketOpen(): boolean {
  const now = new Date();
  const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = estTime.getDay();
  const hours = estTime.getHours();
  const minutes = estTime.getMinutes();
  
  // Weekend check
  if (day === 0 || day === 6) return false;
  
  // Market hours: 9:30 AM - 4:00 PM EST
  const currentMinutes = hours * 60 + minutes;
  const marketOpen = 9 * 60 + 30;
  const marketClose = 16 * 60;
  
  return currentMinutes >= marketOpen && currentMinutes < marketClose;
}

// Fetch from Finnhub
async function fetchFromFinnhub(symbol: string, apiKey: string) {
  try {
    const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
    const quoteResponse = await fetch(quoteUrl);
    
    if (!quoteResponse.ok) return null;
    
    const quoteData = await quoteResponse.json();
    
    // Validate data
    if (quoteData.c === 0 && quoteData.h === 0 && quoteData.l === 0) return null;
    
    // Get company profile
    const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`;
    const profileResponse = await fetch(profileUrl);
    let companyName = symbol;
    let marketCap = null;
    
    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      companyName = profileData.name || symbol;
      marketCap = profileData.marketCapitalization ? Math.round(profileData.marketCapitalization * 1000000) : null;
    }
    
    return {
      symbol,
      name: companyName,
      price: quoteData.c,
      change: quoteData.d,
      change_percent: quoteData.dp,
      high: quoteData.h,
      low: quoteData.l,
      open: quoteData.o,
      previous_close: quoteData.pc,
      volume: 0,
      market_cap: marketCap,
      source: 'finnhub'
    };
  } catch (error) {
    console.error(`Finnhub error for ${symbol}:`, error);
    return null;
  }
}

// Fetch from Yahoo Finance
async function fetchFromYahoo(symbol: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) return null;

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
          change,
          change_percent: (change / previousClose) * 100,
          high: meta.regularMarketDayHigh || currentPrice,
          low: meta.regularMarketDayLow || currentPrice,
          open: quote?.open?.[0] || meta.regularMarketOpen || currentPrice,
          previous_close: previousClose,
          volume: meta.regularMarketVolume || 0,
          market_cap: meta.marketCap || null,
          source: 'yahoo'
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Yahoo error for ${symbol}:`, error);
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
    
    const finnhubApiKey = Deno.env.get('FINNHUB_API_KEY');
    const isOpen = isMarketOpen();
    
    console.log(`Starting market data collection - Market ${isOpen ? 'OPEN' : 'CLOSED'}`);
    
    // Get all active monitored stocks
    const { data: stocks, error: stocksError } = await supabase
      .from('monitored_stocks')
      .select('symbol, name')
      .eq('is_active', true);
    
    if (stocksError) {
      throw stocksError;
    }
    
    console.log(`Collecting data for ${stocks?.length || 0} stocks`);
    
    const results: any[] = [];
    
    for (const stock of stocks || []) {
      let stockData = null;
      let source = '';
      
      // Try Finnhub first
      if (finnhubApiKey) {
        stockData = await fetchFromFinnhub(stock.symbol, finnhubApiKey);
        if (stockData) source = 'finnhub';
      }
      
      // Fallback to Yahoo Finance
      if (!stockData) {
        stockData = await fetchFromYahoo(stock.symbol);
        if (stockData) source = 'yahoo';
      }
      
      if (stockData) {
        // Store in realtime quotes table
        const { error: insertError } = await supabase
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
            source: stockData.source,
            timestamp: new Date().toISOString()
          });
        
        if (!insertError) {
          results.push({ symbol: stock.symbol, success: true, source });
          
          // Log success
          await supabase
            .from('data_collection_log')
            .insert({
              symbol: stock.symbol,
              data_type: 'quote',
              source: stockData.source,
              success: true,
              records_count: 1
            });
        } else {
          console.error(`Error inserting ${stock.symbol}:`, insertError);
          
          // Log failure
          await supabase
            .from('data_collection_log')
            .insert({
              symbol: stock.symbol,
              data_type: 'quote',
              source: source || 'unknown',
              success: false,
              error_message: insertError.message
            });
        }
      } else {
        console.log(`No data available for ${stock.symbol}`);
        results.push({ symbol: stock.symbol, success: false, error: 'No data available' });
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Clean old data periodically
    if (Math.random() < 0.1) {
      await supabase.rpc('clean_old_realtime_quotes');
      console.log('Cleaned old realtime quotes');
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        collected: results.length,
        marketOpen: isOpen,
        results
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in collect-market-data function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
