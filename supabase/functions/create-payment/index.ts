import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreditPackage {
  credits: number;
  price: number;
  description: string;
}

const CREDIT_PACKAGES: Record<string, CreditPackage> = {
  'pack_5': { credits: 5, price: 19.90, description: '5 créditos' },
  'pack_10': { credits: 10, price: 34.90, description: '10 créditos' },
  'pack_20': { credits: 20, price: 59.90, description: '20 créditos' },
  'pack_50': { credits: 50, price: 129.90, description: '50 créditos' },
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { packageId, paymentMethodId, email } = await req.json();

    // Validate package
    const creditPackage = CREDIT_PACKAGES[packageId];
    if (!creditPackage) {
      throw new Error('Invalid package ID');
    }

    console.log(`Creating payment for user ${user.id}, package: ${packageId}`);

    // Create payment in Mercado Pago
    const paymentData = {
      transaction_amount: creditPackage.price,
      description: `Creator IA - ${creditPackage.description}`,
      payment_method_id: paymentMethodId || 'pix',
      payer: {
        email: email || user.email,
      },
      external_reference: `${user.id}_${packageId}_${Date.now()}`,
      metadata: {
        user_id: user.id,
        credits: creditPackage.credits,
        package_id: packageId,
      },
    };

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mercadoPagoAccessToken}`,
      },
      body: JSON.stringify(paymentData),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Mercado Pago error:', mpData);
      throw new Error(`Mercado Pago error: ${mpData.message || 'Unknown error'}`);
    }

    console.log('Payment created:', mpData.id, 'Status:', mpData.status);

    // Create pending transaction in database
    const { error: transactionError } = await supabaseClient
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        amount: creditPackage.credits,
        type: 'purchase',
        description: `Compra de ${creditPackage.description}`,
        payment_id: mpData.id.toString(),
        payment_status: mpData.status,
      });

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
    }

    // Return payment info
    return new Response(
      JSON.stringify({
        payment_id: mpData.id,
        status: mpData.status,
        qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
        ticket_url: mpData.point_of_interaction?.transaction_data?.ticket_url,
        external_resource_url: mpData.external_resource_url,
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