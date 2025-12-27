import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../../components/feature/Header';
import { Market } from '../../types/market';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [marketToDelete, setMarketToDelete] = useState<string | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [autoCleaningUp, setAutoCleaningUp] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadMarkets();
  }, [user, navigate]);

  const loadMarkets = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedMarkets: Market[] = (data || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        category: m.category,
        endDate: m.end_date,
        yesPool: parseFloat(m.yes_pool),
        noPool: parseFloat(m.no_pool),
        totalPool: parseFloat(m.yes_pool) + parseFloat(m.no_pool),
        status: m.status,
        result: m.result,
        createdBy: m.created_by,
        createdAt: m.created_at
      }));

      setMarkets(formattedMarkets);
    } catch (error) {
      console.error('Erreur lors du chargement des marchés:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoCleanup = async () => {
    try {
      setAutoCleaningUp(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Non authentifié');
      }

      const { data, error } = await supabase.functions.invoke('cleanup-markets', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      await loadMarkets();
      alert(`✅ ${data.deleted} marchés supprimés avec succès! ${data.kept} marchés conservés.`);
    } catch (error: any) {
      console.error('Erreur:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setAutoCleaningUp(false);
    }
  };

  const handleResolve = async (marketId: string, result: 'yes' | 'no') => {
    try {
      setResolving(marketId);

      const { data, error } = await supabase.functions.invoke('resolve-market', {
        body: { marketId, result }
      });

      if (error) throw error;

      await loadMarkets();
      alert('✅ Marché résolu avec succès!');
    } catch (error: any) {
      console.error('Erreur:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setResolving(null);
    }
  };

  const confirmDelete = (marketId: string) => {
    setMarketToDelete(marketId);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!marketToDelete) return;

    try {
      setDeleting(marketToDelete);

      const { error: betsError } = await supabase
        .from('bets')
        .delete()
        .eq('market_id', marketToDelete);

      if (betsError) throw betsError;

      const { error: chatError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('market_id', marketToDelete);

      if (chatError) throw chatError;

      const { error: marketError } = await supabase
        .from('markets')
        .delete()
        .eq('id', marketToDelete);

      if (marketError) throw marketError;

      await loadMarkets();
      setShowDeleteModal(false);
      setMarketToDelete(null);
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const confirmBulkDelete = () => {
    setShowBulkDeleteModal(true);
  };

  const handleBulkDelete = async () => {
    if (markets.length <= 10) {
      alert('⚠️ Il y a déjà 10 marchés ou moins!');
      setShowBulkDeleteModal(false);
      return;
    }

    try {
      setBulkDeleting(true);

      const marketsToKeep = markets.slice(0, 10);
      const marketsToDelete = markets.slice(10);
      const idsToDelete = marketsToDelete.map(m => m.id);

      const { error: betsError } = await supabase
        .from('bets')
        .delete()
        .in('market_id', idsToDelete);

      if (betsError) throw betsError;

      const { error: chatError } = await supabase
        .from('chat_messages')
        .delete()
        .in('market_id', idsToDelete);

      if (chatError) throw chatError;

      const { error: marketsError } = await supabase
        .from('markets')
        .delete()
        .in('id', idsToDelete);

      if (marketsError) throw marketsError;

      await loadMarkets();
      setShowBulkDeleteModal(false);
      alert(`✅ ${idsToDelete.length} marchés supprimés avec succès!`);
    } catch (error: any) {
      console.error('Erreur lors de la suppression en masse:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setBulkDeleting(false);
    }
  };

  const activeMarkets = markets.filter(m => m.status === 'active').length;
  const resolvedMarkets = markets.filter(m => m.status === 'resolved').length;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-black text-[#ffcc00] font-mono mb-2">
            🛠️ ADMIN PANEL
          </h1>
          <p className="text-white/60 font-mono text-sm sm:text-base">GÈRE TES MARCHÉS</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="border-4 border-white bg-black p-6 text-center">
            <p className="text-4xl font-black text-[#ffcc00] font-mono mb-2">{markets.length}</p>
            <p className="text-white/60 font-mono text-sm uppercase">Total Marchés</p>
          </div>
          <div className="border-4 border-white bg-black p-6 text-center">
            <p className="text-4xl font-black text-[#00ff00] font-mono mb-2">{activeMarkets}</p>
            <p className="text-white/60 font-mono text-sm uppercase">Actifs</p>
          </div>
          <div className="border-4 border-white bg-black p-6 text-center">
            <p className="text-4xl font-black text-white/60 font-mono mb-2">{resolvedMarkets}</p>
            <p className="text-white/60 font-mono text-sm uppercase">Résolus</p>
          </div>
        </div>

        {/* Bulk Delete Button */}
        <div className="mb-8 text-center">
          <button
            onClick={handleAutoCleanup}
            disabled={autoCleaningUp}
            className="px-8 py-4 bg-[#ff0000] text-white font-black uppercase border-4 border-white hover:bg-white hover:text-[#ff0000] transition-all whitespace-nowrap cursor-pointer font-mono disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {autoCleaningUp ? '⏳ NETTOYAGE EN COURS...' : `🗑️ GARDER LES 10 PREMIERS ET SUPPRIMER LES AUTRES`}
          </button>
          <p className="text-white/60 font-mono text-xs mt-2">
            ⚠️ Garde automatiquement les 10 marchés les plus récents
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#ffcc00] border-t-transparent"></div>
          </div>
        )}

        {/* Markets List */}
        {!loading && markets.length > 0 && (
          <div className="space-y-4">
            {markets.map((market, index) => (
              <div
                key={market.id}
                className={`border-4 bg-black p-6 ${
                  index < 10 ? 'border-[#00ff00]' : 'border-[#ff0000]'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {index < 10 && (
                        <span className="bg-[#00ff00] text-black px-3 py-1 text-xs font-black font-mono">
                          ✅ À GARDER
                        </span>
                      )}
                      {index >= 10 && (
                        <span className="bg-[#ff0000] text-white px-3 py-1 text-xs font-black font-mono">
                          🗑️ À SUPPRIMER
                        </span>
                      )}
                      <span className={`px-3 py-1 text-xs font-black font-mono ${
                        market.status === 'active' 
                          ? 'bg-[#00ff00] text-black' 
                          : 'bg-white/20 text-white'
                      }`}>
                        {market.status === 'active' ? 'ACTIF' : 'RÉSOLU'}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white font-mono mb-2">
                      {market.title}
                    </h3>
                    <p className="text-white/60 text-sm font-mono mb-3">
                      {market.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm font-mono">
                      <span className="text-[#00ff00]">
                        YES: {market.yesPool.toFixed(2)} SOL
                      </span>
                      <span className="text-[#ff0000]">
                        NO: {market.noPool.toFixed(2)} SOL
                      </span>
                      <span className="text-white/60">
                        Total: {market.totalPool.toFixed(2)} SOL
                      </span>
                      <span className="text-white/60">
                        Fin: {new Date(market.endDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {market.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleResolve(market.id, 'yes')}
                          disabled={resolving === market.id}
                          className="px-4 py-2 bg-[#00ff00] text-black font-black text-xs uppercase border-2 border-black hover:bg-white transition-all whitespace-nowrap cursor-pointer font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resolving === market.id ? '⏳' : '✅ YES'}
                        </button>
                        <button
                          onClick={() => handleResolve(market.id, 'no')}
                          disabled={resolving === market.id}
                          className="px-4 py-2 bg-[#ff0000] text-white font-black text-xs uppercase border-2 border-white hover:bg-white hover:text-[#ff0000] transition-all whitespace-nowrap cursor-pointer font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resolving === market.id ? '⏳' : '❌ NO'}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => confirmDelete(market.id)}
                      disabled={deleting === market.id}
                      className="px-4 py-2 bg-black text-[#ff0000] font-black text-xs uppercase border-2 border-[#ff0000] hover:bg-[#ff0000] hover:text-white transition-all whitespace-nowrap cursor-pointer font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting === market.id ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && markets.length === 0 && (
          <div className="border-4 border-white bg-black p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-black text-[#ffcc00] mb-2 font-mono">
              AUCUN MARCHÉ
            </h3>
            <p className="text-white/60 mb-6 font-mono">
              Tu n'as pas encore créé de marché
            </p>
            <button
              onClick={() => navigate('/create')}
              className="px-6 py-3 bg-[#ffcc00] text-black font-black uppercase hover:bg-white transition-all whitespace-nowrap cursor-pointer font-mono border-2 border-[#ffcc00]"
            >
              &gt;&gt; CRÉER UN MARCHÉ
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="border-4 border-[#ff0000] bg-black p-8 max-w-md w-full">
            <h3 className="text-2xl font-black text-[#ff0000] font-mono mb-4">
              ⚠️ CONFIRMER LA SUPPRESSION
            </h3>
            <p className="text-white font-mono mb-6">
              Es-tu sûr de vouloir supprimer ce marché?
              <br /><br />
              <span className="text-[#ff0000]">
                ⚠️ Cette action est irréversible!
              </span>
              <br /><br />
              Tous les paris associés seront également supprimés.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleDelete}
                disabled={deleting !== null}
                className="flex-1 px-6 py-3 bg-[#ff0000] text-white font-black uppercase border-2 border-white hover:bg-white hover:text-[#ff0000] transition-all whitespace-nowrap cursor-pointer font-mono disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? '⏳ SUPPRESSION...' : 'SUPPRIMER'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setMarketToDelete(null);
                }}
                disabled={deleting !== null}
                className="flex-1 px-6 py-3 bg-black text-white font-black uppercase border-2 border-white hover:bg-white hover:text-black transition-all whitespace-nowrap cursor-pointer font-mono disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ANNULER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="border-4 border-[#ff0000] bg-black p-8 max-w-md w-full">
            <h3 className="text-2xl font-black text-[#ff0000] font-mono mb-4">
              ⚠️ SUPPRESSION EN MASSE
            </h3>
            <p className="text-white font-mono mb-6">
              Tu vas supprimer <span className="text-[#ff0000] font-black">{markets.length - 10} marchés</span> et garder uniquement les 10 premiers.
              <br /><br />
              <span className="text-[#ff0000]">
                ⚠️ Cette action est irréversible!
              </span>
              <br /><br />
              Tous les paris associés seront également supprimés.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex-1 px-6 py-3 bg-[#ff0000] text-white font-black uppercase border-2 border-white hover:bg-white hover:text-[#ff0000] transition-all whitespace-nowrap cursor-pointer font-mono disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkDeleting ? '⏳ SUPPRESSION...' : 'SUPPRIMER'}
              </button>
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={bulkDeleting}
                className="flex-1 px-6 py-3 bg-black text-white font-black uppercase border-2 border-white hover:bg-white hover:text-black transition-all whitespace-nowrap cursor-pointer font-mono disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ANNULER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
