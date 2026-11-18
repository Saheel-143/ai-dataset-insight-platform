import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  loginDemo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          setToken(storedToken);
        } catch {
          // If token expired, clear
          localStorage.removeItem('token');
          setUser(null);
          setToken(null);
        }
      } else {
        // Automatically sign in as Demo user in local dev for instant frictionless access!
        try {
          const res = await api.login({ email: 'demo@example.com', password: 'Password123!' });
          localStorage.setItem('token', res.token);
          setUser(res.user);
          setToken(res.token);
        } catch {
          // It's ok if server not ready yet
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    localStorage.setItem('token', res.token);
    setUser(res.user);
    setToken(res.token);
  };

  const register = async (email: string, pass: string, name: string) => {
    const res = await api.register({ email, password: pass, name });
    localStorage.setItem('token', res.token);
    setUser(res.user);
    setToken(res.token);
  };

  const loginDemo = async () => {
    return login('demo@example.com', 'Password123!');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, loginDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

