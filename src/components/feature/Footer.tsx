export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-black border-t-2 border-[#00ff00] mt-20">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl font-black text-green-500 font-mono">retardmarkets.fun</span>
            </div>
            <p className="text-sm text-gray-400 mb-4 font-mono">
              &gt; Prediction markets for degens.<br/>
              &gt; Bet on chaos. Win or lose.<br/>
              &gt; No rules. Pure degen energy.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-black text-xs uppercase mb-3 font-mono">[PLATFORM]</h3>
            <ul className="space-y-2">
              <li>
                <button onClick={() => window.REACT_APP_NAVIGATE('/')} className="text-[#00ff00] hover:text-white font-mono text-xs transition-colors cursor-pointer whitespace-nowrap">
                  &gt; Markets
                </button>
              </li>
              <li>
                <button onClick={() => window.REACT_APP_NAVIGATE('/create')} className="text-[#00ff00] hover:text-white font-mono text-xs transition-colors cursor-pointer whitespace-nowrap">
                  &gt; Create
                </button>
              </li>
              <li>
                <button onClick={() => window.REACT_APP_NAVIGATE('/labs')} className="text-[#00ff00] hover:text-white font-mono text-xs transition-colors cursor-pointer whitespace-nowrap">
                  &gt; Labs
                </button>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-white font-black text-xs uppercase mb-3 font-mono">[SOCIAL]</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://x.com/retardmarkets" target="_blank" rel="noopener noreferrer" className="text-[#00ff00] hover:text-white font-mono text-xs transition-colors cursor-pointer whitespace-nowrap">
                  &gt; Twitter
                </a>
              </li>
              <li>
                <a href="https://t.me/retardmarkets" target="_blank" rel="noopener noreferrer" className="text-[#00ff00] hover:text-white font-mono text-xs transition-colors cursor-pointer whitespace-nowrap">
                  &gt; Telegram
                </a>
              </li>
              <li>
                <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-[#00ff00] hover:text-white font-mono text-xs transition-colors cursor-pointer whitespace-nowrap">
                  &gt; Discord
                </a>
              </li>
            </ul>
          </div>

          {/* Token */}
          <div>
            <h3 className="text-white font-black text-xs uppercase mb-3 font-mono">[TOKEN]</h3>
            <p className="text-[#00ff00] font-mono text-xs mb-3">
              $RETARD on pump.fun
            </p>
            <a
              href="https://pump.fun"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#00ff00] text-black px-4 py-2 font-black text-xs uppercase border-2 border-[#00ff00] hover:bg-white transition-colors cursor-pointer whitespace-nowrap font-mono"
            >
              &gt;&gt; BUY
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#00ff00] pt-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[#00ff00] font-mono text-[10px]">
            <p>© {currentYear} RETARDMARKETS.FUN // ALL RIGHTS RESERVED</p>
            <p className="text-[#ff0000]">⚠️ DYOR // NOT FINANCIAL ADVICE // YOU MIGHT LOSE EVERYTHING</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
