import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/feature/Header';

interface LeaderboardEntry {
  userId: string;
  username: string;
  totalBets: number;
  totalWagered: number;
  totalWon: number;
  netProfit: number;
  winRate: number;
  rank: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'all' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'profit' | 'winRate' | 'totalBets'>('profit');

  useEffect(() => {
    loadLeaderboard();

    // 🔴 REALTIME: Subscribe to bets changes
    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bets'
        },
        () => {
          // Reload leaderboard when new bets are placed
          loadLeaderboard();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'markets'
        },
        () => {
          // Reload when markets are resolved
          loadLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [timeframe]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      // Calculate date filter based on timeframe
      let dateFilter = '';
      if (timeframe === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = weekAgo.toISOString();
      } else if (timeframe === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = monthAgo.toISOString();
      }

      // Get all bets with market results and user info
      let query = supabase
        .from('bets')
        .select(`
          user_id,
          amount,
          bet_type,
          created_at,
          markets (
            status,
            result,
            yes_pool,
            no_pool
          )
        `);

      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }

      const { data: bets, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Get all unique user IDs
      const userIds = [...new Set(bets?.map((bet: any) => bet.user_id) || [])];

      // Fetch usernames for all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching users:', usersError);
      }

      // Create a map of user IDs to usernames
      const usernameMap = new Map(
        users?.map((u: any) => [u.id, u.username || 'Unknown']) || []
      );

      const calculateLeaderboard = () => {
        const userStats = new Map<string, {
          username: string;
          totalBets: number;
          totalWagered: number;
          wins: number;
          profit: number;
        }>();

        bets?.forEach((bet: any) => {
          const existing = userStats.get(bet.user_id) || {
            username: usernameMap.get(bet.user_id) || 'Unknown',
            totalBets: 0,
            totalWagered: 0,
            wins: 0,
            profit: 0
          };

          existing.totalBets++;
          existing.totalWagered += parseFloat(bet.amount);

          const market = bet.markets;
          if (market && market.status === 'resolved' && market.result) {
            const yesPool = parseFloat(market.yes_pool);
            const noPool = parseFloat(market.no_pool);
            const totalPool = yesPool + noPool;
            const betAmount = parseFloat(bet.amount);

            if (market.result === bet.bet_type) {
              existing.wins++;
              // Calculate actual profit based on pool ratios
              const winningPool = bet.bet_type === 'yes' ? yesPool : noPool;
              if (winningPool > 0) {
                const payout = (totalPool / winningPool) * betAmount;
                const profit = payout - betAmount;
                existing.profit += profit;
              }
            } else {
              existing.profit -= betAmount;
            }
          }

          userStats.set(bet.user_id, existing);
        });

        return Array.from(userStats.entries())
          .map(([userId, user]) => ({
            userId,
            ...user,
            winRate: user.totalBets > 0 ? Math.round((user.wins / user.totalBets) * 100) : 0
          }))
          .sort((a, b) => {
            if (sortBy === 'profit') return b.profit - a.profit;
            if (sortBy === 'winRate') return b.winRate - a.winRate;
            return b.totalBets - a.totalBets;
          });
      };

      // Convert to array and calculate derived stats
      const leaderboardData: LeaderboardEntry[] = calculateLeaderboard()
        .map((entry, index) => ({
          userId: entry.userId,
          username: entry.username,
          totalBets: entry.totalBets,
          totalWagered: entry.totalWagered,
          totalWon: entry.wins,
          netProfit: entry.profit,
          winRate: entry.winRate,
          rank: index + 1
        }));

      setLeaderboard(leaderboardData);
    } catch (error: any) {
      console.error('Error loading leaderboard:', error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-600';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#ffcc00] font-mono mb-2">
            🏆 LEADERBOARD
          </h1>
          <p className="text-white/60 font-mono text-sm sm:text-base">WHO&apos;S THE BIGGEST DEGEN?</p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setTimeframe('all')}
            className={`px-4 sm:px-6 py-2 font-black text-xs uppercase font-mono transition-all whitespace-nowrap cursor-pointer border-2 ${
              timeframe === 'all'
                ? 'bg-[#ffcc00] text-black border-[#ffcc00]'
                : 'bg-black text-white border-white hover:bg-white hover:text-black'
            }`}
          >
            ALL TIME
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-4 sm:px-6 py-2 font-black text-xs uppercase font-mono transition-all whitespace-nowrap cursor-pointer border-2 ${
              timeframe === 'month'
                ? 'bg-[#ffcc00] text-black border-[#ffcc00]'
                : 'bg-black text-white border-white hover:bg-white hover:text-black'
            }`}
          >
            THIS MONTH
          </button>
          <button
            onClick={() => setTimeframe('week')}
            className={`px-4 sm:px-6 py-2 font-black text-xs uppercase font-mono transition-all whitespace-nowrap cursor-pointer border-2 ${
              timeframe === 'week'
                ? 'bg-[#ffcc00] text-black border-[#ffcc00]'
                : 'bg-black text-white border-white hover:bg-white hover:text-black'
            }`}
          >
            THIS WEEK
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#ffcc00] border-t-transparent"></div>
          </div>
        )}

        {/* Leaderboard Table */}
        {!loading && leaderboard.length > 0 && (
          <div className="border-4 border-white bg-black overflow-hidden">
            {/* Top 3 Podium */}
            <div className="bg-[#ffcc00] p-4 sm:p-8 border-b-4 border-white">
              <div className="flex flex-col sm:flex-row justify-center items-end gap-4 max-w-3xl mx-auto">
                {/* 2nd Place */}
                {leaderboard[1] && (
                  <div className="flex-1 w-full text-center">
                    <div className="bg-black border-4 border-white p-4 sm:p-6 transform hover:scale-105 transition-transform cursor-pointer">
                      <div className="text-3xl sm:text-4xl mb-2">🥈</div>
                      <div className="text-white font-black text-base sm:text-lg mb-1 font-mono truncate">{leaderboard[1].username}</div>
                      <div className="text-[#ffcc00] text-xl sm:text-2xl font-black font-mono">
                        {leaderboard[1].netProfit >= 0 ? '+' : ''}{leaderboard[1].netProfit.toFixed(2)} SOL
                      </div>
                      <div className="text-white/70 text-xs sm:text-sm mt-2 font-mono">
                        {leaderboard[1].winRate.toFixed(1)}% WIN
                      </div>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {leaderboard[0] && (
                  <div className="flex-1 w-full text-center">
                    <div className="bg-black border-4 border-white p-6 sm:p-8 transform hover:scale-105 transition-transform cursor-pointer">
                      <div className="text-4xl sm:text-5xl mb-2">🥇</div>
                      <div className="text-white font-black text-lg sm:text-xl mb-1 font-mono truncate">{leaderboard[0].username}</div>
                      <div className="text-[#ffcc00] text-2xl sm:text-3xl font-black font-mono">
                        {leaderboard[0].netProfit >= 0 ? '+' : ''}{leaderboard[0].netProfit.toFixed(2)} SOL
                      </div>
                      <div className="text-white/80 text-xs sm:text-sm mt-2 font-mono">
                        {leaderboard[0].winRate.toFixed(1)}% WIN
                      </div>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {leaderboard[2] && (
                  <div className="flex-1 w-full text-center">
                    <div className="bg-black border-4 border-white p-4 sm:p-6 transform hover:scale-105 transition-transform cursor-pointer">
                      <div className="text-3xl sm:text-4xl mb-2">🥉</div>
                      <div className="text-white font-black text-base sm:text-lg mb-1 font-mono truncate">{leaderboard[2].username}</div>
                      <div className="text-[#ffcc00] text-xl sm:text-2xl font-black font-mono">
                        {leaderboard[2].netProfit >= 0 ? '+' : ''}{leaderboard[2].netProfit.toFixed(2)} SOL
                      </div>
                      <div className="text-white/70 text-xs sm:text-sm mt-2 font-mono">
                        {leaderboard[2].winRate.toFixed(1)}% WIN
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rest of Leaderboard */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-white border-b-4 border-white">
                  <tr>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-black text-black uppercase tracking-wider font-mono">
                      RANK
                    </th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-black text-black uppercase tracking-wider font-mono">
                      TRADER
                    </th>
                    <th className="px-3 sm:px-6 py-4 text-right text-xs font-black text-black uppercase tracking-wider font-mono">
                      PROFIT
                    </th>
                    <th className="hidden sm:table-cell px-3 sm:px-6 py-4 text-right text-xs font-black text-black uppercase tracking-wider font-mono">
                      BETS
                    </th>
                    <th className="px-3 sm:px-6 py-4 text-right text-xs font-black text-black uppercase tracking-wider font-mono">
                      WIN%
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-4 text-right text-xs font-black text-black uppercase tracking-wider font-mono">
                      WAGERED
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-white">
                  {leaderboard.map((entry) => (
                    <tr
                      key={entry.userId}
                      className={`hover:bg-white/10 transition-colors ${
                        entry.userId === user?.id ? 'bg-[#ffcc00]/20' : ''
                      }`}
                    >
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`text-base sm:text-lg font-black font-mono ${getRankColor(entry.rank)}`}>
                          {getRankEmoji(entry.rank)}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-white bg-[#ffcc00] flex items-center justify-center text-black font-black font-mono text-xs sm:text-base">
                            {entry.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-black text-white font-mono text-sm sm:text-base truncate max-w-[100px] sm:max-w-none">
                            {entry.username}
                            {entry.userId === user?.id && (
                              <span className="ml-2 text-xs text-[#ffcc00] font-black">(YOU)</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                        <span
                          className={`text-sm sm:text-lg font-black font-mono ${
                            entry.netProfit >= 0 ? 'text-[#00ff00]' : 'text-[#ff0000]'
                          }`}
                        >
                          {entry.netProfit >= 0 ? '+' : ''}{entry.netProfit.toFixed(2)}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-right text-white font-black font-mono">
                        {entry.totalBets}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-white font-black font-mono text-sm sm:text-base">{entry.winRate.toFixed(1)}%</span>
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-right text-white/60 font-mono text-sm">
                        {entry.totalWagered.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && leaderboard.length === 0 && (
          <div className="border-4 border-white bg-black p-8 sm:p-12 text-center">
            <div className="text-4xl sm:text-6xl mb-4">📊</div>
            <h3 className="text-xl sm:text-2xl font-black text-[#ffcc00] mb-2 font-mono">NO DATA YET</h3>
            <p className="text-white/60 mb-6 font-mono text-sm sm:text-base">
              BE THE FIRST DEGEN TO PLACE A BET!
            </p>
            <button
              onClick={() => window.REACT_APP_NAVIGATE('/home')}
              className="px-6 py-3 bg-[#ffcc00] text-black font-black uppercase hover:bg-white transition-all whitespace-nowrap cursor-pointer font-mono border-2 border-[#ffcc00] text-sm sm:text-base"
            >
              &gt;&gt; BROWSE MARKETS
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
