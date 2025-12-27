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
    const { marketId, outcome } = await req.json();

    // ===== VALIDATIONS COMPLÈTES =====

    // Validation 1: Champs requis
    if (!marketId || !outcome) {
      return new Response(
        JSON.stringify({ error: 'Champs requis manquants' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validation 2: Résultat valide
    if (outcome !== 'yes' && outcome !== 'no') {
      return new Response(
        JSON.stringify({ error: 'Résultat invalide (yes ou no)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validation 3: Vérifier que le marché existe
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

    // Validation 4: Vérifier que le marché n'est pas déjà résolu
    if (marketData.status === 'resolved') {
      return new Response(
        JSON.stringify({ error: 'Ce marché est déjà résolu' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validation 5: Vérifier que l'utilisateur est le créateur
    if (marketData.created_by !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Seul le créateur peut résoudre ce marché' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validation 6: Vérifier que le marché est expiré
    const endDate = new Date(marketData.end_date);
    const now = new Date();
    if (endDate > now) {
      return new Response(
        JSON.stringify({ 
          error: 'Le marché n\'est pas encore terminé',
          endsAt: endDate.toISOString()
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== RÉCUPÉRER TOUS LES PARIS =====
    const { data: bets, error: betsError } = await supabaseAdmin
      .from('bets')
      .select('*')
      .eq('market_id', marketId);

    if (betsError) {
      console.error('Bets fetch error:', betsError);
      return new Response(
        JSON.stringify({ error: 'Impossible de récupérer les paris' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== CALCULER LES GAINS =====
    const yesPool = parseFloat(marketData.yes_pool);
    const noPool = parseFloat(marketData.no_pool);
    const totalPool = parseFloat(marketData.total_pool);
    
    const winningPool = outcome === 'yes' ? yesPool : noPool;
    const losingPool = outcome === 'yes' ? noPool : yesPool;

    let winnersCount = 0;
    let totalDistributed = 0;

    // Si personne n'a parié sur le résultat gagnant, rembourser tout le monde
    if (winningPool === 0) {
      for (const bet of bets) {
        const betAmount = parseFloat(bet.amount);
        
        // Récupérer la balance actuelle
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('balance')
          .eq('id', bet.user_id)
          .single();

        if (userData) {
          const newBalance = parseFloat(userData.balance) + betAmount;
          
          // Rembourser
          await supabaseAdmin
            .from('users')
            .update({ balance: newBalance })
            .eq('id', bet.user_id);

          totalDistributed += betAmount;
        }
      }

      // Mettre à jour le statut du marché
      await supabaseAdmin
        .from('markets')
        .update({ 
          status: 'resolved',
          outcome: outcome,
          resolved_at: now.toISOString()
        })
        .eq('id', marketId);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Aucun gagnant - tous les paris remboursés',
          outcome: outcome,
          winnersCount: 0,
          totalDistributed: totalDistributed.toFixed(2)
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== DISTRIBUER LES GAINS AUX GAGNANTS =====
    for (const bet of bets) {
      if (bet.bet_type === outcome) {
        // Gagnant!
        const betAmount = parseFloat(bet.amount);
        const winShare = betAmount / winningPool;
        const winnings = betAmount + (losingPool * winShare);

        // Récupérer la balance actuelle
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('balance')
          .eq('id', bet.user_id)
          .single();

        if (userData) {
          const newBalance = parseFloat(userData.balance) + winnings;
          
          // Mettre à jour la balance
          const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ balance: newBalance })
            .eq('id', bet.user_id);

          if (updateError) {
            console.error('Balance update error for user:', bet.user_id, updateError);
            continue;
          }

          // Mettre à jour le pari avec le payout
          await supabaseAdmin
            .from('bets')
            .update({ payout: winnings })
            .eq('id', bet.id);

          winnersCount++;
          totalDistributed += winnings;
        }
      }
    }

    // ===== METTRE À JOUR LE STATUT DU MARCHÉ =====
    const { error: updateMarketError } = await supabaseAdmin
      .from('markets')
      .update({ 
        status: 'resolved',
        outcome: outcome,
        resolved_at: now.toISOString()
      })
      .eq('id', marketId);

    if (updateMarketError) {
      console.error('Market update error:', updateMarketError);
      return new Response(
        JSON.stringify({ error: 'Échec de la mise à jour du marché' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== SUCCÈS =====
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Marché résolu avec succès',
        outcome: outcome,
        winnersCount: winnersCount,
        totalDistributed: totalDistributed.toFixed(2),
        totalPool: totalPool.toFixed(2)
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error resolving market:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur serveur interne' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});