import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-finnhub-secret',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook secret first
    const finnhubSecret = req.headers.get('X-Finnhub-Secret');
    const expectedSecret = Deno.env.get('FINNHUB_WEBHOOK_SECRET');
    
    if (!finnhubSecret || finnhubSecret !== expectedSecret) {
      console.error('Invalid webhook secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process webhook data in background
    const webhookData = await req.json();
    console.log('Received Finnhub webhook data:', JSON.stringify(webhookData, null, 2));

    // Process data asynchronously without blocking response
    (async () => {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Process the webhook data based on event type
        if (webhookData.data && Array.isArray(webhookData.data)) {
          for (const item of webhookData.data) {
            // Handle different event types
            if (item.s && item.p) { // Symbol and price
              const stockData = {
                symbol: item.s,
                name: item.s, // Will be updated when full profile is fetched
                price: item.p,
                change: 0, // Will be calculated
                change_percent: 0, // Will be calculated
                high: item.p,
                low: item.p,
                open: item.p,
                previous_close: item.p,
                volume: item.v || 0,
                market_cap: null,
                pe_ratio: null,
                updated_at: new Date(item.t || Date.now()).toISOString(),
              };

              // Update cache
              const { error: upsertError } = await supabase
                .from('stock_quotes')
                .upsert(stockData, { onConflict: 'symbol' });

              if (upsertError) {
                console.error(`Error caching webhook data for ${item.s}:`, upsertError);
              } else {
                console.log(`✓ Updated ${item.s} from webhook: $${item.p}`);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error processing webhook data:', error);
      }
    })();

    // Acknowledge receipt immediately with 200 status
    return new Response(
      JSON.stringify({ status: 'received' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in finnhub-webhook function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Still return 200 to prevent webhook being disabled
    return new Response(
      JSON.stringify({ status: 'error', message: errorMessage }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
