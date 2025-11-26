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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    console.log('Webhook received:', JSON.stringify(body));

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