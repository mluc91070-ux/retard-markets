import { useState } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareData: {
    type: 'win' | 'profit' | 'market' | 'achievement';
    title: string;
    amount?: number;
    marketTitle?: string;
    winRate?: number;
    totalBets?: number;
  };
}

export default function ShareModal({ isOpen, onClose, shareData }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateShareText = () => {
    switch (shareData.type) {
      case 'win':
        return `🎯 Just won ${shareData.amount} SOL on "${shareData.marketTitle}"!\n\n💀 RETARD MARKETS - Where degens trade\n\n#RetardMarkets #Solana #Degen`;
      
      case 'profit':
        return `💰 Total Profit: ${shareData.amount} SOL!\n📊 Win Rate: ${shareData.winRate}%\n🎲 ${shareData.totalBets} bets\n\n💀 RETARD MARKETS - Where degens trade\n\n#RetardMarkets #Solana #Degen`;
      
      case 'market':
        return `🔥 New market on RETARD MARKETS:\n"${shareData.marketTitle}"\n\nCome bet with us!\n\n💀 Where degens trade\n\n#RetardMarkets #Solana`;
      
      case 'achievement':
        return `🏆 Achievement unlocked: ${shareData.title}!\n\n💀 RETARD MARKETS - Where degens trade\n\n#RetardMarkets #Achievement #Degen`;
      
      default:
        return '💀 RETARD MARKETS - Where degens trade';
    }
  };

  const shareText = generateShareText();
  const shareUrl = window.location.origin;

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-black border-4 border-white max-w-lg w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-[#ffcc00] transition-colors cursor-pointer"
        >
          <i className="ri-close-line text-2xl"></i>
        </button>

        {/* Title */}
        <h2 className="text-3xl font-black text-[#ffcc00] mb-6 font-mono">
          📱 SHARE
        </h2>

        {/* Preview */}
        <div className="bg-white/5 border-2 border-white/20 p-4 mb-6">
          <p className="text-white font-mono text-sm whitespace-pre-wrap">
            {shareText}
          </p>
        </div>

        {/* Share Buttons */}
        <div className="space-y-3">
          {/* Twitter/X */}
          <button
            onClick={shareToTwitter}
            className="w-full bg-black border-2 border-white text-white hover:bg-[#1DA1F2] hover:border-[#1DA1F2] transition-all py-3 px-4 flex items-center justify-center gap-3 font-mono font-black cursor-pointer"
          >
            <i className="ri-twitter-x-fill text-xl"></i>
            <span>SHARE ON X/TWITTER</span>
          </button>

          {/* Copy Link */}
          <button
            onClick={copyToClipboard}
            className="w-full bg-black border-2 border-white text-white hover:bg-[#ffcc00] hover:text-black hover:border-[#ffcc00] transition-all py-3 px-4 flex items-center justify-center gap-3 font-mono font-black cursor-pointer"
          >
            <i className={`${copied ? 'ri-check-line' : 'ri-file-copy-line'} text-xl`}></i>
            <span>{copied ? 'COPIED!' : 'COPY TEXT'}</span>
          </button>

          {/* Telegram */}
          <button
            onClick={() => {
              const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
              window.open(telegramUrl, '_blank');
            }}
            className="w-full bg-black border-2 border-white text-white hover:bg-[#0088cc] hover:border-[#0088cc] transition-all py-3 px-4 flex items-center justify-center gap-3 font-mono font-black cursor-pointer"
          >
            <i className="ri-telegram-fill text-xl"></i>
            <span>SHARE ON TELEGRAM</span>
          </button>

          {/* Discord */}
          <button
            onClick={copyToClipboard}
            className="w-full bg-black border-2 border-white text-white hover:bg-[#5865F2] hover:border-[#5865F2] transition-all py-3 px-4 flex items-center justify-center gap-3 font-mono font-black cursor-pointer"
          >
            <i className="ri-discord-fill text-xl"></i>
            <span>COPY FOR DISCORD</span>
          </button>
        </div>

        {/* Cancel */}
        <button
          onClick={onClose}
          className="w-full mt-4 bg-transparent border-2 border-white/30 text-white/60 hover:border-white hover:text-white transition-all py-2 font-mono font-black cursor-pointer"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}
