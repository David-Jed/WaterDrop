import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: { method: string; json: () => PromiseLike<{ device_id: any; device_secret: any; command: any; }> | { device_id: any; device_secret: any; command: any; }; }) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { device_id, device_secret, command } = await req.json();

    // Validate input
    if (!device_id || !device_secret || !command) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify device credentials
    const { data: device, error: deviceError } = await supabaseClient
      .from('esp32_devices')
      .select('*')
      .eq('device_id', device_id)
      .eq('device_secret', device_secret)
      .eq('is_active', true)
      .single();

    if (deviceError || !device) {
      return new Response(
        JSON.stringify({ error: 'Invalid device credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send command to ESP32 (replace with your actual ESP32 endpoint)
    const esp32Url = Deno.env.get('ESP32_API_URL') ?? '';
    const esp32Response = await fetch(`${esp32Url}/control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Secret': device_secret,
      },
      body: JSON.stringify({ command }),
    });

    if (!esp32Response.ok) {
      throw new Error('ESP32 command failed');
    }

    // Update last seen
    await supabaseClient
      .from('esp32_devices')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', device.id);

    return new Response(
      JSON.stringify({ success: true, command }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});