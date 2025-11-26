import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mercadoPagoAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!mercadoPagoAccessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN not configured');
    }

    // Get the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      throw new Error('Unauthorized: Missing authorization header');
    }

    console.log('Authorization header present:', authHeader.substring(0, 20) + '...');

    // Extract the JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get authenticated user by passing the token directly
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    console.log('User auth check:', { hasUser: !!user, error: userError });

    if (userError || !user) {
      console.error('Authentication failed:', userError);
      throw new Error('Unauthorized: Failed to authenticate user');
    }

    const { amount, description } = await req.json();

    if (!amount || amount < 5) {
      throw new Error('Minimum amount is R$ 5.00');
    }

    console.log(`Creating PIX payment for user ${user.id}, amount: R$ ${amount}`);

    // Get user profile for email
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    // Create payment in Mercado Pago
    const idempotencyKey = `${user.id}_${Date.now()}`;
    const paymentData = {
      transaction_amount: amount,
      description: description || `Creator IA - ${amount} créditos`,
      payment_method_id: 'pix',
      payer: {
        email: profile?.email || user.email,
      },
      external_reference: idempotencyKey,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-payment-webhook`,
      metadata: {
        user_id: user.id,
        credits: amount, // 1 real = 1 credit
      },
    };

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mercadoPagoAccessToken}`,
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(paymentData),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Mercado Pago error:', mpData);
      throw new Error(`Mercado Pago error: ${mpData.message || 'Unknown error'}`);
    }

    console.log('PIX payment created:', mpData.id, 'Status:', mpData.status);

    // Create pending transaction in database
    const { error: transactionError } = await supabaseClient
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        amount: amount,
        type: 'purchase',
        description: description || `Compra de ${amount} créditos`,
        payment_id: mpData.id.toString(),
        payment_status: mpData.status,
      });

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
    }

    // Return payment info with QR code
    return new Response(
      JSON.stringify({
        payment_id: mpData.id,
        status: mpData.status,
        qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
        ticket_url: mpData.point_of_interaction?.transaction_data?.ticket_url,
        amount: amount,
        credits: amount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in create-payment function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
