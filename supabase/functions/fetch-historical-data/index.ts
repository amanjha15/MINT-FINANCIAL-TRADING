import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HistoricalDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Helper to check if market is currently open (Mon-Fri, 9:30 AM - 4:00 PM EST)
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

// Get end time for data fetching - current time if market is open, last close if not
function getDataEndTime(): Date {
  const now = new Date();
  
  // If market is open, use current time to get latest data
  if (isMarketOpen()) {
    console.log('Market is open - fetching data up to current time');
    return now;
  }
  
  // Market is closed - get last market close time
  const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = estTime.getDay();
  const hours = estTime.getHours();
  
  let daysBack = 0;
  
  // If it's weekend, go back to Friday close
  if (day === 0) daysBack = 2; // Sunday -> Friday
  else if (day === 6) daysBack = 1; // Saturday -> Friday
  // If it's before market open on a weekday, use previous trading day's close
  else if (hours < 9 || (hours === 9 && estTime.getMinutes() < 30)) {
    if (day === 1) daysBack = 3; // Monday before open -> Friday
    else daysBack = 1;
  }
  
  const lastClose = new Date(estTime);
  lastClose.setDate(lastClose.getDate() - daysBack);
  lastClose.setHours(16, 0, 0, 0);
  
  console.log('Market is closed - using last market close:', lastClose.toISOString());
  return lastClose;
}

