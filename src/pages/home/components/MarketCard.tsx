import { Market } from '../../../types/market';

interface MarketCardProps {
  market: Market;
}

export default function MarketCard({ market }: MarketCardProps) {
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
    <div 
      onClick={() => window.REACT_APP_NAVIGATE(`/market/${market.id}`)}
      className="border-4 border-white bg-[#c0c0c0] hover:shadow-2xl transition-all duration-300 cursor-pointer group"
    >
      {/* Windows 98 Title Bar */}
      <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white text-xs font-bold">
            {categoryEmoji[market.category as keyof typeof categoryEmoji]} {market.category.toUpperCase()}
          </span>
        </div>
        <div className="flex gap-1">
          <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px] font-bold">_</div>
          <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px] font-bold">□</div>
          <div className="w-4 h-4 bg-[#c0c0c0] border border-black flex items-center justify-center text-[8px] font-bold">×</div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 bg-white text-black">
        <h3 className="text-lg font-black mb-3 leading-tight line-clamp-2 group-hover:text-[#000080] transition-colors">
          {market.title}
        </h3>

        <p className="text-xs font-medium text-gray-600 mb-4 line-clamp-2">
          {market.description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-[#c0c0c0] border-2 border-black p-2 text-center">
            <p className="text-[9px] font-black uppercase mb-1">Pool</p>
            <p className="text-lg font-black text-[#00ff00]">{market.totalPool.toFixed(1)}</p>
            <p className="text-[8px] font-bold">SOL</p>
          </div>
          <div className="bg-[#c0c0c0] border-2 border-black p-2 text-center">
            <p className="text-[9px] font-black uppercase mb-1">Yes</p>
            <p className="text-lg font-black text-[#00ff00]">{market.yesPool.toFixed(1)}</p>
            <p className="text-[8px] font-bold">SOL</p>
          </div>
          <div className="bg-[#c0c0c0] border-2 border-black p-2 text-center">
            <p className="text-[9px] font-black uppercase mb-1">No</p>
            <p className="text-lg font-black text-[#ff0000]">{market.noPool.toFixed(1)}</p>
            <p className="text-[8px] font-bold">SOL</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black text-[#00ff00]">YES {yesPercentage}%</span>
            <span className="text-xs font-black text-[#ff0000]">NO {noPercentage}%</span>
          </div>
          <div className="flex h-5 bg-[#c0c0c0] border-2 border-black overflow-hidden">
            <div 
              className="bg-[#00ff00] transition-all duration-500 flex items-center justify-center text-[10px] font-black text-black"
              style={{ width: `${yesPercentage}%` }}
            >
              {yesPercentage > 20 && 'YES'}
            </div>
            <div 
              className="bg-[#ff0000] transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white"
              style={{ width: `${noPercentage}%` }}
            >
              {noPercentage > 20 && 'NO'}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between text-[10px] font-bold text-gray-600 mb-3">
          <span>👤 @{market.createdBy}</span>
          <span>⏰ {new Date(market.endDate).toLocaleDateString()}</span>
        </div>

        {/* Button */}
        <button className="w-full bg-[#0099cc] text-white border-2 border-black py-2 font-black text-sm uppercase hover:bg-[#007acc] transition-colors whitespace-nowrap">
          &gt;&gt; BET NOW &lt;&lt;
        </button>
      </div>

      {/* Windows 98 Status Bar */}
      <div className="bg-[#c0c0c0] border-t-2 border-white px-2 py-1 flex items-center justify-between text-[9px] font-bold text-black">
        <span>Status: Active</span>
        <span>ID: {market.id.slice(0, 8)}</span>
      </div>
    </div>
  );
}
