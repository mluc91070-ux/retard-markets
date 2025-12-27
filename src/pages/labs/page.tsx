import { useState, useEffect } from 'react';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import { useAuth } from '../../contexts/AuthContext';

export default function Labs() {
  const [activeSection, setActiveSection] = useState('about');
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      window.REACT_APP_NAVIGATE('/login');
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#00ff00] font-mono text-xl">LOADING...</div>
      </div>
    );
  }

  const roadmapItems = [
    {
      phase: 'Phase 1',
      title: 'BETA TESTING',
      status: 'current',
      items: [
        'Free platform testing with virtual SOL',
        'Learn how prediction markets work',
        'Create and bet on test markets',
        'No risk - practice with fake tokens',
        'Build your strategy and skills'
      ]
    },
    {
      phase: 'Phase 2',
      title: 'SOLANA INTEGRATION',
      status: 'upcoming',
      items: [
        'Real Solana blockchain integration',
        'Bet with actual SOL tokens',
        'Smart contract deployment',
        'Secure wallet connection',
        'Real money, real rewards'
      ]
    },
    {
      phase: 'Phase 3',
      title: 'TOKEN LAUNCH & AIRDROP',
      status: 'upcoming',
      items: [
        'RETARD token launch on pump.fun',
        'Points system for active users',
        'Massive airdrop for top predictors',
        'Early adopters get biggest rewards',
        'Staking and governance features'
      ]
    },
    {
      phase: 'Phase 4',
      title: 'ECOSYSTEM EXPANSION',
      status: 'upcoming',
      items: [
        'Mobile app launch',
        'Advanced analytics dashboard',
        'NFT badges for achievements',
        'DAO governance with token holders',
        'Multi-chain support'
      ]
    }
  ];

  const features = [
    {
      icon: '🎯',
      title: 'CREATE PREDICTIONS',
      description: 'Create any prediction market you want. Memecoin pumps, Twitter drama, sports, politics - if it can happen, you can create a market for it.'
    },
    {
      icon: '💰',
      title: 'PLACE BETS',
      description: 'Bet YES or NO on any prediction. Choose your amount and watch the odds move in real-time. Early bets get better odds!'
    },
    {
      icon: '📊',
      title: 'TRACK PERFORMANCE',
      description: 'View all your bets, wins, and losses. Track your prediction accuracy and climb the leaderboard to become a legend.'
    },
    {
      icon: '🏆',
      title: 'WIN REWARDS',
      description: 'When you predict correctly, you split the entire pool with other winners. The more you bet, the more you can win!'
    },
    {
      icon: '💬',
      title: 'CHAT & DISCUSS',
      description: 'Join the conversation on each market. Share your analysis, debate with others, and influence the community.'
    },
    {
      icon: '🎖️',
      title: 'EARN BADGES',
      description: 'Complete achievements to unlock exclusive badges. Show off your skills and earn points for the upcoming airdrop!'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Matrix rain effect */}
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(#00ff00 1px, transparent 1px), linear-gradient(90deg, #00ff00 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>

      <Header />

      <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
        {/* Hero - Windows 98 style */}
        <div className="border-4 border-white bg-[#c0c0c0] mb-8">
          <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1 flex items-center justify-between">
            <span className="text-white text-xs font-bold">✨ LABS & DOCUMENTATION</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px]">_</div>
              <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px]">□</div>
              <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px]">×</div>
            </div>
          </div>
          <div className="p-6 bg-white text-black flex items-center gap-4">
            <img 
              src="https://public.readdy.ai/ai/img_res/16ee4b6f-f95c-487f-8582-ac666e23931d.png" 
              alt="retardmarkets.fun" 
              className="w-16 h-16 object-contain"
            />
            <div>
              <h1 className="text-3xl font-black font-mono mb-1">
                retardmarkets.fun
              </h1>
              <p className="text-sm font-bold font-mono">
                &gt; LABS & DOCUMENTATION
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Terminal style */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center border-2 border-[#00ff00] bg-black p-4">
          {[
            { id: 'about', label: 'ABOUT', emoji: '📖' },
            { id: 'features', label: 'FEATURES', emoji: '⚡' },
            { id: 'roadmap', label: 'ROADMAP', emoji: '🗺️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`px-6 py-3 font-black text-sm uppercase border-2 transition-all cursor-pointer whitespace-nowrap ${
                activeSection === tab.id
                  ? 'bg-[#00ff00] text-black border-[#00ff00]'
                  : 'bg-black text-[#00ff00] border-[#00ff00] hover:bg-[#00ff00] hover:text-black'
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* About Section */}
        {activeSection === 'about' && (
          <div className="animate-fade-in space-y-6">
            <div className="border-4 border-white bg-[#c0c0c0]">
              <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1">
                <span className="text-white text-xs font-bold">✨ WHAT IS RETARD PREDICTION?</span>
              </div>
              <div className="p-6 bg-white text-black">
                <div className="space-y-4 text-sm font-medium leading-relaxed">
                  <p>
                    <strong className="font-black">RETARD PREDICTION</strong> is a decentralized prediction market platform where you can bet on literally anything. Think of it as a betting casino where YOU create the markets and decide what happens next.
                  </p>
                  <p>
                    Will Bitcoin hit $100K? Will your favorite memecoin pump? Will Elon tweet something crazy today? <span className="font-bold">Create a market, place your bet, and let the community decide!</span>
                  </p>
                  <p>
                    Currently in <span className="font-bold text-[#00ff00]">BETA TESTING</span> with virtual SOL - practice for free, learn the platform, and get ready for the real Solana integration coming soon! 💎
                  </p>
                </div>
              </div>
            </div>

            <div className="border-4 border-white bg-[#c0c0c0]">
              <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1">
                <span className="text-white text-xs font-bold">✨ HOW IT WORKS</span>
              </div>
              <div className="p-6 bg-white text-black">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      step: '1',
                      title: 'BROWSE OR CREATE',
                      desc: 'Check out active prediction markets or create your own. Choose from categories like Memecoin, Drama, X Posts, or pure Chaos.'
                    },
                    {
                      step: '2',
                      title: 'PLACE YOUR BET',
                      desc: 'Pick YES or NO and decide how much to bet. The more you risk, the bigger your potential payout. Odds update in real-time!'
                    },
                    {
                      step: '3',
                      title: 'WATCH & CHAT',
                      desc: 'Track your positions, chat with other degens, and watch the odds move as more people bet. The community decides!'
                    },
                    {
                      step: '4',
                      title: 'WIN & COLLECT',
                      desc: 'When the market resolves, winners split the entire pool based on their stake. Predict correctly and stack those gains! 💰'
                    }
                  ].map(item => (
                    <div key={item.step} className="bg-[#c0c0c0] border-2 border-black p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-black text-[#00ff00] flex items-center justify-center font-black text-lg">
                          {item.step}
                        </div>
                        <h3 className="text-sm font-black">{item.title}</h3>
                      </div>
                      <p className="text-xs font-medium">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-4 border-[#ffff00] bg-[#c0c0c0]">
              <div className="bg-[#ffff00] px-2 py-1">
                <span className="text-black text-xs font-bold">⚡ CURRENTLY IN BETA - FREE TO TEST!</span>
              </div>
              <div className="p-6 bg-white text-black">
                <div className="space-y-3 text-sm font-medium">
                  <p className="font-black text-base">
                    🎮 Practice with virtual SOL - No risk, pure learning!
                  </p>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="font-black text-[#00ff00]">✓</span>
                      <span>Test the platform with fake tokens</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-black text-[#00ff00]">✓</span>
                      <span>Learn how prediction markets work</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-black text-[#00ff00]">✓</span>
                      <span>Build your strategy before real money</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-black text-[#00ff00]">✓</span>
                      <span>Earn points for the upcoming airdrop</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-black text-[#00ff00]">✓</span>
                      <span>Early adopters get biggest rewards!</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        {activeSection === 'features' && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="border-4 border-white bg-[#c0c0c0]">
                  <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1">
                    <span className="text-white text-xs font-bold">{feature.icon} {feature.title}</span>
                  </div>
                  <div className="p-4 bg-white text-black">
                    <p className="text-xs font-medium leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 border-4 border-[#00ff00] bg-[#c0c0c0]">
              <div className="bg-[#00ff00] px-2 py-1">
                <span className="text-black text-xs font-bold">💡 WHAT YOU CAN DO ON THE PLATFORM</span>
              </div>
              <div className="p-6 bg-white text-black">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-black mb-3 uppercase">🎯 For Predictors:</h3>
                    <ul className="space-y-2 text-xs font-medium">
                      <li className="flex items-start gap-2">
                        <span className="font-black">•</span>
                        <span>Browse hundreds of active prediction markets</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-black">•</span>
                        <span>Bet YES or NO on any prediction</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-black">•</span>
                        <span>Track your betting history and performance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-black">•</span>
                        <span>Climb the leaderboard and earn badges</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-black">•</span>
                        <span>Win big when you predict correctly</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-black mb-3 uppercase">🚀 For Creators:</h3>
                    <ul className="space-y-2 text-xs font-medium">
                      <li className="flex items-start gap-2">
                        <span className="font-black">•</span>
                        <span>Create prediction markets on any topic</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-black">•</span>
                        <span>Set the question, category, and end date</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-black">•</span>
                        <span>Earn fees from every bet placed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-black">•</span>
                        <span>Build your reputation as a market maker</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-black">•</span>
                        <span>Resolve markets and distribute winnings</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Roadmap Section */}
        {activeSection === 'roadmap' && (
          <div className="animate-fade-in space-y-4">
            <div className="border-4 border-[#ffff00] bg-[#c0c0c0] mb-6">
              <div className="bg-[#ffff00] px-2 py-1">
                <span className="text-black text-xs font-bold">🗺️ THE JOURNEY AHEAD</span>
              </div>
              <div className="p-6 bg-white text-black">
                <p className="text-sm font-medium leading-relaxed">
                  We're building the ultimate prediction market platform step by step. Here's what's coming next and how you can benefit from being an early adopter! 🚀
                </p>
              </div>
            </div>

            {roadmapItems.map((phase, index) => (
              <div
                key={index}
                className={`border-4 bg-[#c0c0c0] ${
                  phase.status === 'current' ? 'border-[#ffff00]' : 'border-white'
                }`}
              >
                <div className={`px-2 py-1 flex items-center justify-between ${
                  phase.status === 'current' 
                    ? 'bg-[#ffff00]' 
                    : 'bg-gradient-to-r from-[#000080] to-[#1084d0]'
                }`}>
                  <span className={`text-xs font-bold ${
                    phase.status === 'current' ? 'text-black' : 'text-white'
                  }`}>
                    {phase.phase} - {phase.title}
                  </span>
                  <span className={`text-xs font-black ${
                    phase.status === 'current' ? 'text-black' : 'text-white'
                  }`}>
                    {phase.status === 'current' ? '⚡ LIVE NOW' : '🔒 COMING SOON'}
                  </span>
                </div>
                <div className="p-4 bg-white text-black">
                  <ul className="space-y-2">
                    {phase.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2 text-xs font-medium">
                        <span className="font-black text-[#00ff00]">
                          {phase.status === 'current' ? '✓' : '•'}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

            <div className="border-4 border-[#00ff00] bg-[#c0c0c0] mt-6">
              <div className="bg-[#00ff00] px-2 py-1">
                <span className="text-black text-xs font-bold">🎁 EARLY ADOPTER BENEFITS</span>
              </div>
              <div className="p-6 bg-white text-black">
                <div className="space-y-3 text-sm font-medium">
                  <p className="font-black text-base">
                    Join now and get rewarded for being early! 💎
                  </p>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="font-black text-[#00ff00]">✓</span>
                      <span><strong>Points System:</strong> Earn points for every bet, market creation, and achievement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-black text-[#00ff00]">✓</span>
                      <span><strong>Massive Airdrop:</strong> Top users get the biggest token allocation when we launch</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-black text-[#00ff00]">✓</span>
                      <span><strong>Exclusive NFTs:</strong> Limited edition badges for beta testers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-black text-[#00ff00]">✓</span>
                      <span><strong>Priority Access:</strong> First to test new features and real Solana integration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-black text-[#00ff00]">✓</span>
                      <span><strong>Governance Rights:</strong> Vote on platform decisions with your tokens</span>
                    </li>
                  </ul>
                  <div className="mt-4 pt-4 border-t-2 border-black">
                    <p className="text-xs font-black uppercase text-center">
                      🔥 The more you use the platform now, the bigger your airdrop later! 🔥
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
