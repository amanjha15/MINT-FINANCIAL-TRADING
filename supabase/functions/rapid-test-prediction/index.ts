import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { query, stock_symbol, stock_name } = await req.json();

    console.log(`Rapid test prediction from ${user.email} for ${stock_symbol}: "${query}"`);

    // Validate input
    if (!query || !stock_symbol || !stock_name) {
      throw new Error('Missing required fields: query, stock_symbol, stock_name');
    }

    // Forward request to external webhook
    const webhookUrl = "https://electric-saving-tapir.ngrok-free.app/webhook/rapidtestgame";
    console.log(`Forwarding to webhook: ${webhookUrl}`);

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        user_email: user.email,
        stock_symbol,
        stock_name,
      }),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error(`Webhook error (${webhookResponse.status}): ${errorText}`);
      throw new Error(`Webhook request failed: ${webhookResponse.status}`);
    }

    const webhookData = await webhookResponse.json();
    console.log(`Webhook response:`, webhookData);

    return new Response(
      JSON.stringify(webhookData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in rapid-test-prediction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