// Fetch historical data from Yahoo Finance
async function fetchYahooHistorical(
  symbol: string, 
  period: string, 
  customStartDate?: string, 
  customEndDate?: string
): Promise<HistoricalDataPoint[]> {
  try {
    let startDate: number;
    let endDate: number;
    let interval: string;
    
    if (period === 'custom' && customStartDate && customEndDate) {
      // Custom date range
      startDate = Math.floor(new Date(customStartDate).getTime() / 1000);
      endDate = Math.floor(new Date(customEndDate).getTime() / 1000);
      
      // Determine interval based on date range
      const daysDiff = Math.floor((endDate - startDate) / (24 * 60 * 60));
      if (daysDiff <= 1) interval = '5m';
      else if (daysDiff <= 5) interval = '15m';
      else if (daysDiff <= 60) interval = '1h';
      else interval = '1d';
    } else {
      // Predefined periods - use current time if market is open, last close if not
      const dataEndTime = getDataEndTime();
      endDate = Math.floor(dataEndTime.getTime() / 1000);
      
      // Calculate date range based on period
      const periodMap: { [key: string]: number } = {
        '1d': 1, '5d': 5, '1mo': 30, '6mo': 180, '1y': 365, '5y': 1825, 'max': 3650
      };
      const days = periodMap[period] || 30;
      startDate = Math.floor((dataEndTime.getTime() - days * 24 * 60 * 60 * 1000) / 1000);
      
      // Determine interval
      const intervalMap: { [key: string]: string } = {
        '1d': '5m', '5d': '15m', '1mo': '1d', '6mo': '1d', '1y': '1d', '5y': '1wk', 'max': '1mo'
      };
      interval = intervalMap[period] || '1d';
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startDate}&period2=${endDate}&interval=${interval}`;
    
    console.log(`Fetching Yahoo historical data for ${symbol} (${period})`);
    console.log(`Date range: ${new Date(startDate * 1000).toISOString()} to ${new Date(endDate * 1000).toISOString()}`);
    console.log(`Market status: ${isMarketOpen() ? 'OPEN' : 'CLOSED'}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      console.error(`Yahoo Finance returned ${response.status} for ${symbol}`);
      return [];
    }

    const data = await response.json();
    
    if (!data.chart?.result?.[0]) {
      console.error(`No chart data in Yahoo response for ${symbol}`);
      console.error('Response structure:', JSON.stringify(data, null, 2));
      return [];
    }

    const result = data.chart.result[0];
    
    // Validate response structure
    if (!result.timestamp || !Array.isArray(result.timestamp)) {
      console.error(`No timestamps array in response for ${symbol}`);
      console.error('Result structure:', JSON.stringify(result, null, 2));
      return [];
    }
    
    const timestamps = result.timestamp;
    const quote = result.indicators?.quote?.[0];
    
    if (!quote) {
      console.error(`Missing quote data in response for ${symbol}`);
      return [];
    }

    if (timestamps.length === 0) {
      console.error(`Empty timestamps array for ${symbol}`);
      return [];
    }

    // Validate OHLC arrays exist
    if (!Array.isArray(quote.close) || !Array.isArray(quote.open) || 
        !Array.isArray(quote.high) || !Array.isArray(quote.low)) {
      console.error(`Missing or invalid OHLC data arrays for ${symbol}`);
      console.error('Quote structure:', JSON.stringify(quote, null, 2));
      return [];
    }

    const historicalData: HistoricalDataPoint[] = [];
    const currentTime = Date.now(); // Use current time instead of last close
    
    for (let i = 0; i < timestamps.length; i++) {
      // Skip if any critical value is null or undefined
      if (quote.close[i] == null || quote.open[i] == null || 
          quote.high[i] == null || quote.low[i] == null) {
        continue;
      }

      const timestamp = timestamps[i] * 1000; // Convert to milliseconds
      
      // Skip future data points (allow current time and past)
      if (timestamp > currentTime) {
        continue;
      }
      
      const date = new Date(timestamp);
      const dayOfWeek = date.getDay();
      
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }

      historicalData.push({
        timestamp,
        open: parseFloat(Number(quote.open[i]).toFixed(2)),
        high: parseFloat(Number(quote.high[i]).toFixed(2)),
        low: parseFloat(Number(quote.low[i]).toFixed(2)),
        close: parseFloat(Number(quote.close[i]).toFixed(2)),
        volume: quote.volume[i] || 0,
      });
    }

    if (historicalData.length === 0) {
      console.error(`No valid data points extracted for ${symbol} from ${timestamps.length} timestamps`);
      return [];
    }

    console.log(`✓ Fetched ${historicalData.length} historical data points for ${symbol}`);
    console.log(`Date range: ${new Date(historicalData[0].timestamp).toISOString()} to ${new Date(historicalData[historicalData.length - 1].timestamp).toISOString()}`);
    return historicalData;
  } catch (error) {
    console.error(`Error fetching Yahoo historical data for ${symbol}:`, error);
    return [];
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

    const { symbol, period, startDate, endDate } = await req.json();
    
    if (!symbol || !period) {
      return new Response(
        JSON.stringify({ error: 'Symbol and period are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (period === 'custom' && (!startDate || !endDate)) {
      return new Response(
        JSON.stringify({ error: 'Custom period requires startDate and endDate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching historical data for ${symbol} (${period})`);
    console.log(`Market is currently: ${isMarketOpen() ? 'OPEN' : 'CLOSED'}`);

    // Check cache first - use shorter cache for intraday when market is open
    const isOpen = isMarketOpen();
    // During market hours: 1 minute cache for real-time feel
    // After hours: 60 minute cache for intraday, 24 hours for longer periods
    const cacheMinutes = period === '1d' && isOpen ? 1 : 
                         period === '1d' ? 60 : 
                         (period === '5d' || period === '1mo') ? 1440 : 10080; // 1 week for long periods
    const cacheThreshold = new Date(Date.now() - cacheMinutes * 60 * 1000);
    
    console.log(`Using ${cacheMinutes}-minute cache window (Market: ${isOpen ? 'OPEN' : 'CLOSED'})`);

    const { data: cachedData } = await supabase
      .from('stock_historical_data')
      .select('*')
      .eq('symbol', symbol)
      .eq('period', period)
      .gte('created_at', cacheThreshold.toISOString())
      .order('timestamp', { ascending: true });

    if (cachedData && cachedData.length > 0) {
      console.log(`Using ${cachedData.length} cached historical points for ${symbol}`);
      const formattedData = cachedData.map(d => ({
        timestamp: parseInt(d.timestamp),
        open: parseFloat(d.open),
        high: parseFloat(d.high),
        low: parseFloat(d.low),
        close: parseFloat(d.close),
        volume: parseInt(d.volume),
      }));

      return new Response(
        JSON.stringify({ success: true, data: formattedData, cached: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch fresh data from Yahoo Finance
    const historicalData = await fetchYahooHistorical(symbol, period, startDate, endDate);

    if (historicalData.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No historical data available',
          data: [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store in database for caching
    const dataToInsert = historicalData.map(point => ({
      symbol,
      timestamp: point.timestamp.toString(),
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close,
      volume: point.volume,
      period,
    }));

    // Delete old data for this symbol/period before inserting new
    await supabase
      .from('stock_historical_data')
      .delete()
      .eq('symbol', symbol)
      .eq('period', period);

    // Insert new data
    const { error: insertError } = await supabase
      .from('stock_historical_data')
      .insert(dataToInsert);

    if (insertError) {
      console.error('Error caching historical data:', insertError);
    } else {
      console.log(`✓ Cached ${historicalData.length} points for ${symbol} (${period})`);
    }

    // Clean old cache periodically
    if (Math.random() < 0.1) { // 10% chance
      await supabase.rpc('clean_old_historical_data');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: historicalData,
        cached: false,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-historical-data function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false,
        data: [],
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
