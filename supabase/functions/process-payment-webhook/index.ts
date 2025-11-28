import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to verify webhook signature
async function verifyWebhookSignature(
  req: Request,
  body: any,
  secret: string
): Promise<boolean> {
  try {
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    
    if (!xSignature || !xRequestId) {
      console.error('Missing signature headers');
      return false;
    }

    // Extract ts and v1 from x-signature (format: "ts=1704908010,v1=618c85...")
    const parts = xSignature.split(',');
    let ts = '';
    let hash = '';
    
    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 'ts') ts = value;
      if (key === 'v1') hash = value;
    }

    if (!ts || !hash) {
      console.error('Invalid signature format');
      return false;
    }

    // Build manifest according to Mercado Pago documentation
    // Template: id:{data.id};request-id:{x-request-id};ts:{ts};
    const dataId = body.data?.id?.toString() || '';
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    
    console.log('Verifying signature with manifest:', manifest);

    // Calculate HMAC SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(manifest);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const calculatedHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Compare hashes using constant-time comparison
    const isValid = calculatedHash === hash;
    
    if (!isValid) {
      console.error('Signature verification failed');
      console.error('Expected:', hash);
      console.error('Calculated:', calculatedHash);
    }
    
    return isValid;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mercadoPagoAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    const webhookSecret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET');
    
    if (!mercadoPagoAccessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN not configured');
    }
    
    if (!webhookSecret) {
      throw new Error('MERCADOPAGO_WEBHOOK_SECRET not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    console.log('Webhook received:', JSON.stringify(body));

    // Verify webhook signature
    const isValidSignature = await verifyWebhookSignature(req, body, webhookSecret);
    
    if (!isValidSignature) {
      console.error('Invalid webhook signature - possible fraudulent request');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    console.log('Webhook signature verified successfully');

    // Mercado Pago sends payment notifications
    if (body.type === 'payment') {
      const paymentId = body.data?.id;
      
      if (!paymentId) {
        throw new Error('Payment ID not found in webhook');
      }

      // Get payment details from Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${mercadoPagoAccessToken}`,
        },
      });

      const paymentData = await mpResponse.json();
      console.log('Payment data:', JSON.stringify(paymentData));

      const status = paymentData.status;
      const userId = paymentData.metadata?.user_id;
      const credits = paymentData.metadata?.credits;

      if (!userId || !credits) {
        console.error('Missing metadata in payment:', paymentData);
        throw new Error('Invalid payment metadata');
      }

      // Update transaction status
      const { error: updateError } = await supabaseClient
        .from('credit_transactions')
        .update({ payment_status: status })
        .eq('payment_id', paymentId.toString());

      if (updateError) {
        console.error('Error updating transaction:', updateError);
      }

      // If payment is approved, add credits to user
      if (status === 'approved') {
        console.log(`Payment approved! Adding ${credits} credits to user ${userId}`);
        
        // First, get current credits
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          throw new Error('Failed to fetch user profile');
        }

        if (!profile) {
          console.error('Profile not found for user:', userId);
          throw new Error('User profile not found');
        }

        const currentCredits = profile.credits || 0;
        const newCredits = currentCredits + credits;

        console.log(`Current credits: ${currentCredits}, Adding: ${credits}, New total: ${newCredits}`);

        // Update credits
        const { error: creditsError } = await supabaseClient
          .from('profiles')
          .update({ credits: newCredits })
          .eq('id', userId);

        if (creditsError) {
          console.error('Error updating credits:', creditsError);
          throw new Error('Failed to update user credits');
        }

        console.log(`Credits added successfully! User ${userId} now has ${newCredits} credits`);
      } else {
        console.log(`Payment status is "${status}", no credits added`);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in process-payment-webhook:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});