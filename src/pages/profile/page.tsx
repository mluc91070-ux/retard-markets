import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import ShareModal from '../../components/feature/ShareModal';
import { calculateBetProfit } from '../../utils/profitCalculator';
import ConfirmModal from '../../components/feature/ConfirmModal';
import UserStats from '../../components/feature/UserStats';

interface Bet {
  id: string;
  market_id: string;
  user_id: string;
  bet_type: 'yes' | 'no';
  amount: number;
  created_at: string;
  market_title: string;
  market_status: string;
  market_result: string | null;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadUserBets();

    // 🔴 REALTIME: Subscribe to user's bets changes
    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bets',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Reload bets when user places a new bet
          loadUserBets();
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
          // Reload when markets are resolved (affects bet results)
          loadUserBets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const loadUserBets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bets')
        .select(`
          *,
          markets (
            title,
            status,
            result,
            yes_pool,
            no_pool
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedBets = data?.map((bet: any) => ({
        id: bet.id,
        market_id: bet.market_id,
        user_id: bet.user_id,
        bet_type: bet.bet_type,
        amount: bet.amount,
        created_at: bet.created_at,
        market_title: bet.markets?.title || 'Unknown Market',
        market_status: bet.markets?.status || 'active',
        market_result: bet.markets?.result || null
      })) || [];

      setBets(formattedBets);
    } catch (error) {
      console.error('Error loading bets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Calculate stats
  const stats = {
    totalBets: bets.length,
    wins: bets.filter(bet => 
      bet.market_status === 'resolved' && bet.market_result === bet.bet_type
    ).length,
    winRate: bets.length > 0 
      ? Math.round((bets.filter(bet => 
          bet.market_status === 'resolved' && bet.market_result === bet.bet_type
        ).length / bets.filter(bet => bet.market_status === 'resolved').length) * 100) || 0
      : 0,
    totalProfit: bets.reduce((sum, bet) => {
      if (bet.market_status === 'resolved') {
        if (bet.market_result === bet.bet_type) {
          return sum + bet.amount; // Simplified: won double
        } else {
          return sum - bet.amount; // Lost the bet
        }
      }
      return sum;
    }, 0)
  };

  // Chart data for last 7 days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayBets = bets.filter(bet => {
      const betDate = new Date(bet.created_at);
      return betDate.toDateString() === date.toDateString();
    });
    
    const dayProfit = dayBets.reduce((sum, bet) => {
      if (bet.market_status === 'resolved') {
        return sum + (bet.market_result === bet.bet_type ? bet.amount : -bet.amount);
      }
      return sum;
    }, 0);

    return {
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      value: dayProfit
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!user ? (
          <div className="text-center py-20">
            <p className="text-lg sm:text-xl text-gray-400 mb-4">Please login to view your profile</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-yellow-400 text-black font-bold border-4 border-black hover:bg-yellow-500 transition-colors whitespace-nowrap"
            >
              LOGIN
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="bg-white border-4 border-black p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4">
                <div className="w-full sm:w-auto">
                  <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2 break-words">@{user.username}</h1>
                  <p className="text-gray-600 text-sm sm:text-base break-all">{user.email}</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Member since {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-yellow-400 text-black font-bold border-4 border-black hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2 whitespace-nowrap text-sm sm:text-base"
                >
                  <i className="ri-share-line"></i>
                  SHARE MY STATS
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-yellow-400 border-4 border-black p-3 sm:p-4">
                  <div className="text-xs sm:text-sm font-bold text-black mb-1">BALANCE</div>
                  <div className="text-xl sm:text-2xl font-bold text-black">{user.balance.toFixed(2)}</div>
                  <div className="text-xs font-bold text-black">SOL</div>
                </div>
                <div className="bg-green-400 border-4 border-black p-3 sm:p-4">
                  <div className="text-xs sm:text-sm font-bold text-black mb-1">BETS</div>
                  <div className="text-xl sm:text-2xl font-bold text-black">{stats.totalBets}</div>
                </div>
                <div className="bg-blue-400 border-4 border-black p-3 sm:p-4">
                  <div className="text-xs sm:text-sm font-bold text-black mb-1">WINS</div>
                  <div className="text-xl sm:text-2xl font-bold text-black">{stats.wins}</div>
                </div>
                <div className="bg-purple-400 border-4 border-black p-3 sm:p-4">
                  <div className="text-xs sm:text-sm font-bold text-black mb-1">WIN RATE</div>
                  <div className="text-xl sm:text-2xl font-bold text-black">{stats.winRate}%</div>
                </div>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-white border-4 border-black p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-black mb-4">PERFORMANCE</h2>
              <div className="h-48 sm:h-64 flex items-end justify-between gap-1 sm:gap-2">
                {chartData.map((data, index) => {
                  const maxValue = Math.max(...chartData.map(d => Math.abs(d.value)), 1);
                  const height = (Math.abs(data.value) / maxValue) * 100;
                  const isPositive = data.value >= 0;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex items-end justify-center h-32 sm:h-48">
                        <div
                          className={`w-full border-2 sm:border-4 border-black transition-all ${
                            isPositive ? 'bg-green-400' : 'bg-red-400'
                          }`}
                          style={{ height: `${height}%`, minHeight: '4px' }}
                        ></div>
                      </div>
                      <div className="text-[10px] sm:text-xs text-black font-bold mt-2">{data.label}</div>
                      <div className={`text-[10px] sm:text-xs font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {data.value > 0 ? '+' : ''}{data.value.toFixed(1)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bet History */}
            <div className="bg-white border-4 border-black p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-black mb-4">BET HISTORY</h2>
              {bets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm sm:text-base">No bets yet</p>
                  <button
                    onClick={() => navigate('/home')}
                    className="mt-4 px-6 py-2 bg-yellow-400 text-black font-bold border-4 border-black hover:bg-yellow-500 transition-colors whitespace-nowrap text-sm sm:text-base"
                  >
                    START BETTING
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {bets.map((bet) => (
                    <div
                      key={bet.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-50 border-2 border-black hover:bg-gray-100 transition-colors cursor-pointer gap-2 sm:gap-0"
                      onClick={() => navigate(`/market/${bet.market_id}`)}
                    >
                      <div className="flex-1 w-full sm:w-auto">
                        <div className="font-bold text-black mb-1 text-sm sm:text-base break-words">{bet.market_title}</div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 flex-wrap">
                          <span className={`px-2 py-1 text-xs font-bold border-2 border-black whitespace-nowrap ${
                            bet.bet_type === 'yes' ? 'bg-green-400' : 'bg-red-400'
                          }`}>
                            {bet.bet_type.toUpperCase()}
                          </span>
                          <span>{new Date(bet.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto">
                        <div className="font-bold text-black text-sm sm:text-base">{bet.amount.toFixed(2)} SOL</div>
                        {bet.market_status === 'resolved' && (
                          <div className={`text-xs sm:text-sm font-bold ${
                            bet.market_result === bet.bet_type ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {bet.market_result === bet.bet_type ? 'WON' : 'LOST'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Stats */}
            <div className="mt-8">
              <UserStats userId={user.id} />
            </div>

            {/* Logout Button */}
            <div className="text-center">
              <button
                onClick={handleLogout}
                className="w-full bg-black text-[#ff0000] border-4 border-[#ff0000] px-6 py-3 font-mono font-bold hover:bg-[#ff0000] hover:text-black transition-colors whitespace-nowrap cursor-pointer text-sm sm:text-base"
              >
                LOGOUT
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && user && (
        <ShareModal
          type="profit"
          data={{
            profit: stats.totalProfit,
            winRate: stats.winRate,
            totalBets: stats.totalBets
          }}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Logout Confirm Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="🚪 LOGOUT"
        message="Are you sure you want to logout?"
        confirmText="YES, LOGOUT"
        cancelText="CANCEL"
        type="danger"
      />
    </div>
  );
}
