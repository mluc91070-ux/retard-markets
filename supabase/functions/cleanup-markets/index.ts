import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Non autorisé' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Utilisateur invalide' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer tous les marchés de l'utilisateur triés par date de création (les plus récents en premier)
    const { data: allMarkets, error: fetchError } = await supabaseClient
      .from('markets')
      .select('id')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Erreur lors de la récupération des marchés' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!allMarkets || allMarkets.length <= 10) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Aucun marché à supprimer (10 ou moins)',
          kept: allMarkets?.length || 0,
          deleted: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Garder les 10 premiers, supprimer les autres
    const marketsToDelete = allMarkets.slice(10).map(m => m.id);

    // Supprimer les messages de chat associés
    await supabaseClient
      .from('chat_messages')
      .delete()
      .in('market_id', marketsToDelete);

    // Supprimer les paris associés
    await supabaseClient
      .from('bets')
      .delete()
      .in('market_id', marketsToDelete);

    // Supprimer les marchés
    const { error: deleteMarketsError } = await supabaseClient
      .from('markets')
      .delete()
      .in('id', marketsToDelete);

    if (deleteMarketsError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Erreur lors de la suppression des marchés' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${marketsToDelete.length} marchés supprimés avec succès`,
        kept: 10,
        deleted: marketsToDelete.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Erreur serveur interne' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});