import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verificar se o usuário é admin
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { accessToken } = await req.json();

    if (!accessToken || !accessToken.trim()) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Access Token é obrigatório' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Validando credenciais do Mercado Pago...');

    // Validar o token fazendo uma chamada para a API do Mercado Pago
    const mercadoPagoResponse = await fetch('https://api.mercadopago.com/v1/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!mercadoPagoResponse.ok) {
      const errorData = await mercadoPagoResponse.json();
      console.error('Erro ao validar token do Mercado Pago:', errorData);
      
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Token inválido ou expirado',
          details: errorData.message || 'Credenciais inválidas'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userData = await mercadoPagoResponse.json();
    console.log('Token validado com sucesso. User ID:', userData.id);

    return new Response(
      JSON.stringify({ 
        valid: true, 
        message: 'Credenciais validadas com sucesso',
        accountInfo: {
          id: userData.id,
          email: userData.email,
          nickname: userData.nickname,
          country: userData.site_id
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro na validação de credenciais:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: 'Erro ao validar credenciais',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
