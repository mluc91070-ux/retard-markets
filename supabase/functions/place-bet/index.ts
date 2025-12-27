import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with user's JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get user from JWT
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Parse request body
    const { marketId, betType, amount } = await req.json();

    // ===== VALIDATIONS COMPLÈTES =====

    // Validation 1: Champs requis
    if (!marketId || !betType || amount === undefined || amount === null) {
      return new Response(
        JSON.stringify({ error: 'Champs requis manquants' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validation 2: Type de pari
    if (betType !== 'yes' && betType !== 'no') {
      return new Response(
        JSON.stringify({ error: 'Type de pari invalide (yes ou no)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validation 3: Montant (positif et raisonnable)
    const betAmount = parseFloat(amount);
    if (isNaN(betAmount)) {
      return new Response(
        JSON.stringify({ error: 'Montant invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (betAmount < 0.01) {
      return new Response(
        JSON.stringify({ error: 'Montant minimum: 0.01 SOL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (betAmount > 10000) {
      return new Response(
        JSON.stringify({ error: 'Montant maximum: 10000 SOL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validation 4: Vérifier la balance de l'utilisateur
    const { data: userData, error: userDataError } = await supabaseAdmin
      .from('users')
      .select('balance')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      return new Response(
        JSON.stringify({ error: 'Impossible de récupérer les données utilisateur' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentBalance = parseFloat(userData.balance);

    if (currentBalance < betAmount) {
      return new Response(
        JSON.stringify({ 
          error: `Balance insuffisante. Tu as ${currentBalance.toFixed(2)} SOL`,
          currentBalance: currentBalance
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validation 5: Vérifier que le marché existe
    const { data: marketData, error: marketError } = await supabaseAdmin
      .from('markets')
      .select('*')
      .eq('id', marketId)
      .single();

    if (marketError || !marketData) {
      return new Response(
        JSON.stringify({ error: 'Marché introuvable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validation 6: Vérifier que le marché est actif
    if (marketData.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Ce marché n\'est plus actif' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validation 7: Vérifier que le marché n'est pas expiré
    const endDate = new Date(marketData.end_date);
    const now = new Date();
    if (endDate < now) {
      return new Response(
        JSON.stringify({ error: 'Ce marché est terminé' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validation 8: Rate limiting (2 secondes entre chaque pari)
    const { data: recentBets } = await supabaseAdmin
      .from('bets')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('market_id', marketId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentBets && recentBets.length > 0) {
      const lastBetTime = new Date(recentBets[0].created_at);
      const timeDiff = now.getTime() - lastBetTime.getTime();
      if (timeDiff < 2000) {
        return new Response(
          JSON.stringify({ error: 'Attends 2 secondes avant de parier à nouveau' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ===== TRANSACTION ATOMIQUE =====
    
    // Calculer la nouvelle balance
    const newBalance = currentBalance - betAmount;

    // Mettre à jour la balance de l'utilisateur
    const { error: updateBalanceError } = await supabaseAdmin
      .from('users')
      .update({ balance: newBalance })
      .eq('id', user.id);

    if (updateBalanceError) {
      console.error('Balance update error:', updateBalanceError);
      return new Response(
        JSON.stringify({ error: 'Échec de la mise à jour de la balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mettre à jour les pools du marché
    const newYesPool = betType === 'yes' 
      ? parseFloat(marketData.yes_pool) + betAmount 
      : parseFloat(marketData.yes_pool);
    const newNoPool = betType === 'no' 
      ? parseFloat(marketData.no_pool) + betAmount 
      : parseFloat(marketData.no_pool);
    const newTotalPool = parseFloat(marketData.total_pool) + betAmount;

    const { error: updateMarketError } = await supabaseAdmin
      .from('markets')
      .update({
        yes_pool: newYesPool,
        no_pool: newNoPool,
        total_pool: newTotalPool
      })
      .eq('id', marketId);

    if (updateMarketError) {
      console.error('Market update error:', updateMarketError);
      // Rollback: Restaurer la balance
      await supabaseAdmin
        .from('users')
        .update({ balance: currentBalance })
        .eq('id', user.id);
      
      return new Response(
        JSON.stringify({ error: 'Échec de la mise à jour du marché' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Créer le pari
    const { error: createBetError } = await supabaseAdmin
      .from('bets')
      .insert({
        user_id: user.id,
        market_id: marketId,
        bet_type: betType,
        amount: betAmount,
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'Anonymous'
      });

    if (createBetError) {
      console.error('Bet creation error:', createBetError);
      // Rollback: Restaurer la balance et les pools
      await supabaseAdmin
        .from('users')
        .update({ balance: currentBalance })
        .eq('id', user.id);
      
      await supabaseAdmin
        .from('markets')
        .update({
          yes_pool: marketData.yes_pool,
          no_pool: marketData.no_pool,
          total_pool: marketData.total_pool
        })
        .eq('id', marketId);
      
      return new Response(
        JSON.stringify({ error: 'Échec de la création du pari' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== SUCCÈS =====
    return new Response(
      JSON.stringify({
        success: true,
        newBalance: newBalance,
        market: {
          yesPool: newYesPool,
          noPool: newNoPool,
          totalPool: newTotalPool,
        },
        message: `Pari de ${betAmount} SOL placé sur ${betType.toUpperCase()}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error placing bet:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur serveur interne' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});