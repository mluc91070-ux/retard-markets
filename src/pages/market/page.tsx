import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMarketById } from '../../utils/marketStorage';
import { Market } from '../../types/market';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import { supabase } from '../../lib/supabase';

export default function MarketPage() {
  const { id } = useParams<{ id: string }>();
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [betAmount, setBetAmount] = useState('');
  const [selectedBet, setSelectedBet] = useState<'yes' | 'no' | null>(null);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, updateBalance, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      window.REACT_APP_NAVIGATE('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (id) {
      loadMarket();
    }
  }, [id]);

  // Real-time subscription for market updates
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`market-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'markets',
          filter: `id=eq.${id}`
        },
        (payload) => {
          if (payload.new) {
            const updatedMarket = payload.new as any;
            setMarket({
              id: updatedMarket.id,
              title: updatedMarket.title,
              description: updatedMarket.description,
              category: updatedMarket.category,
              endDate: updatedMarket.end_date,
              createdBy: updatedMarket.created_by,
              createdAt: updatedMarket.created_at,
              yesPool: parseFloat(updatedMarket.yes_pool),
              noPool: parseFloat(updatedMarket.no_pool),
              totalPool: parseFloat(updatedMarket.total_pool),
              status: updatedMarket.status
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const loadMarket = async () => {
    if (id) {
      setLoading(true);
      const foundMarket = await getMarketById(id);
      if (foundMarket) {
        setMarket(foundMarket);
      }
      setLoading(false);
    }
  };

  const handleBet = async () => {
    if (!user || !market || !selectedBet) {
      setError('Please select YES or NO');
      return;
    }

    const amount = parseFloat(betAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setError('Enter valid amount');
      return;
    }

    if (amount > user.balance) {
      setError('Insufficient balance');
      return;
    }

    setIsPlacingBet(true);
    setError('');
    setSuccess('');

    try {
      // Get fresh session with retry logic
      let accessToken: string | null = null;
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount < maxRetries) {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          // Try to refresh the session
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshedSession) {
            if (retryCount === maxRetries - 1) {
              setError('Session expired. Redirecting to login...');
              setIsPlacingBet(false);
              setTimeout(() => {
                window.REACT_APP_NAVIGATE('/login');
              }, 2000);
              return;
            }
            retryCount++;
            continue;
          }
          
          accessToken = refreshedSession.access_token;
          break;
        } else {
          accessToken = session.access_token;
          break;
        }
      }

      if (!accessToken) {
        setError('Authentication failed. Please login again.');
        setIsPlacingBet(false);
        setTimeout(() => {
          window.REACT_APP_NAVIGATE('/login');
        }, 2000);
        return;
      }

      // Call secure Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/place-bet`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            marketId: market.id,
            betType: selectedBet,
            amount: amount,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        // If token is still invalid after refresh, redirect to login
        if (result.error && result.error.includes('token')) {
          setError('Session expired. Please login again.');
          setTimeout(() => {
            window.REACT_APP_NAVIGATE('/login');
          }, 2000);
          return;
        }
        throw new Error(result.error || 'Failed to place bet');
      }

      // Update local user balance
      await updateBalance(result.newBalance);
      
      // Update local market state (will also be updated via real-time subscription)
      setMarket({
        ...market,
        yesPool: result.market.yesPool,
        noPool: result.market.noPool,
        totalPool: result.market.totalPool
      });

      setSuccess(`Bet placed! ${amount} SOL on ${selectedBet.toUpperCase()}`);
      setBetAmount('');
      setSelectedBet(null);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to place bet');
      console.error('Bet error:', err);
    } finally {
      setIsPlacingBet(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-2xl font-bold text-[#00ff00]">LOADING...</p>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-2xl font-bold text-gray-600">Market not found</p>
        </div>
      </div>
    );
  }

  const yesPercentage = market.totalPool > 0 
    ? Math.round((market.yesPool / market.totalPool) * 100) 
    : 50;
  const noPercentage = 100 - yesPercentage;

  const categoryEmoji = {
    memecoin: '🪙',
    drama: '🎭',
    X: '🐦',
    chaos: '💥'
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Matrix rain effect */}
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(#00ff00 1px, transparent 1px), linear-gradient(90deg, #00ff00 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>

      <Header />
      
      <div className="max-w-5xl mx-auto px-4 py-12 relative z-10">
        {/* Back button - Terminal style */}
        <button
          onClick={() => window.REACT_APP_NAVIGATE('/')}
          className="mb-8 px-6 py-3 bg-black border-2 border-[#00ff00] text-[#00ff00] text-xs font-black uppercase hover:bg-[#00ff00] hover:text-black transition-all cursor-pointer whitespace-nowrap"
        >
          &lt; Back to Markets
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Market Info - Windows 98 style */}
          <div className="lg:col-span-2">
            <div className="border-4 border-white bg-[#c0c0c0] mb-6">
              <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1 flex items-center justify-between">
                <span className="text-white text-xs font-bold">
                  {categoryEmoji[market.category as keyof typeof categoryEmoji]} {market.category.toUpperCase()}
                </span>
                <div className="flex gap-1">
                  <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px]">_</div>
                  <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px]">□</div>
                  <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px]">×</div>
                </div>
              </div>

              <div className="p-6 bg-white text-black">
                <p className="text-xs font-black text-gray-600 uppercase mb-3">
                  Created by @{market.createdBy}
                </p>

                <h1 className="text-2xl md:text-3xl font-black mb-4 leading-tight">
                  {market.title}
                </h1>

                <p className="text-sm font-medium mb-6 leading-relaxed">
                  {market.description}
                </p>

                {/* Pool Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-[#c0c0c0] border-2 border-black p-3 text-center">
                    <p className="text-[10px] font-black uppercase mb-1">Total Pool</p>
                    <p className="text-2xl font-black text-[#00ff00]">{market.totalPool.toFixed(2)}</p>
                    <p className="text-[10px] font-bold">SOL</p>
                  </div>
                  <div className="bg-[#c0c0c0] border-2 border-black p-3 text-center">
                    <p className="text-[10px] font-black uppercase mb-1">YES Pool</p>
                    <p className="text-2xl font-black text-[#00ff00]">{market.yesPool.toFixed(2)}</p>
                    <p className="text-[10px] font-bold">SOL</p>
                  </div>
                  <div className="bg-[#c0c0c0] border-2 border-black p-3 text-center">
                    <p className="text-[10px] font-black uppercase mb-1">NO Pool</p>
                    <p className="text-2xl font-black text-[#ff0000]">{market.noPool.toFixed(2)}</p>
                    <p className="text-[10px] font-bold">SOL</p>
                  </div>
                </div>

                {/* Odds Display */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-black text-[#00ff00]">YES {yesPercentage}%</span>
                    <span className="text-lg font-black text-[#ff0000]">NO {noPercentage}%</span>
                  </div>
                  <div className="flex h-6 bg-[#c0c0c0] border-2 border-black overflow-hidden">
                    <div 
                      className="bg-[#00ff00] transition-all duration-500 flex items-center justify-center text-xs font-black text-black"
                      style={{ width: `${yesPercentage}%` }}
                    >
                      {yesPercentage > 15 && 'YES'}
                    </div>
                    <div 
                      className="bg-[#ff0000] transition-all duration-500 flex items-center justify-center text-xs font-black text-white"
                      style={{ width: `${noPercentage}%` }}
                    >
                      {noPercentage > 15 && 'NO'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                  <span>👥 {Math.floor(Math.random() * 50) + 10} participants</span>
                  <span>⏰ Ends: {new Date(market.endDate).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bet Panel - Windows 98 style */}
          <div className="lg:col-span-1">
            <div className="border-4 border-white bg-[#c0c0c0] sticky top-24">
              <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1 flex items-center justify-between">
                <span className="text-white text-xs font-bold">✨ PLACE YOUR BET</span>
                <div className="flex gap-1">
                  <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px]">_</div>
                  <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px]">□</div>
                  <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px]">×</div>
                </div>
              </div>

              <div className="p-4 bg-white text-black">
                {/* YES/NO Toggle */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    onClick={() => setSelectedBet('yes')}
                    className={`py-3 font-black text-sm uppercase border-2 border-black transition-all whitespace-nowrap cursor-pointer ${
                      selectedBet === 'yes'
                        ? 'bg-[#00ff00] text-black'
                        : 'bg-white text-black hover:bg-[#c0c0c0]'
                    }`}
                  >
                    ✅ YES
                  </button>
                  <button
                    onClick={() => setSelectedBet('no')}
                    className={`py-3 font-black text-sm uppercase border-2 border-black transition-all whitespace-nowrap cursor-pointer ${
                      selectedBet === 'no'
                        ? 'bg-[#ff0000] text-white'
                        : 'bg-white text-black hover:bg-[#c0c0c0]'
                    }`}
                  >
                    ❌ NO
                  </button>
                </div>

                {/* Amount Input */}
                <div className="mb-4">
                  <label className="block text-xs font-black uppercase mb-2">
                    Amount (SOL)
                  </label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full bg-white border-2 border-black px-3 py-3 text-xl font-black focus:outline-none text-center"
                  />
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[0.5, 1, 5, 10].map(val => (
                    <button
                      key={val}
                      onClick={() => setBetAmount(val.toString())}
                      className="py-2 bg-white border-2 border-black text-xs font-black uppercase hover:bg-[#c0c0c0] transition-all cursor-pointer whitespace-nowrap"
                    >
                      {val}
                    </button>
                  ))}
                </div>

                {error && (
                  <div className="mb-3 p-2 bg-[#ff0000] border-2 border-black text-white text-xs font-black">
                    ⚠️ {error}
                  </div>
                )}

                {success && (
                  <div className="mb-3 p-2 bg-[#00ff00] border-2 border-black text-black text-xs font-black">
                    ✅ {success}
                  </div>
                )}

                <button
                  onClick={handleBet}
                  disabled={!user || isPlacingBet}
                  className="w-full bg-[#00ff00] text-black border-4 border-black py-4 font-black text-lg uppercase hover:bg-[#ffff00] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlacingBet ? '⏳ PLACING...' : '🎯 Confirm Bet'}
                </button>

                {!user && (
                  <p className="text-center text-xs font-bold mt-3">
                    <button
                      onClick={() => window.REACT_APP_NAVIGATE('/login')}
                      className="text-black underline cursor-pointer whitespace-nowrap"
                    >
                      Login to bet
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
