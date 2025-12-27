import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  username: string;
  balance: number;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateBalance: (newBalance: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        const userData: User = {
          id: data.id,
          email: data.email,
          username: data.username,
          balance: parseFloat(data.balance),
          createdAt: data.created_at
        };
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, username: string, password: string): Promise<boolean> => {
    try {
      // Check if username is already taken
      const { data: existingUsername } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUsername) {
        throw new Error('USERNAME_TAKEN');
      }

      // Create auth user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        // Return specific error message
        if (authError.message.includes('invalid')) {
          throw new Error('INVALID_EMAIL');
        }
        if (authError.message.includes('already registered')) {
          throw new Error('EMAIL_EXISTS');
        }
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('SIGNUP_FAILED');
      }

      // Create user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          username,
          balance: 50
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        throw new Error('PROFILE_CREATION_FAILED');
      }

      // Load user data
      await loadUserData(authData.user.id);
      return true;
    } catch (error: any) {
      console.error('Signup error:', error);
      // Re-throw with specific error message
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      if (data.user) {
        await loadUserData(data.user.id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateBalance = async (newBalance: number) => {
    if (user) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ balance: newBalance })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating balance:', error);
          return;
        }

        const updatedUser = { ...user, balance: newBalance };
        setUser(updatedUser);
      } catch (error) {
        console.error('Update balance error:', error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
