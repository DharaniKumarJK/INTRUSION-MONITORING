import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api, { UserProfile } from '../lib/api';

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, role?: 'user' | 'admin') => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await api.get('/me');
      setUser(data);
      setProfile(data);
      return data;
    } catch (error: any) {
      console.error('Failed to load profile:', error.response?.data || error.message);
      localStorage.removeItem('token');
      setUser(null);
      setProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, role: 'user' | 'admin' = 'user') => {
    try {
      const { data } = await api.post('/signup', { email, password, role });
      localStorage.setItem('token', data.access_token);
      await loadProfile();
      return { error: null };
    } catch (error: any) {
      console.error('Sign Up failed:', error.response?.data || error.message);
      return { error: error.response?.data?.detail || 'Signup failed' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);

      const { data } = await api.post('/login', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      localStorage.setItem('token', data.access_token);
      const profileData = await loadProfile();

      // Track successful login
      if (profileData) {
        await api.post('/login-attempts', {
          attempted_username: email,
          actual_username: profileData.email,
          actual_user_id: profileData.id,
          attempt_success: true,
          user_agent: navigator.userAgent,
          website_domain: window.location.hostname
        });
      }

      return { error: null };
    } catch (error: any) {
      console.error('Sign In failed:', error.response?.data || error.message);

      // Track failed login
      await api.post('/login-attempts', {
        attempted_username: email,
        actual_username: null,
        actual_user_id: null,
        attempt_success: false,
        user_agent: navigator.userAgent,
        website_domain: window.location.hostname
      });

      return { error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
