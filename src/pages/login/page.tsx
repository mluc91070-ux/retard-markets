import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login, signup, user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      window.REACT_APP_NAVIGATE('/home');
    }
  }, [user, loading]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setSuccess('Password reset email sent! Check your inbox.');
      setTimeout(() => {
        setIsForgotPassword(false);
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      setError('Failed to send reset email. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (isLogin) {
      // Check if email exists in database first
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (!existingUser) {
        setError('No account found with this email address');
        return;
      }

      const success = await login(email.toLowerCase().trim(), password);
      if (success) {
        window.REACT_APP_NAVIGATE('/home');
      } else {
        setError('Invalid password. Please try again or use "Forgot Password"');
      }
    } else {
      if (!username.trim()) {
        setError('Username is required');
        return;
      }
      if (username.length < 3) {
        setError('Username must be at least 3 characters');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      
      try {
        const success = await signup(email.toLowerCase().trim(), username, password);
        if (success) {
          window.REACT_APP_NAVIGATE('/home');
        }
      } catch (err: any) {
        // Handle specific error messages
        if (err.message === 'USERNAME_TAKEN') {
          setError('Username already taken');
        } else if (err.message === 'EMAIL_EXISTS') {
          setError('Email already registered. Please login instead.');
        } else if (err.message === 'INVALID_EMAIL') {
          setError('Invalid email address. Please use a valid email.');
        } else if (err.message === 'PROFILE_CREATION_FAILED') {
          setError('Failed to create profile. Please try again.');
        } else {
          setError('Signup failed. Please try again.');
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#00ff00] font-mono text-xl">LOADING...</div>
      </div>
    );
  }

  // Forgot Password View
  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-[#00ff00] mb-2 font-mono tracking-tight">
              retardmarkets.fun
            </h1>
            <p className="text-[#666666] font-mono text-sm">PASSWORD RESET</p>
          </div>

          {/* Form Container */}
          <div className="bg-[#111111] border-2 border-[#00ff00] rounded-lg p-8">
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-[#00ff00] font-mono text-sm mb-2">
                  EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#333333] rounded-md px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#00ff00] transition-colors"
                  placeholder="your@email.com"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-md p-3">
                  <p className="text-red-500 font-mono text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-500/10 border border-green-500 rounded-md p-3">
                  <p className="text-green-500 font-mono text-sm">{success}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#00ff00] text-black font-mono font-bold py-3 rounded-md hover:bg-[#00cc00] transition-colors whitespace-nowrap cursor-pointer"
              >
                SEND RESET EMAIL
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError('');
                  setSuccess('');
                }}
                className="w-full bg-[#333333] text-white font-mono font-bold py-3 rounded-md hover:bg-[#444444] transition-colors whitespace-nowrap cursor-pointer"
              >
                BACK TO LOGIN
              </button>
            </form>
          </div>

          {/* Info */}
          <div className="mt-6 bg-blue-500/10 border border-blue-500 rounded-lg p-4">
            <p className="text-blue-500 font-mono text-xs text-center">
              💡 We'll send you an email with a link to reset your password
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Login/Signup View
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-[#00ff00] mb-2 font-mono tracking-tight">
            retardmarkets.fun
          </h1>
          <p className="text-[#666666] font-mono text-sm">DEGEN PREDICTION MARKET</p>
        </div>

        {/* Form Container */}
        <div className="bg-[#111111] border-2 border-[#00ff00] rounded-lg p-8">
          {/* Toggle */}
          <div className="flex gap-2 mb-6 bg-[#0a0a0a] p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-2 px-4 rounded-md font-mono text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                isLogin
                  ? 'bg-[#00ff00] text-black'
                  : 'text-[#666666] hover:text-[#00ff00]'
              }`}
            >
              LOGIN
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-2 px-4 rounded-md font-mono text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                !isLogin
                  ? 'bg-[#00ff00] text-black'
                  : 'text-[#666666] hover:text-[#00ff00]'
              }`}
            >
              SIGN UP
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#00ff00] font-mono text-sm mb-2">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333333] rounded-md px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#00ff00] transition-colors"
                placeholder="your@email.com"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-[#00ff00] font-mono text-sm mb-2">
                  USERNAME
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#333333] rounded-md px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#00ff00] transition-colors"
                  placeholder="degen_trader"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-[#00ff00] font-mono text-sm mb-2">
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333333] rounded-md px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#00ff00] transition-colors"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError('');
                  }}
                  className="text-[#00ff00] font-mono text-xs hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500 rounded-md p-3">
                <p className="text-red-500 font-mono text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500 rounded-md p-3">
                <p className="text-green-500 font-mono text-sm">{success}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#00ff00] text-black font-mono font-bold py-3 rounded-md hover:bg-[#00cc00] transition-colors whitespace-nowrap cursor-pointer"
            >
              {isLogin ? 'LOGIN' : 'CREATE ACCOUNT'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-[#666666] font-mono text-xs">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccess('');
                }}
                className="text-[#00ff00] hover:underline cursor-pointer"
              >
                {isLogin ? 'Sign up' : 'Login'}
              </button>
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="mt-6 bg-yellow-500/10 border border-yellow-500 rounded-lg p-4">
          <p className="text-yellow-500 font-mono text-xs text-center">
            ⚠️ DEGEN WARNING: This is a prediction market. Bet responsibly. 💀
          </p>
        </div>
      </div>
    </div>
  );
}
