import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMarketById } from '../../utils/marketStorage';
import { Market, Bet } from '../../types/market';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import { supabase } from '../../lib/supabase';
import ShareModal from '../../components/feature/ShareModal';
import ConfirmModal from '../../components/feature/ConfirmModal';
import MarketChart from '../../components/feature/MarketChart';

interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  created_at: string;
}

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [betAmount, setBetAmount] = useState('');
  const [selectedBet, setSelectedBet] = useState<'yes' | 'no' | null>(null);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bets, setBets] = useState<Bet[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const { user, updateBalance, loading: authLoading } = useAuth();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState<any>(null);
  const [showBetModal, setShowBetModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Chart data for real-time graph
  const [chartData, setChartData] = useState<{ time: string; yes: number; no: number }[]>([]);

  useEffect(() => {
    if (id) {
      loadMarket();
      loadBets();
      loadChat();
    }
  }, [id]);

  // Real-time subscription for market updates
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`market-detail-${id}`)
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
            const newMarket = {
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
            };
            setMarket(newMarket);
            
            // Update chart data
            const now = new Date().toLocaleTimeString();
            setChartData(prev => [...prev.slice(-9), {
              time: now,
              yes: newMarket.yesPool,
              no: newMarket.noPool
            }]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bets',
          filter: `market_id=eq.${id}`
        },
        () => {
          loadBets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Real-time chat subscription
  useEffect(() => {
    if (!id) return;

    const chatChannel = supabase
      .channel(`chat-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `market_id=eq.${id}`
        },
        (payload) => {
          const newMsg = payload.new as any;
          setChatMessages(prev => [...prev, {
            id: newMsg.id,
            user_id: newMsg.user_id,
            username: newMsg.username,
            message: newMsg.message,
            created_at: newMsg.created_at
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [id]);

  const loadMarket = async () => {
    if (id) {
      setLoading(true);
      const foundMarket = await getMarketById(id);
      if (foundMarket) {
        setMarket(foundMarket);
        // Initialize chart with current data
        const now = new Date().toLocaleTimeString();
        setChartData([{
          time: now,
          yes: foundMarket.yesPool,
          no: foundMarket.noPool
        }]);
      }
      setLoading(false);
    }
  };

  const loadBets = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .eq('market_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data && !error) {
      const formattedBets: Bet[] = data.map((bet: any) => ({
        id: bet.id,
        marketId: bet.market_id,
        userId: bet.user_id,
        username: bet.username,
        position: bet.bet_type,
        amount: parseFloat(bet.amount),
        timestamp: bet.created_at,
        marketTitle: ''
      }));
      setBets(formattedBets);
    }
  };

  const loadChat = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('market_id', id)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data && !error) {
      setChatMessages(data.map((msg: any) => ({
        id: msg.id,
        user_id: msg.user_id,
        username: msg.username,
        message: msg.message,
        created_at: msg.created_at
      })));
    }
  };

  const handleBet = async () => {
    if (!user || !market || !selectedBet) {
      setError('Sélectionne YES ou NO');
      return;
    }

    const amount = parseFloat(betAmount);
    
    // Validation 1: Montant valide
    if (isNaN(amount) || amount <= 0) {
      setError('Montant invalide');
      return;
    }

    // Validation 2: Montant minimum
    if (amount < 0.01) {
      setError('Montant minimum: 0.01 SOL');
      return;
    }

    // Validation 3: Montant maximum
    if (amount > 10000) {
      setError('Montant maximum: 10000 SOL');
      return;
    }

    // Validation 4: Balance suffisante
    if (amount > user.balance) {
      setError(`Balance insuffisante. Tu as ${user.balance.toFixed(2)} SOL`);
      return;
    }

    // Validation 5: Marché actif
    if (market.status !== 'active') {
      setError('Ce marché n\'est plus actif');
      return;
    }

    // Validation 6: Marché non expiré
    const endDate = new Date(market.endDate);
    if (endDate < new Date()) {
      setError('Ce marché est terminé');
      return;
    }

    // Validation 7: Confirmation pour gros paris (>100 SOL)
    if (amount > 100 && !showConfirmModal) {
      setShowConfirmModal(true);
      return;
    }

    setShowConfirmModal(false);
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
              setError('Session expirée. Redirection...');
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
        setError('Authentification échouée. Reconnecte-toi.');
        setIsPlacingBet(false);
        setTimeout(() => {
          window.REACT_APP_NAVIGATE('/login');
        }, 2000);
        return;
      }

      // Use the valid access token
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
        // Handle specific error cases
        if (result.error) {
          if (result.error.includes('token') || result.error.includes('authorization')) {
            setError('Session expirée. Reconnecte-toi.');
            setTimeout(() => {
              window.REACT_APP_NAVIGATE('/login');
            }, 2000);
            return;
          }
          
          if (result.error.includes('balance') || result.error.includes('Insufficient')) {
            setError('Balance insuffisante');
            return;
          }
          
          if (result.error.includes('wait') || result.error.includes('rate')) {
            setError('Attends 2 secondes avant de parier à nouveau');
            return;
          }
          
          if (result.error.includes('active') || result.error.includes('ended')) {
            setError('Ce marché n\'est plus disponible');
            return;
          }
        }
        
        throw new Error(result.error || 'Pari échoué');
      }

      await updateBalance(result.newBalance);
      
      setMarket({
        ...market,
        yesPool: result.market.yesPool,
        noPool: result.market.noPool,
        totalPool: result.market.totalPool
      });

      setSuccess(`✅ Pari placé! ${amount} SOL sur ${selectedBet.toUpperCase()}`);
      setBetAmount('');
      setSelectedBet(null);

      setShareData({
        type: 'market',
        title: market.title,
        marketTitle: market.title
      });
      setShareModalOpen(true);

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Pari échoué. Réessaye.');
      console.error('Bet error:', err);
    } finally {
      setIsPlacingBet(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user) {
      setError('Connecte-toi pour chatter');
      return;
    }

    const trimmedMessage = newMessage.trim();
    
    if (!trimmedMessage) {
      return;
    }

    // Validation: Limite de 500 caractères
    if (trimmedMessage.length > 500) {
      setError('Message trop long. Maximum 500 caractères.');
      return;
    }

    setIsSendingMessage(true);

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          market_id: id,
          user_id: user.id,
          username: user.username,
          message: trimmedMessage
        });

      if (error) throw error;

      setNewMessage('');
    } catch (err) {
      console.error('Chat error:', err);
      setError('Erreur d\'envoi du message');
    } finally {
      setIsSendingMessage(false);
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

  const maxPoolValue = Math.max(...chartData.map(d => Math.max(d.yes, d.no)), 1);

  return (
    <div className="min-h-screen bg-black text-white relative">
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(#00ff00 1px, transparent 1px), linear-gradient(90deg, #00ff00 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>

      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
        <button
          onClick={() => window.REACT_APP_NAVIGATE('/')}
          className="mb-8 px-6 py-3 bg-black border-2 border-[#00ff00] text-[#00ff00] text-xs font-black uppercase hover:bg-[#00ff00] hover:text-black transition-all cursor-pointer whitespace-nowrap"
        >
          &lt; Back to Markets
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Market Info + Chart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Info */}
            <div className="border-4 border-white bg-[#c0c0c0]">
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

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-[#c0c0c0] border-2 border-black p-3 text-center">
                    <p className="text-[10px] font-black uppercase mb-1">Total Pool</p>
                    <p className="text-2xl font-black text-[#00ff00]">{market.totalPool.toFixed(2)}</p>
                    <p className="text-[10px] font-bold">SOL</p>
                  </div>
                  <div className="bg-[#c0c0c0] border-2 border-black p-3 text-center">
                    <p className="text-[10px] font-black uppercase mb-1">Yes Pool</p>
                    <p className="text-2xl font-black text-[#00ff00]">{market.yesPool.toFixed(2)}</p>
                    <p className="text-[10px] font-bold">SOL</p>
                  </div>
                  <div className="bg-[#c0c0c0] border-2 border-black p-3 text-center">
                    <p className="text-[10px] font-black uppercase mb-1">No Pool</p>
                    <p className="text-2xl font-black text-[#ff0000]">{market.noPool.toFixed(2)}</p>
                    <p className="text-[10px] font-bold">SOL</p>
                  </div>
                </div>

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
                  <span>👥 {bets.length} participants</span>
                  <span>⏰ End: {new Date(market.endDate).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Real-time Chart */}
            <div className="border-4 border-white bg-[#c0c0c0]">
              <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1 flex items-center justify-between">
                <span className="text-white text-xs font-bold">📊 REAL-TIME GRAPH</span>
                <div className="flex gap-1">
                  <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px]">_</div>
                  <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px]">□</div>
                  <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px]">×</div>
                </div>
              </div>

              <div className="p-6 bg-white text-black">
                <div className="h-64 relative">
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-[10px] font-bold text-gray-600">
                    <span>{maxPoolValue.toFixed(0)}</span>
                    <span>{(maxPoolValue * 0.75).toFixed(0)}</span>
                    <span>{(maxPoolValue * 0.5).toFixed(0)}</span>
                    <span>{(maxPoolValue * 0.25).toFixed(0)}</span>
                    <span>0</span>
                  </div>

                  {/* Chart area */}
                  <div className="ml-12 h-full border-2 border-black bg-[#c0c0c0] relative overflow-hidden">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between">
                      {[0, 1, 2, 3, 4].map(i => (
                        <div key={i} className="border-t border-gray-400"></div>
                      ))}
                    </div>

                    {/* Chart bars */}
                    <div className="absolute inset-0 flex items-end justify-around px-2">
                      {chartData.map((data, index) => {
                        const yesHeight = (data.yes / maxPoolValue) * 100;
                        const noHeight = (data.no / maxPoolValue) * 100;
                        
                        return (
                          <div key={index} className="flex-1 flex items-end justify-center gap-1 px-1">
                            <div 
                              className="w-full bg-[#00ff00] border border-black transition-all duration-500"
                              style={{ height: `${yesHeight}%` }}
                              title={`YES: ${data.yes.toFixed(2)} SOL`}
                            ></div>
                            <div 
                              className="w-full bg-[#ff0000] border border-black transition-all duration-500"
                              style={{ height: `${noHeight}%` }}
                              title={`NO: ${data.no.toFixed(2)} SOL`}
                            ></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* X-axis labels */}
                  <div className="ml-12 mt-2 flex justify-around text-[9px] font-bold text-gray-600">
                    {chartData.map((data, index) => (
                      <span key={index}>{data.time}</span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#00ff00] border-2 border-black"></div>
                    <span className="text-xs font-black">YES</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#ff0000] border-2 border-black"></div>
                    <span className="text-xs font-black">NO</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bet History */}
            <div className="border-4 border-white bg-[#c0c0c0]">
              <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1 flex items-center justify-between">
                <span className="text-white text-xs font-bold">📜 BET HISTORY</span>
                <div className="flex gap-1">
                  <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px]">_</div>
                  <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px]">□</div>
                  <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px]">×</div>
                </div>
              </div>

              <div className="p-4 bg-white text-black max-h-96 overflow-y-auto">
                {bets.length === 0 ? (
                  <p className="text-center text-sm font-bold text-gray-600 py-8">
                    No bets yet... Be the first! 🎯
                  </p>
                ) : (
                  <div className="space-y-2">
                    {bets.map((bet) => (
                      <div 
                        key={bet.id}
                        className="bg-[#c0c0c0] border-2 border-black p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 flex items-center justify-center border-2 border-black font-black text-xl ${
                            bet.position === 'yes' ? 'bg-[#00ff00] text-black' : 'bg-[#ff0000] text-white'
                          }`}>
                            {bet.position === 'yes' ? '✅' : '❌'}
                          </div>
                          <div>
                            <p className="font-black text-sm">@{bet.username}</p>
                            <p className="text-xs font-bold text-gray-600">
                              {new Date(bet.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-lg">{bet.amount.toFixed(2)} SOL</p>
                          <p className="text-xs font-black uppercase">{bet.position}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Bet Panel + Chat */}
          <div className="lg:col-span-1 space-y-6">
            {/* Bet Panel */}
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
                    {success}
                  </div>
                )}

                <button
                  onClick={handleBet}
                  disabled={!user || isPlacingBet || !selectedBet || !betAmount || parseFloat(betAmount) <= 0}
                  className="w-full bg-[#00ff00] text-black border-4 border-black py-4 font-black text-lg uppercase hover:bg-[#ffff00] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlacingBet ? '⏳ EN COURS...' : '🎯 CONFIRMER'}
                </button>

                {!user && (
                  <p className="text-center text-xs font-bold mt-3">
                    <button
                      onClick={() => window.REACT_APP_NAVIGATE('/login')}
                      className="text-black underline cursor-pointer whitespace-nowrap"
                    >
                      Connecte-toi pour parier
                    </button>
                  </p>
                )}

                {user && (
                  <div className="mt-3 text-center">
                    <p className="text-xs font-bold text-gray-600">
                      💰 Balance: {user.balance.toFixed(2)} SOL
                    </p>
                    {betAmount && parseFloat(betAmount) > 0 && (
                      <p className="text-xs font-bold text-gray-600 mt-1">
                        Après pari: {(user.balance - parseFloat(betAmount)).toFixed(2)} SOL
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Chat */}
            <div className="border-4 border-white bg-[#c0c0c0]">
              <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1 flex items-center justify-between">
                <span className="text-white text-xs font-bold">💬 CHAT DEGENS</span>
                <div className="flex gap-1">
                  <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px]">_</div>
                  <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px]">□</div>
                  <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px]">×</div>
                </div>
              </div>

              <div className="bg-white text-black">
                <div className="h-80 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <p className="text-center text-sm font-bold text-gray-600 py-8">
                      No messages... Start the discussion! 💀
                    </p>
                  ) : (
                    chatMessages.map((msg) => (
                      <div 
                        key={msg.id}
                        className={`p-3 border-2 border-black ${
                          msg.user_id === user?.id ? 'bg-[#00ff00] ml-8' : 'bg-[#c0c0c0] mr-8'
                        }`}
                      >
                        <p className="text-xs font-black mb-1">
                          @{msg.username}
                          <span className="text-[10px] font-bold text-gray-600 ml-2">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </span>
                        </p>
                        <p className="text-sm font-medium break-words">{msg.message}</p>
                      </div>
                    ))
                  )}
                </div>

                {user ? (
                  <div className="p-4 border-t-2 border-black">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Prevent input if exceeds 500 characters
                          if (value.length <= 500) {
                            setNewMessage(value);
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Écris un message..."
                        className="flex-1 bg-white border-2 border-black px-3 py-2 text-sm font-medium text-black focus:outline-none focus:border-[#00ff00]"
                        maxLength={500}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={isSendingMessage || !newMessage.trim()}
                        className="px-4 py-2 bg-[#00ff00] border-2 border-black font-black text-sm uppercase hover:bg-[#ffff00] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSendingMessage ? '...' : '📤'}
                      </button>
                    </div>
                    <div className="text-xs font-bold text-gray-600 mt-1 text-right">
                      {newMessage.length}/500
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-t-2 border-black text-center">
                    <button
                      onClick={() => window.REACT_APP_NAVIGATE('/login')}
                      className="text-xs font-bold underline cursor-pointer whitespace-nowrap"
                    >
                      Log in to chat
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Share Modal */}
      {shareData && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          shareData={shareData}
        />
      )}

      {/* Confirm Modal for Large Bets */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleBet}
        title="⚠️ GROS PARI"
        message={`Tu es sur le point de parier ${betAmount} SOL sur ${selectedBet?.toUpperCase()}.\n\nC'est un montant important. Tu es sûr ?`}
        confirmText="OUI, PARIER"
        cancelText="ANNULER"
        type="warning"
      />
    </div>
  );
}
