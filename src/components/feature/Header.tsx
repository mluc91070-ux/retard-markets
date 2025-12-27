import { useAuth } from '../../contexts/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NotificationPanel from './NotificationPanel';

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <header className="bg-black border-b-4 border-[#ffcc00] shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-6">
          {/* Logo */}
          <button
            onClick={() => window.REACT_APP_NAVIGATE('/home')}
            className="flex items-center gap-3 cursor-pointer flex-shrink-0"
          >
            <span className="text-xl font-black text-[#ffcc00] font-mono tracking-tighter">
              retardmarkets.fun
            </span>
          </button>

          {/* Navigation principale */}
          <nav className="flex items-center gap-3 flex-1 justify-center">
            <Link
              to="/home"
              className={`font-bold font-mono text-sm transition-colors cursor-pointer whitespace-nowrap px-3 py-2 ${
                location.pathname === '/home' 
                  ? 'text-[#ffcc00] border-b-2 border-[#ffcc00]' 
                  : 'text-white hover:text-[#ffcc00]'
              }`}
            >
              Markets
            </Link>
            
            <button
              onClick={() => window.REACT_APP_NAVIGATE('/create')}
              className="px-4 py-2 bg-[#ffcc00] text-black border-2 border-[#ffcc00] hover:bg-black hover:text-[#ffcc00] transition-all font-mono font-black text-sm whitespace-nowrap cursor-pointer"
            >
              ➕ CREATE
            </button>
            
            <button
              onClick={() => window.REACT_APP_NAVIGATE('/leaderboard')}
              className="px-4 py-2 bg-transparent text-white border-2 border-white hover:bg-white hover:text-black transition-all font-mono font-black text-sm whitespace-nowrap cursor-pointer"
            >
              🏆
            </button>
            
            <button
              onClick={() => window.REACT_APP_NAVIGATE('/achievements')}
              className="px-4 py-2 bg-transparent text-white border-2 border-white hover:bg-white hover:text-black transition-all font-mono font-black text-sm whitespace-nowrap cursor-pointer"
            >
              💎
            </button>
            
            {user && (
              <>
                <button
                  onClick={() => navigate('/analytics')}
                  className="px-4 py-2 bg-transparent text-[#ff00ff] border-2 border-[#ff00ff] hover:bg-[#ff00ff] hover:text-black transition-all font-mono font-black text-sm whitespace-nowrap cursor-pointer"
                >
                  📊
                </button>
                
                <button
                  onClick={() => window.REACT_APP_NAVIGATE('/admin')}
                  className={`px-4 py-2 border-2 transition-all font-mono font-black text-sm whitespace-nowrap cursor-pointer ${
                    location.pathname === '/admin'
                      ? 'bg-[#00ff00] text-black border-[#00ff00]'
                      : 'bg-transparent text-[#00ff00] border-[#00ff00] hover:bg-[#00ff00] hover:text-black'
                  }`}
                >
                  🔧
                </button>
              </>
            )}
            
            <Link
              to="/labs"
              className={`font-bold font-mono text-sm transition-colors cursor-pointer whitespace-nowrap px-3 py-2 ${
                location.pathname === '/labs' 
                  ? 'text-[#ffcc00] border-b-2 border-[#ffcc00]' 
                  : 'text-white hover:text-[#ffcc00]'
              }`}
            >
              Labs
            </Link>
          </nav>

          {/* User Section */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {user && <NotificationPanel />}
            
            {user ? (
              <>
                <button
                  onClick={() => window.REACT_APP_NAVIGATE('/profile')}
                  className="px-4 py-2 font-black text-sm uppercase bg-[#ffcc00] text-black hover:bg-white hover:text-black border-2 border-[#ffcc00] transition-all cursor-pointer whitespace-nowrap font-mono"
                >
                  {user.balance.toFixed(2)} SOL
                </button>
                
                <button
                  onClick={() => window.REACT_APP_NAVIGATE('/profile')}
                  className="px-4 py-2 font-black text-sm uppercase bg-white text-black hover:bg-[#ffcc00] hover:text-black border-2 border-white transition-all cursor-pointer whitespace-nowrap font-mono"
                >
                  {user.username}
                </button>

                <button
                  onClick={logout}
                  className="px-3 py-2 font-black text-sm uppercase bg-[#ff0000] text-white hover:bg-white hover:text-[#ff0000] border-2 border-[#ff0000] transition-all cursor-pointer whitespace-nowrap font-mono"
                >
                  [X]
                </button>
              </>
            ) : (
              <button
                onClick={() => window.REACT_APP_NAVIGATE('/login')}
                className="px-4 py-2 bg-[#ffcc00] text-black font-black text-sm uppercase hover:bg-white hover:text-black border-2 border-[#ffcc00] transition-all cursor-pointer whitespace-nowrap font-mono"
              >
                &gt;&gt; LOGIN
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
