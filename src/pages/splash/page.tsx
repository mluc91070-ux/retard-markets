import { useEffect, useState } from 'react';

export default function Splash() {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Après 3 secondes, commence le fade out
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 3000);

    // Après 3.5 secondes, redirige vers la page d'accueil
    const redirectTimer = setTimeout(() => {
      window.REACT_APP_NAVIGATE('/home');
    }, 3500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(redirectTimer);
    };
  }, []);

  return (
    <div 
      className={`fixed inset-0 bg-black flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ zIndex: 9999 }}
    >
      {/* Matrix rain effect */}
      <div className="fixed inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(#00ff00 1px, transparent 1px), linear-gradient(90deg, #00ff00 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        animation: 'matrix-scroll 20s linear infinite'
      }}></div>

      {/* Animated Logo */}
      <div className="relative z-10 text-center px-4">
        <div className="mb-4 sm:mb-8">
          <div 
            className="animate-pulse"
            style={{
              animation: 'glitch 1s infinite, pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
          >
            <img 
              src="https://static.readdy.ai/image/78ed7c4fcaeb6888e96d390dd55248e8/de1133ee5b7f7670a362e5eede70c64d.png" 
              alt="RETARD MARKETS" 
              className="w-auto h-48 sm:h-64 md:h-80 object-contain mx-auto animate-bounce"
              style={{
                filter: 'drop-shadow(4px 4px 0 #000) drop-shadow(-2px -2px 0 #fff) drop-shadow(2px -2px 0 #fff) drop-shadow(-2px 2px 0 #fff) drop-shadow(2px 2px 0 #fff)',
                animation: 'bounce 1s infinite'
              }}
            />
          </div>
        </div>

        {/* Loading bar Windows 98 style */}
        <div className="border-4 border-white bg-[#c0c0c0] w-full max-w-[400px] mx-auto">
          <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1">
            <span className="text-white text-xs font-bold">✨ Loading...</span>
          </div>
          <div className="p-4 bg-white">
            <div className="h-6 bg-[#c0c0c0] border-2 border-[#808080] relative overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#000080] to-[#1084d0] animate-loading"
                style={{
                  animation: 'loading 3s ease-in-out forwards'
                }}
              ></div>
            </div>
            <p className="text-xs font-bold text-black mt-2 text-center font-mono">
              INITIALIZING DEGEN MODE...
            </p>
          </div>
        </div>

        {/* Flashing text */}
        <div className="mt-4 sm:mt-8">
          <p className="text-lg sm:text-2xl font-black text-[#00ff00] animate-pulse font-mono">
            [PRESS ANY KEY TO CONTINUE]
          </p>
        </div>
      </div>

      <style>{`
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
        }

        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }

        @keyframes matrix-scroll {
          0% { background-position: 0 0; }
          100% { background-position: 0 1000px; }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(-5%);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
      `}</style>
    </div>
  );
}
