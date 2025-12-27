import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface GlobalStats {
  totalMarkets: number;
  activeMarkets: number;
  resolvedMarkets: number;
  totalVolume: number;
  totalUsers: number;
  totalBets: number;
  avgMarketSize: number;
  biggestMarket: {
    title: string;
    pool: number;
  } | null;
}

interface TopTrader {
  username: string;
  totalWon: number;
  winRate: number;
  totalBets: number;
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<GlobalStats>({
    totalMarkets: 0,
    activeMarkets: 0,
    resolvedMarkets: 0,
    totalVolume: 0,
    totalUsers: 0,
    totalBets: 0,
    avgMarketSize: 0,
    biggestMarket: null
  });
  const [topTraders, setTopTraders] = useState<TopTrader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Get all markets
      const { data: markets, error: marketsError } = await supabase
        .from('markets')
        .select('*');

      if (marketsError) throw marketsError;

      // Get all bets
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('*, markets(*), users(username)');

      if (betsError) throw betsError;

      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) throw usersError;

      // Calculate global stats
      const totalMarkets = markets?.length || 0;
      const activeMarkets = markets?.filter(m => m.status === 'active').length || 0;
      const resolvedMarkets = markets?.filter(m => m.status === 'resolved').length || 0;
      const totalVolume = markets?.reduce((sum, m) => sum + m.yes_pool + m.no_pool, 0) || 0;
      const avgMarketSize = totalMarkets > 0 ? totalVolume / totalMarkets : 0;

      // Find biggest market
      const biggestMarket = markets?.reduce((max, m) => {
        const pool = m.yes_pool + m.no_pool;
        return pool > (max?.pool || 0) ? { title: m.title, pool } : max;
      }, null as { title: string; pool: number } | null);

      setStats({
        totalMarkets,
        activeMarkets,
        resolvedMarkets,
        totalVolume,
        totalUsers: users?.length || 0,
        totalBets: bets?.length || 0,
        avgMarketSize,
        biggestMarket
      });

      // Calculate top traders
      const userStats = new Map<string, { username: string; won: number; total: number; bets: number }>();

      bets?.forEach(bet => {
        if (!bet.users?.username) return;
        
        const current = userStats.get(bet.user_id) || { 
          username: bet.users.username, 
          won: 0, 
          total: 0, 
          bets: 0 
        };

        current.bets++;
        current.total++;

        if (bet.markets?.status === 'resolved' && bet.markets?.winning_outcome === bet.prediction) {
          current.won++;
        }

        userStats.set(bet.user_id, current);
      });

      const traders = Array.from(userStats.values())
        .filter(u => u.total >= 3) // At least 3 bets
        .map(u => ({
          username: u.username,
          totalWon: u.won,
          winRate: (u.won / u.total) * 100,
          totalBets: u.bets
        }))
        .sort((a, b) => b.winRate - a.winRate)
        .slice(0, 10);

      setTopTraders(traders);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#008080] flex items-center justify-center">
        <div className="border-4 border-white bg-[#c0c0c0] shadow-lg p-8">
          <p className="text-xl font-black uppercase">⏳ CHARGEMENT DES ANALYTICS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#008080] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] border-b-4 border-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-black text-white uppercase mb-2">📊 ANALYTICS GLOBALES</h1>
          <p className="text-sm font-bold text-white/80">Statistiques et tendances de la plateforme</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Global Stats */}
        <div className="border-4 border-white bg-[#c0c0c0] shadow-lg">
          <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1 flex items-center justify-between">
            <span className="text-white text-xs font-bold">🌍 STATISTIQUES GLOBALES</span>
            <div className="flex gap-1">
              <button className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px] hover:bg-white">_</button>
              <button className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px] hover:bg-white">□</button>
              <button className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px] hover:bg-[#ff0000] hover:text-white">×</button>
            </div>
          </div>

          <div className="bg-white p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#c0c0c0] border-2 border-black p-3 text-center">
                <p className="text-[10px] font-black uppercase text-gray-600">🎪 MARCHÉS TOTAUX</p>
                <p className="text-3xl font-black text-black">{stats.totalMarkets}</p>
              </div>

              <div className="bg-[#c0c0c0] border-2 border-black p-3 text-center">
                <p className="text-[10px] font-black uppercase text-gray-600">⚡ MARCHÉS ACTIFS</p>
                <p className="text-3xl font-black text-[#00ff00]">{stats.activeMarkets}</p>
              </div>

              <div className="bg-[#c0c0c0] border-2 border-black p-3 text-center">
                <p className="text-[10px] font-black uppercase text-gray-600">✅ MARCHÉS RÉSOLUS</p>
                <p className="text-3xl font-black text-[#ffff00]">{stats.resolvedMarkets}</p>
              </div>

              <div className="bg-[#c0c0c0] border-2 border-black p-3 text-center">
                <p className="text-[10px] font-black uppercase text-gray-600">👥 UTILISATEURS</p>
                <p className="text-3xl font-black text-black">{stats.totalUsers}</p>
              </div>

              <div className="bg-[#c0c0c0] border-2 border-black p-3 text-center md:col-span-2">
                <p className="text-[10px] font-black uppercase text-gray-600">💰 VOLUME TOTAL</p>
                <p className="text-3xl font-black text-[#00ff00]">{stats.totalVolume.toFixed(2)}</p>
                <p className="text-xs font-bold text-gray-600">SOL</p>
              </div>

              <div className="bg-[#c0c0c0] border-2 border-black p-3 text-center md:col-span-2">
                <p className="text-[10px] font-black uppercase text-gray-600">🎲 PARIS TOTAUX</p>
                <p className="text-3xl font-black text-[#ffff00]">{stats.totalBets}</p>
              </div>

              <div className="bg-[#c0c0c0] border-2 border-black p-3 text-center md:col-span-2">
                <p className="text-[10px] font-black uppercase text-gray-600">📊 TAILLE MOYENNE</p>
                <p className="text-3xl font-black text-black">{stats.avgMarketSize.toFixed(2)}</p>
                <p className="text-xs font-bold text-gray-600">SOL par marché</p>
              </div>

              {stats.biggestMarket && (
                <div className="bg-gradient-to-r from-[#ffff00] to-[#ff8800] border-2 border-black p-3 text-center md:col-span-2">
                  <p className="text-[10px] font-black uppercase text-black">🏆 PLUS GROS MARCHÉ</p>
                  <p className="text-lg font-black text-black truncate">{stats.biggestMarket.title}</p>
                  <p className="text-2xl font-black text-[#00ff00]">{stats.biggestMarket.pool.toFixed(2)} SOL</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Traders Leaderboard */}
        <div className="border-4 border-white bg-[#c0c0c0] shadow-lg">
          <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1 flex items-center justify-between">
            <span className="text-white text-xs font-bold">🏆 TOP 10 TRADERS</span>
            <div className="flex gap-1">
              <button className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px] hover:bg-white">_</button>
              <button className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px] hover:bg-white">□</button>
              <button className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px] hover:bg-[#ff0000] hover:text-white">×</button>
            </div>
          </div>

          <div className="bg-white p-4">
            {topTraders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm font-bold text-gray-600">Pas encore de traders avec 3+ paris</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topTraders.map((trader, index) => (
                  <div
                    key={trader.username}
                    className={`border-2 border-black p-3 flex items-center justify-between ${
                      index === 0 ? 'bg-gradient-to-r from-[#ffff00] to-[#ff8800]' :
                      index === 1 ? 'bg-[#c0c0c0]' :
                      index === 2 ? 'bg-[#cd7f32]/30' :
                      'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black w-8">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </span>
                      <div>
                        <p className="font-black text-lg">@{trader.username}</p>
                        <p className="text-xs font-bold text-gray-600">{trader.totalBets} paris</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-black ${
                        trader.winRate >= 70 ? 'text-[#00ff00]' :
                        trader.winRate >= 50 ? 'text-[#ffff00]' :
                        'text-[#ff0000]'
                      }`}>
                        {trader.winRate.toFixed(1)}%
                      </p>
                      <p className="text-xs font-bold text-gray-600">{trader.totalWon} victoires</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Market Distribution */}
        <div className="border-4 border-white bg-[#c0c0c0] shadow-lg">
          <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1 flex items-center justify-between">
            <span className="text-white text-xs font-bold">📈 DISTRIBUTION DES MARCHÉS</span>
            <div className="flex gap-1">
              <button className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px] hover:bg-white">_</button>
              <button className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px] hover:bg-white">□</button>
              <button className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px] hover:bg-[#ff0000] hover:text-white">×</button>
            </div>
          </div>

          <div className="bg-white p-4">
            <div className="space-y-4">
              {/* Active vs Resolved */}
              <div>
                <p className="text-xs font-black uppercase mb-2">STATUT DES MARCHÉS</p>
                <div className="h-12 flex border-2 border-black overflow-hidden">
                  <div
                    className="bg-[#00ff00] flex items-center justify-center font-black transition-all"
                    style={{ width: `${stats.totalMarkets > 0 ? (stats.activeMarkets / stats.totalMarkets) * 100 : 0}%` }}
                  >
                    {stats.activeMarkets > 0 && `${stats.activeMarkets} ACTIFS`}
                  </div>
                  <div
                    className="bg-[#ffff00] flex items-center justify-center font-black transition-all"
                    style={{ width: `${stats.totalMarkets > 0 ? (stats.resolvedMarkets / stats.totalMarkets) * 100 : 0}%` }}
                  >
                    {stats.resolvedMarkets > 0 && `${stats.resolvedMarkets} RÉSOLUS`}
                  </div>
                </div>
              </div>

              {/* Activity Rate */}
              <div>
                <p className="text-xs font-black uppercase mb-2">TAUX D'ACTIVITÉ</p>
                <div className="bg-[#c0c0c0] border-2 border-black p-4 text-center">
                  <p className="text-4xl font-black text-[#00ff00]">
                    {stats.totalMarkets > 0 ? ((stats.totalBets / stats.totalMarkets).toFixed(1)) : '0'}
                  </p>
                  <p className="text-sm font-bold text-gray-600 mt-1">Paris par marché en moyenne</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/home')}
            className="flex-1 bg-[#00ff00] border-2 border-black px-6 py-3 font-black uppercase hover:bg-[#ffff00] transition-all cursor-pointer whitespace-nowrap"
          >
            🏠 ACCUEIL
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            className="flex-1 bg-[#ffff00] border-2 border-black px-6 py-3 font-black uppercase hover:bg-[#00ff00] transition-all cursor-pointer whitespace-nowrap"
          >
            🏆 CLASSEMENT
          </button>
        </div>
      </div>
    </div>
  );
}
