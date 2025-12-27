import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface UserStatsProps {
  userId: string;
}

interface Stats {
  totalBets: number;
  totalWagered: number;
  totalWon: number;
  winRate: number;
  activeBets: number;
  resolvedBets: number;
  biggestWin: number;
  profitLoss: number;
  marketsCreated: number;
  avgBetSize: number;
}

export default function UserStats({ userId }: UserStatsProps) {
  const [stats, setStats] = useState<Stats>({
    totalBets: 0,
    totalWagered: 0,
    totalWon: 0,
    winRate: 0,
    activeBets: 0,
    resolvedBets: 0,
    biggestWin: 0,
    profitLoss: 0,
    marketsCreated: 0,
    avgBetSize: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Get all user bets
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('*, markets(*)')
        .eq('user_id', userId);

      if (betsError) throw betsError;

      // Get markets created by user
      const { data: markets, error: marketsError } = await supabase
        .from('markets')
        .select('*')
        .eq('created_by', userId);

      if (marketsError) throw marketsError;

      // Calculate stats
      const totalBets = bets?.length || 0;
      const totalWagered = bets?.reduce((sum, bet) => sum + bet.amount, 0) || 0;
      
      const resolvedBets = bets?.filter(bet => bet.markets?.status === 'resolved') || [];
      const wonBets = resolvedBets.filter(bet => bet.markets?.winning_outcome === bet.prediction);
      
      const totalWon = wonBets.reduce((sum, bet) => sum + (bet.payout || 0), 0);
      const winRate = resolvedBets.length > 0 ? (wonBets.length / resolvedBets.length) * 100 : 0;
      
      const activeBets = bets?.filter(bet => bet.markets?.status === 'active').length || 0;
      const biggestWin = Math.max(...wonBets.map(bet => bet.payout || 0), 0);
      const profitLoss = totalWon - totalWagered;
      const avgBetSize = totalBets > 0 ? totalWagered / totalBets : 0;

      setStats({
        totalBets,
        totalWagered,
        totalWon,
        winRate,
        activeBets,
        resolvedBets: resolvedBets.length,
        biggestWin,
        profitLoss,
        marketsCreated: markets?.length || 0,
        avgBetSize
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="border-4 border-white bg-[#c0c0c0] shadow-lg p-8 text-center">
        <p className="text-sm font-black uppercase">⏳ CHARGEMENT DES STATS...</p>
      </div>
    );
  }

  return (
    <div className="border-4 border-white bg-[#c0c0c0] shadow-lg">
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1 flex items-center justify-between">
        <span className="text-white text-xs font-bold">📊 STATISTIQUES UTILISATEUR</span>
        <div className="flex gap-1">
          <button className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px] hover:bg-white">_</button>
          <button className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px] hover:bg-white">□</button>
          <button className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px] hover:bg-[#ff0000] hover:text-white">×</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="bg-white p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Total Bets */}
          <div className="bg-[#c0c0c0] border-2 border-black p-3">
            <p className="text-[10px] font-black uppercase text-gray-600 mb-1">🎲 PARIS TOTAUX</p>
            <p className="text-2xl font-black text-black">{stats.totalBets}</p>
          </div>

          {/* Total Wagered */}
          <div className="bg-[#c0c0c0] border-2 border-black p-3">
            <p className="text-[10px] font-black uppercase text-gray-600 mb-1">💰 MISÉ TOTAL</p>
            <p className="text-2xl font-black text-[#ffff00]">{stats.totalWagered.toFixed(2)}</p>
            <p className="text-[8px] font-bold text-gray-600">SOL</p>
          </div>

          {/* Total Won */}
          <div className="bg-[#c0c0c0] border-2 border-black p-3">
            <p className="text-[10px] font-black uppercase text-gray-600 mb-1">🏆 GAINS TOTAUX</p>
            <p className="text-2xl font-black text-[#00ff00]">{stats.totalWon.toFixed(2)}</p>
            <p className="text-[8px] font-bold text-gray-600">SOL</p>
          </div>

          {/* Win Rate */}
          <div className="bg-[#c0c0c0] border-2 border-black p-3">
            <p className="text-[10px] font-black uppercase text-gray-600 mb-1">📈 TAUX DE VICTOIRE</p>
            <p className={`text-2xl font-black ${stats.winRate >= 50 ? 'text-[#00ff00]' : 'text-[#ff0000]'}`}>
              {stats.winRate.toFixed(1)}%
            </p>
          </div>

          {/* Profit/Loss */}
          <div className="bg-[#c0c0c0] border-2 border-black p-3">
            <p className="text-[10px] font-black uppercase text-gray-600 mb-1">💵 PROFIT/PERTE</p>
            <p className={`text-2xl font-black ${stats.profitLoss >= 0 ? 'text-[#00ff00]' : 'text-[#ff0000]'}`}>
              {stats.profitLoss >= 0 ? '+' : ''}{stats.profitLoss.toFixed(2)}
            </p>
            <p className="text-[8px] font-bold text-gray-600">SOL</p>
          </div>

          {/* Active Bets */}
          <div className="bg-[#c0c0c0] border-2 border-black p-3">
            <p className="text-[10px] font-black uppercase text-gray-600 mb-1">⚡ PARIS ACTIFS</p>
            <p className="text-2xl font-black text-[#ffff00]">{stats.activeBets}</p>
          </div>

          {/* Resolved Bets */}
          <div className="bg-[#c0c0c0] border-2 border-black p-3">
            <p className="text-[10px] font-black uppercase text-gray-600 mb-1">✅ PARIS RÉSOLUS</p>
            <p className="text-2xl font-black text-black">{stats.resolvedBets}</p>
          </div>

          {/* Biggest Win */}
          <div className="bg-[#c0c0c0] border-2 border-black p-3">
            <p className="text-[10px] font-black uppercase text-gray-600 mb-1">🎯 PLUS GROS GAIN</p>
            <p className="text-2xl font-black text-[#00ff00]">{stats.biggestWin.toFixed(2)}</p>
            <p className="text-[8px] font-bold text-gray-600">SOL</p>
          </div>

          {/* Markets Created */}
          <div className="bg-[#c0c0c0] border-2 border-black p-3">
            <p className="text-[10px] font-black uppercase text-gray-600 mb-1">🎪 MARCHÉS CRÉÉS</p>
            <p className="text-2xl font-black text-black">{stats.marketsCreated}</p>
          </div>

          {/* Average Bet Size */}
          <div className="bg-[#c0c0c0] border-2 border-black p-3 md:col-span-3">
            <p className="text-[10px] font-black uppercase text-gray-600 mb-1">📊 MISE MOYENNE</p>
            <p className="text-2xl font-black text-[#ffff00]">{stats.avgBetSize.toFixed(2)}</p>
            <p className="text-[8px] font-bold text-gray-600">SOL</p>
          </div>
        </div>

        {/* Performance Indicator */}
        <div className="mt-4 bg-[#c0c0c0] border-2 border-black p-4">
          <p className="text-xs font-black uppercase mb-3">🎖️ PERFORMANCE</p>
          <div className="space-y-2">
            {/* Win Rate Bar */}
            <div>
              <div className="flex justify-between text-[10px] font-bold mb-1">
                <span>TAUX DE VICTOIRE</span>
                <span>{stats.winRate.toFixed(1)}%</span>
              </div>
              <div className="h-6 bg-white border-2 border-black flex overflow-hidden">
                <div
                  className="bg-[#00ff00] flex items-center justify-center text-[10px] font-black transition-all"
                  style={{ width: `${stats.winRate}%` }}
                >
                  {stats.winRate > 20 && `${stats.winRate.toFixed(0)}%`}
                </div>
                <div
                  className="bg-[#ff0000] flex items-center justify-center text-[10px] font-black transition-all"
                  style={{ width: `${100 - stats.winRate}%` }}
                >
                  {100 - stats.winRate > 20 && `${(100 - stats.winRate).toFixed(0)}%`}
                </div>
              </div>
            </div>

            {/* ROI Indicator */}
            <div>
              <div className="flex justify-between text-[10px] font-bold mb-1">
                <span>ROI (RETOUR SUR INVESTISSEMENT)</span>
                <span className={stats.totalWagered > 0 ? (stats.profitLoss >= 0 ? 'text-[#00ff00]' : 'text-[#ff0000]') : ''}>
                  {stats.totalWagered > 0 ? `${((stats.profitLoss / stats.totalWagered) * 100).toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              {stats.totalWagered > 0 && (
                <div className="h-6 bg-white border-2 border-black flex overflow-hidden">
                  {stats.profitLoss >= 0 ? (
                    <div
                      className="bg-[#00ff00] flex items-center justify-center text-[10px] font-black transition-all"
                      style={{ width: `${Math.min((stats.totalWon / stats.totalWagered) * 100, 100)}%` }}
                    >
                      +{((stats.profitLoss / stats.totalWagered) * 100).toFixed(0)}%
                    </div>
                  ) : (
                    <div
                      className="bg-[#ff0000] flex items-center justify-center text-[10px] font-black transition-all"
                      style={{ width: `${Math.min(Math.abs((stats.profitLoss / stats.totalWagered) * 100), 100)}%` }}
                    >
                      {((stats.profitLoss / stats.totalWagered) * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rank Badge */}
            <div className="text-center mt-4 pt-4 border-t-2 border-black">
              <p className="text-[10px] font-black uppercase text-gray-600 mb-2">RANG</p>
              <div className="inline-block bg-gradient-to-r from-[#ffff00] to-[#ff8800] border-2 border-black px-4 py-2">
                <p className="text-2xl font-black">
                  {stats.winRate >= 70 ? '🏆 LÉGENDE' :
                   stats.winRate >= 60 ? '💎 EXPERT' :
                   stats.winRate >= 50 ? '⭐ PRO' :
                   stats.winRate >= 40 ? '🎯 INTERMÉDIAIRE' :
                   '🔰 DÉBUTANT'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-[#c0c0c0] border-t-2 border-white px-2 py-1 flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-600">Mis à jour: {new Date().toLocaleTimeString()}</span>
        <span className="text-[10px] font-bold text-gray-600">User ID: {userId.slice(0, 8)}...</span>
      </div>
    </div>
  );
}
