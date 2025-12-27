import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../../components/feature/Header';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: number;
  category: 'bets' | 'wins' | 'profit' | 'streak' | 'special';
  unlocked: boolean;
  progress: number;
  unlockedAt?: string;
}

export default function AchievementsPage() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (user) {
      loadAchievements();
    }
  }, [user]);

  const loadAchievements = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's bets
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select(`
          *,
          markets (
            status,
            result,
            id
          )
        `)
        .eq('user_id', user.id);

      if (betsError) throw betsError;

      // Calculate stats
      const totalBets = bets?.length || 0;
      const totalWagered = bets?.reduce((sum, bet) => sum + parseFloat(bet.amount), 0) || 0;
      
      const resolvedBets = bets?.filter(bet => bet.markets?.status === 'resolved') || [];
      const wins = resolvedBets.filter(bet => bet.bet_type === bet.markets?.result).length;
      const winRate = resolvedBets.length > 0 ? (wins / resolvedBets.length) * 100 : 0;

      // Calculate profit
      let totalProfit = 0;
      resolvedBets.forEach(bet => {
        const amount = parseFloat(bet.amount);
        if (bet.bet_type === bet.markets?.result) {
          totalProfit += amount * 0.8; // Simple profit calculation
        } else {
          totalProfit -= amount;
        }
      });

      // Check if user was first to bet on any market
      let hasEarlyBirdBet = false;
      if (bets && bets.length > 0) {
        // Get all unique market IDs from user's bets
        const marketIds = [...new Set(bets.map(bet => bet.market_id))];
        
        // For each market, check if user's bet was among the first 5
        for (const marketId of marketIds) {
          const { data: marketBets, error: marketBetsError } = await supabase
            .from('bets')
            .select('id, user_id, created_at')
            .eq('market_id', marketId)
            .order('created_at', { ascending: true })
            .limit(5);

          if (!marketBetsError && marketBets) {
            // Check if any of the first 5 bets belong to this user
            if (marketBets.some(bet => bet.user_id === user.id)) {
              hasEarlyBirdBet = true;
              break;
            }
          }
        }
      }

      // Define all achievements
      const allAchievements: Achievement[] = [
        // Bets Category
        {
          id: 'first_bet',
          title: 'FIRST BLOOD',
          description: 'Place your first bet',
          icon: '🎯',
          requirement: 1,
          category: 'bets',
          unlocked: totalBets >= 1,
          progress: Math.min(totalBets, 1),
          unlockedAt: totalBets >= 1 ? bets?.[0]?.created_at : undefined
        },
        {
          id: 'degen_10',
          title: 'DEGEN APPRENTICE',
          description: 'Place 10 bets',
          icon: '🎲',
          requirement: 10,
          category: 'bets',
          unlocked: totalBets >= 10,
          progress: Math.min(totalBets, 10)
        },
        {
          id: 'degen_50',
          title: 'DEGEN MASTER',
          description: 'Place 50 bets',
          icon: '🔥',
          requirement: 50,
          category: 'bets',
          unlocked: totalBets >= 50,
          progress: Math.min(totalBets, 50)
        },
        {
          id: 'degen_100',
          title: 'DEGEN LEGEND',
          description: 'Place 100 bets',
          icon: '👑',
          requirement: 100,
          category: 'bets',
          unlocked: totalBets >= 100,
          progress: Math.min(totalBets, 100)
        },

        // Wins Category
        {
          id: 'first_win',
          title: 'LUCKY STRIKE',
          description: 'Win your first bet',
          icon: '✨',
          requirement: 1,
          category: 'wins',
          unlocked: wins >= 1,
          progress: Math.min(wins, 1)
        },
        {
          id: 'win_10',
          title: 'WINNING STREAK',
          description: 'Win 10 bets',
          icon: '🌟',
          requirement: 10,
          category: 'wins',
          unlocked: wins >= 10,
          progress: Math.min(wins, 10)
        },
        {
          id: 'win_rate_70',
          title: 'SHARP SHOOTER',
          description: 'Achieve 70% win rate (min 20 bets)',
          icon: '🎯',
          requirement: 70,
          category: 'wins',
          unlocked: resolvedBets.length >= 20 && winRate >= 70,
          progress: Math.min(winRate, 70)
        },

        // Profit Category
        {
          id: 'profit_10',
          title: 'PROFIT MAKER',
          description: 'Earn 10 SOL profit',
          icon: '💰',
          requirement: 10,
          category: 'profit',
          unlocked: totalProfit >= 10,
          progress: Math.min(totalProfit, 10)
        },
        {
          id: 'profit_50',
          title: 'WHALE ALERT',
          description: 'Earn 50 SOL profit',
          icon: '🐋',
          requirement: 50,
          category: 'profit',
          unlocked: totalProfit >= 50,
          progress: Math.min(totalProfit, 50)
        },
        {
          id: 'profit_100',
          title: 'DEGEN MILLIONAIRE',
          description: 'Earn 100 SOL profit',
          icon: '💎',
          requirement: 100,
          category: 'profit',
          unlocked: totalProfit >= 100,
          progress: Math.min(totalProfit, 100)
        },

        // Special Category
        {
          id: 'big_bet',
          title: 'HIGH ROLLER',
          description: 'Place a bet of 10+ SOL',
          icon: '🎰',
          requirement: 10,
          category: 'special',
          unlocked: bets?.some(bet => parseFloat(bet.amount) >= 10) || false,
          progress: Math.max(...(bets?.map(bet => parseFloat(bet.amount)) || [0]))
        },
        {
          id: 'early_bird',
          title: 'EARLY BIRD',
          description: 'Be among the first 5 to bet on a market',
          icon: '🐦',
          requirement: 1,
          category: 'special',
          unlocked: hasEarlyBirdBet,
          progress: hasEarlyBirdBet ? 1 : 0
        },
        {
          id: 'night_owl',
          title: 'NIGHT OWL',
          description: 'Place a bet between 2-5 AM',
          icon: '🦉',
          requirement: 1,
          category: 'special',
          unlocked: bets?.some(bet => {
            const hour = new Date(bet.created_at).getHours();
            return hour >= 2 && hour < 5;
          }) || false,
          progress: bets?.some(bet => {
            const hour = new Date(bet.created_at).getHours();
            return hour >= 2 && hour < 5;
          }) ? 1 : 0
        }
      ];

      setAchievements(allAchievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = achievements.filter(achievement => {
    if (filter === 'unlocked') return achievement.unlocked;
    if (filter === 'locked') return !achievement.unlocked;
    return true;
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const completionRate = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'bets': return 'bg-[#ffcc00]';
      case 'wins': return 'bg-[#00ff00]';
      case 'profit': return 'bg-[#ff00ff]';
      case 'streak': return 'bg-[#00ffff]';
      case 'special': return 'bg-[#ff6600]';
      default: return 'bg-white';
    }
  };

  // Carousel navigation
  const itemsPerPage = 6;
  const maxIndex = Math.max(0, Math.ceil(filteredAchievements.length / itemsPerPage) - 1);
  
  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  const visibleAchievements = filteredAchievements.slice(
    currentIndex * itemsPerPage,
    (currentIndex + 1) * itemsPerPage
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <p className="text-white font-mono">Please login to view achievements</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black text-[#ffcc00] font-mono mb-3">
            💎 ACHIEVEMENTS
          </h1>
          <p className="text-white/60 font-mono text-lg">COLLECT THEM ALL, DEGEN!</p>
        </div>

        {/* Stats Overview */}
        <div className="border-4 border-[#ffcc00] bg-black p-8 mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/60 text-sm font-mono mb-2 uppercase">Completion</p>
              <p className="text-5xl font-black text-[#ffcc00] font-mono">
                {unlockedCount}/{totalCount}
              </p>
            </div>
            <div className="text-7xl">{completionRate === 100 ? '🏆' : '💎'}</div>
          </div>
          <div className="w-full bg-white/10 h-6 border-2 border-[#ffcc00] overflow-hidden">
            <div 
              className="h-full bg-[#ffcc00] transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
          <p className="text-center text-[#ffcc00] font-mono mt-3 text-lg font-black">
            {completionRate.toFixed(1)}% COMPLETE
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-center gap-3 mb-12">
          <button
            onClick={() => { setFilter('all'); setCurrentIndex(0); }}
            className={`px-8 py-3 font-black text-sm uppercase font-mono transition-all whitespace-nowrap cursor-pointer border-2 ${
              filter === 'all'
                ? 'bg-[#ffcc00] text-black border-[#ffcc00]'
                : 'bg-black text-white border-white hover:bg-white hover:text-black'
            }`}
          >
            ALL ({totalCount})
          </button>
          <button
            onClick={() => { setFilter('unlocked'); setCurrentIndex(0); }}
            className={`px-8 py-3 font-black text-sm uppercase font-mono transition-all whitespace-nowrap cursor-pointer border-2 ${
              filter === 'unlocked'
                ? 'bg-[#ffcc00] text-black border-[#ffcc00]'
                : 'bg-black text-white border-white hover:bg-white hover:text-black'
            }`}
          >
            UNLOCKED ({unlockedCount})
          </button>
          <button
            onClick={() => { setFilter('locked'); setCurrentIndex(0); }}
            className={`px-8 py-3 font-black text-sm uppercase font-mono transition-all whitespace-nowrap cursor-pointer border-2 ${
              filter === 'locked'
                ? 'bg-[#ffcc00] text-black border-[#ffcc00]'
                : 'bg-black text-white border-white hover:bg-white hover:text-black'
            }`}
          >
            LOCKED ({totalCount - unlockedCount})
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#ffcc00] border-t-transparent"></div>
          </div>
        )}

        {/* Achievements Carousel */}
        {!loading && filteredAchievements.length > 0 && (
          <div className="relative">
            {/* Navigation Arrows */}
            {filteredAchievements.length > itemsPerPage && (
              <>
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 z-10 w-12 h-12 flex items-center justify-center border-4 font-black text-2xl transition-all ${
                    currentIndex === 0
                      ? 'bg-black/50 border-white/30 text-white/30 cursor-not-allowed'
                      : 'bg-black border-[#ffcc00] text-[#ffcc00] hover:bg-[#ffcc00] hover:text-black cursor-pointer'
                  }`}
                >
                  &lt;
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === maxIndex}
                  className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 z-10 w-12 h-12 flex items-center justify-center border-4 font-black text-2xl transition-all ${
                    currentIndex === maxIndex
                      ? 'bg-black/50 border-white/30 text-white/30 cursor-not-allowed'
                      : 'bg-black border-[#ffcc00] text-[#ffcc00] hover:bg-[#ffcc00] hover:text-black cursor-pointer'
                  }`}
                >
                  &gt;
                </button>
              </>
            )}

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`border-4 p-6 transition-all hover:scale-105 cursor-pointer ${
                    achievement.unlocked 
                      ? 'border-[#00ff00] bg-black' 
                      : 'border-white/30 bg-black/50 opacity-70'
                  }`}
                >
                  {/* Icon & Category */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`text-6xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                      {achievement.icon}
                    </div>
                    <div className={`px-3 py-1 ${getCategoryColor(achievement.category)} border-2 border-black`}>
                      <span className="text-black text-xs font-black font-mono uppercase">
                        {achievement.category}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-black text-white font-mono mb-3">
                    {achievement.title}
                  </h3>
                  <p className="text-white/60 text-sm font-mono mb-4 leading-relaxed">
                    {achievement.description}
                  </p>

                  {/* Progress Bar */}
                  {!achievement.unlocked && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs font-mono text-white/60 mb-2">
                        <span>PROGRESS</span>
                        <span className="font-black">{achievement.progress.toFixed(0)}/{achievement.requirement}</span>
                      </div>
                      <div className="w-full bg-white/10 h-3 border-2 border-white/30 overflow-hidden">
                        <div 
                          className="h-full bg-[#ffcc00] transition-all duration-500"
                          style={{ width: `${(achievement.progress / achievement.requirement) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Unlocked Badge */}
                  {achievement.unlocked && (
                    <div className="bg-[#00ff00] border-2 border-black px-4 py-2 inline-block">
                      <span className="text-black text-sm font-black font-mono">
                        ✅ UNLOCKED
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Page Indicator */}
            {filteredAchievements.length > itemsPerPage && (
              <div className="flex justify-center items-center gap-2 mt-8">
                {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-3 h-3 border-2 transition-all cursor-pointer ${
                      idx === currentIndex
                        ? 'bg-[#ffcc00] border-[#ffcc00] w-8'
                        : 'bg-black border-white hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredAchievements.length === 0 && (
          <div className="border-4 border-white bg-black p-16 text-center">
            <div className="text-8xl mb-6">🔒</div>
            <h3 className="text-3xl font-black text-[#ffcc00] mb-4 font-mono">
              NO ACHIEVEMENTS YET
            </h3>
            <p className="text-white/60 mb-8 font-mono text-lg">
              START BETTING TO UNLOCK BADGES!
            </p>
            <button
              onClick={() => window.REACT_APP_NAVIGATE('/home')}
              className="px-8 py-4 bg-[#ffcc00] text-black font-black uppercase hover:bg-white transition-all whitespace-nowrap cursor-pointer font-mono border-4 border-[#ffcc00] text-lg"
            >
              &gt;&gt; BROWSE MARKETS
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
