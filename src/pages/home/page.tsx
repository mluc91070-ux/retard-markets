import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllMarkets } from '../../utils/marketStorage';
import { Market } from '../../types/market';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import MarketCard from './components/MarketCard';
import { supabase } from '../../lib/supabase';

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const loadMarkets = async () => {
      setLoading(true);
      const allMarkets = await getAllMarkets();
      setMarkets(allMarkets);
      setLoading(false);
    };
    loadMarkets();

    // 🔴 REALTIME: Subscribe to markets changes
    const channel = supabase
      .channel('home-markets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'markets'
        },
        async () => {
          // Reload markets when any change occurs
          const updatedMarkets = await getAllMarkets();
          setMarkets(updatedMarkets);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredMarkets = markets.filter(market => {
    const matchesFilter = filter === 'all' || market.category === filter;
    const matchesSearch = market.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         market.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const categories = [
    { id: 'all', label: 'ALL' },
    { id: 'memecoin', label: 'COINS' },
    { id: 'drama', label: 'DRAMA' },
    { id: 'X', label: 'X' }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Matrix rain effect */}
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(#00ff00 1px, transparent 1px), linear-gradient(90deg, #00ff00 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>

      <Header />

      <div className="max-w-[1400px] mx-auto px-6 py-8 relative z-10">
        {/* Hero - Windows 98 style with retardio background */}
        <div className="mb-12">
          <div className="border-4 border-white bg-[#c0c0c0]">
            <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white text-xs font-bold">✨ retardmarkets.fun</span>
              </div>
              <div className="flex gap-1">
                <button className="w-4 h-4 bg-[#c0c0c0] border border-white text-[8px] flex items-center justify-center font-bold">_</button>
                <button className="w-4 h-4 bg-[#c0c0c0] border border-white text-[8px] flex items-center justify-center font-bold">□</button>
                <button className="w-4 h-4 bg-[#c0c0c0] border border-white text-[8px] flex items-center justify-center font-bold">×</button>
              </div>
            </div>
            <div className="p-8 bg-[url('https://www.retardio.xyz/img/retardioscreen1.webp')] bg-cover bg-center min-h-[400px] flex flex-col items-center justify-center relative">
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="relative z-10 text-center">
                <div className="mb-6 flex justify-center">
                  <img 
                    src="https://static.readdy.ai/image/78ed7c4fcaeb6888e96d390dd55248e8/de1133ee5b7f7670a362e5eede70c64d.png" 
                    alt="RETARD MARKETS" 
                    className="w-auto h-32 object-contain"
                    style={{
                      filter: 'drop-shadow(4px 4px 0 #000) drop-shadow(-2px -2px 0 #fff) drop-shadow(2px -2px 0 #fff) drop-shadow(-2px 2px 0 #fff) drop-shadow(2px 2px 0 #fff)'
                    }}
                  />
                </div>
                <p className="text-3xl font-black text-white mb-6" style={{ textShadow: '2px 2px 0 #000' }}>
                  BET ON CHAOS
                </p>
                <p className="text-xl font-bold text-[#00ff00] mb-6">[PREDICTION MARKETS FOR DEGENS]</p>
              </div>
            </div>
            <div className="bg-[#c0c0c0] border-t-2 border-white px-2 py-1 flex items-center justify-between text-[10px] font-bold text-black">
              <span>Press F1 for help</span>
              <span>CPU Usage: 14%</span>
              <span>MICA</span>
            </div>
          </div>

          {/* Side windows with classified style images */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="border-4 border-white bg-[#c0c0c0]">
              <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1">
                <span className="text-white text-xs font-bold">✨ Stats</span>
              </div>
              <div className="p-4 bg-white text-black">
                <div className="mb-3 relative overflow-hidden">
                  <img 
                    src="https://readdy.ai/api/search-image?query=classified%20top%20secret%20document%20redacted%20black%20bars%20government%20file%20confidential%20stamp%20official%20paper%20texture%20vintage%20retro%20style%20minimalist%20design&width=300&height=180&seq=classified1&orientation=landscape" 
                    alt="Classified"
                    className="w-full h-32 object-cover border-2 border-black"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black text-[#00ff00] px-4 py-2 border-2 border-[#00ff00] font-black text-xs rotate-[-5deg]">
                      [CLASSIFIED]
                    </div>
                  </div>
                </div>
                <p className="text-xs font-bold mb-2">How retard you are?</p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px]">Low</span>
                  <input type="range" min="1" max="11" defaultValue="7" className="flex-1" />
                  <span className="text-[10px]">High</span>
                </div>
                <div className="text-center mt-4">
                  <p className="text-4xl font-black text-[#00ff00]">{markets.length}</p>
                  <p className="text-[10px] font-bold">ACTIVE BETS</p>
                </div>
              </div>
            </div>

            <div className="border-4 border-white bg-[#c0c0c0]">
              <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1">
                <span className="text-white text-xs font-bold">✨ Pool</span>
              </div>
              <div className="p-4 bg-white text-black text-center">
                <div className="mb-3 relative overflow-hidden">
                  <img 
                    src="https://readdy.ai/api/search-image?query=classified%20top%20secret%20cryptocurrency%20document%20redacted%20black%20bars%20bitcoin%20ethereum%20solana%20confidential%20stamp%20official%20government%20file%20vintage%20retro%20style&width=300&height=180&seq=classified2&orientation=landscape" 
                    alt="Classified Crypto"
                    className="w-full h-32 object-cover border-2 border-black"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-[#ff0000] text-white px-4 py-2 border-2 border-black font-black text-xs rotate-[3deg]">
                      [TOP SECRET]
                    </div>
                  </div>
                </div>
                <p className="text-5xl font-black text-[#ff0000] mb-2">
                  {markets.reduce((sum, m) => sum + m.totalPool, 0).toFixed(0)}
                </p>
                <p className="text-xs font-bold">SOL LOCKED</p>
              </div>
            </div>

            <div className="border-4 border-white bg-[#c0c0c0]">
              <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1">
                <span className="text-white text-xs font-bold">✨ Degens</span>
              </div>
              <div className="p-4 bg-white text-black text-center">
                <div className="mb-3 relative overflow-hidden">
                  <img 
                    src="https://readdy.ai/api/search-image?query=classified%20top%20secret%20redacted%20document%20black%20bars%20confidential%20stamp%20government%20file%20degen%20trader%20crypto%20official%20paper%20vintage%20retro%20minimalist&width=300&height=180&seq=classified3&orientation=landscape" 
                    alt="Classified Degens"
                    className="w-full h-32 object-cover border-2 border-black"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-[#ffcc00] text-black px-4 py-2 border-2 border-black font-black text-xs rotate-[-3deg]">
                      [REDACTED]
                    </div>
                  </div>
                </div>
                <p className="text-5xl font-black text-[#0099ff] mb-2">
                  {Math.floor(Math.random() * 500) + 200}
                </p>
                <p className="text-xs font-bold">BETTING NOW</p>
              </div>
            </div>
          </div>
        </div>

        {/* Crypto Classified Banner */}
        <div className="mb-8 border-4 border-[#ffcc00] bg-black p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, #ffcc00 0px, #ffcc00 2px, transparent 2px, transparent 4px)',
          }}></div>
          <div className="relative z-10 flex items-center justify-center gap-8">
            <div className="relative">
              <img 
                src="https://readdy.ai/api/search-image?query=classified%20document%20redacted%20black%20bars%20bitcoin%20cryptocurrency%20top%20secret%20confidential%20stamp%20official%20government%20file%20vintage%20paper%20texture%20minimalist%20design&width=150&height=150&seq=crypto1&orientation=squarish" 
                alt="BTC Classified"
                className="w-24 h-24 object-cover border-4 border-[#ffcc00]"
              />
              <div className="absolute -top-2 -right-2 bg-[#ff0000] text-white px-2 py-1 text-[8px] font-black border-2 border-white rotate-12">
                BTC
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://readdy.ai/api/search-image?query=classified%20top%20secret%20document%20redacted%20black%20bars%20ethereum%20crypto%20confidential%20stamp%20government%20file%20vintage%20retro%20official%20paper%20minimalist&width=150&height=150&seq=crypto2&orientation=squarish" 
                alt="ETH Classified"
                className="w-24 h-24 object-cover border-4 border-[#ffcc00]"
              />
              <div className="absolute -top-2 -right-2 bg-[#00ff00] text-black px-2 py-1 text-[8px] font-black border-2 border-black rotate-[-12deg]">
                ETH
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://readdy.ai/api/search-image?query=classified%20redacted%20document%20black%20bars%20solana%20cryptocurrency%20top%20secret%20confidential%20stamp%20official%20government%20vintage%20paper%20texture%20minimalist%20design&width=150&height=150&seq=crypto3&orientation=squarish" 
                alt="SOL Classified"
                className="w-24 h-24 object-cover border-4 border-[#ffcc00]"
              />
              <div className="absolute -top-2 -right-2 bg-[#ffcc00] text-black px-2 py-1 text-[8px] font-black border-2 border-black rotate-[8deg]">
                SOL
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://readdy.ai/api/search-image?query=classified%20top%20secret%20document%20redacted%20black%20bars%20dogecoin%20meme%20crypto%20confidential%20stamp%20government%20file%20vintage%20official%20paper%20minimalist&width=150&height=150&seq=crypto4&orientation=squarish" 
                alt="DOGE Classified"
                className="w-24 h-24 object-cover border-4 border-[#ffcc00]"
              />
              <div className="absolute -top-2 -right-2 bg-[#0099ff] text-white px-2 py-1 text-[8px] font-black border-2 border-white rotate-[-8deg]">
                DOGE
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://readdy.ai/api/search-image?query=classified%20redacted%20document%20black%20bars%20pepe%20meme%20cryptocurrency%20top%20secret%20confidential%20stamp%20official%20government%20vintage%20paper%20texture%20minimalist&width=150&height=150&seq=crypto5&orientation=squarish" 
                alt="PEPE Classified"
                className="w-24 h-24 object-cover border-4 border-[#ffcc00]"
              />
              <div className="absolute -top-2 -right-2 bg-[#00ff00] text-black px-2 py-1 text-[8px] font-black border-2 border-black rotate-[15deg]">
                PEPE
              </div>
            </div>
          </div>
        </div>

        {/* Filters - Terminal style */}
        <div className="mb-8 border-2 border-[#00ff00] bg-black p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`px-4 py-2 font-black text-xs uppercase border-2 transition-all cursor-pointer whitespace-nowrap ${
                  filter === cat.id
                    ? 'bg-[#00ff00] text-black border-[#00ff00]'
                    : 'bg-black text-[#00ff00] border-[#00ff00] hover:bg-[#00ff00] hover:text-black'
                }`}
              >
                [{cat.label}]
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="> SEARCH_"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black border-2 border-[#00ff00] text-[#00ff00] px-4 py-3 font-mono text-sm placeholder-[#00ff00]/50 focus:outline-none"
          />
        </div>

        {/* Markets Grid */}
        {loading ? (
          <div className="text-center py-20 border-4 border-white bg-[#c0c0c0]">
            <p className="text-xl font-bold text-black">LOADING...</p>
          </div>
        ) : filteredMarkets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {filteredMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-4 border-white bg-[#c0c0c0]">
            <p className="text-6xl font-black text-black mb-4">404</p>
            <p className="text-xl font-bold text-black">NO BETS FOUND</p>
          </div>
        )}

        {/* Bottom terminal */}
        <div className="border-4 border-white bg-[#c0c0c0] mb-8">
          <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1 flex items-center justify-between">
            <span className="text-white text-xs font-bold">✨ Terminal</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px]">_</div>
              <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px]">□</div>
              <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px]">×</div>
            </div>
          </div>
          <div className="p-6 bg-black">
            <p className="font-mono text-[#00ff00] text-sm break-all">
              6ogzHhzdrQr9Pgv6hZ2MNze7UrzBMAFyBBWUYp1Fhitx
            </p>
          </div>
        </div>

        {/* CTA */}
        {!user && (
          <div className="text-center">
            <button
              onClick={() => window.REACT_APP_NAVIGATE('/login')}
              className="bg-[#00ff00] text-black px-12 py-4 text-2xl font-black uppercase border-4 border-white hover:bg-white transition-colors cursor-pointer whitespace-nowrap"
            >
              &gt;&gt; APE IN NOW &lt;&lt;
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
