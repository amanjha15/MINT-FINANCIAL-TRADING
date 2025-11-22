import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, files, sender } = await req.json();

    console.log(`Received message from ${sender}`, {
      message,
      fileCount: files?.length || 0,
      files: files?.map((f: any) => ({ name: f.name, type: f.type, size: f.size }))
    });

    // Process files if they exist - now receiving URLs instead of binary data
    const processedFiles = files?.map((file: any) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      url: file.url,
      path: file.path
    })) || [];

    // Construct enhanced message with file URLs
    let enhancedMessage = message;
    if (processedFiles.length > 0) {
      enhancedMessage += "\n\nAttached files:\n";
      processedFiles.forEach((file: any) => {
        enhancedMessage += `\n--- ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)} KB) ---\n`;
        enhancedMessage += `Download URL: ${file.url}\n`;
      });
    }

    console.log('Enhanced message length:', enhancedMessage.length);

    // Forward to external webhook
    const WEBHOOK_URL = "https://electric-saving-tapir.ngrok-free.app/webhook/myfinancialAI";
    
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: enhancedMessage,
        sender: sender,
        originalMessage: message,
        files: processedFiles
      })
    });

    console.log('Webhook response status:', webhookResponse.status);
    
    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('Webhook error response:', errorText);
      throw new Error(`Webhook request failed: ${webhookResponse.status} - ${errorText}`);
    }

    const responseText = await webhookResponse.text();
    console.log('Webhook raw response:', responseText.substring(0, 200));

    let webhookData;
    try {
      webhookData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse webhook response as JSON:', parseError);
      // If not JSON, treat the text as the response
      webhookData = { response: responseText };
    }

    console.log('Webhook response parsed successfully');

    return new Response(
      JSON.stringify({
        response: webhookData.output || webhookData.response || webhookData.message || "No response received",
        filesProcessed: processedFiles.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in ai-coach-chat:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        response: "I apologize, but I encountered an error processing your request. Please try again."
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
