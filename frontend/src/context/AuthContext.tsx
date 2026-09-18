import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, setAuthToken, getAuthToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginCoordinator: (username: string, roll_number: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isFaculty: boolean;
  isVolunteer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.getCurrentUser();
          setUser(res.user);
        } catch (err) {
          console.error('Session expired or invalid:', err);
          logout();
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.login({ email, password });
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const loginCoordinator = async (username: string, roll_number: string): Promise<User> => {
    const res = await api.loginCoordinator({ username, roll_number });
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  const isSuperAdmin = user?.role === 'SUPERADMIN';
  const isFaculty = user?.role === 'FACULTY' || isSuperAdmin;
  const isVolunteer = user?.role === 'VOLUNTEER' || isFaculty;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        loginCoordinator,
        logout,
        isAuthenticated: !!user,
        isSuperAdmin,
        isFaculty,
        isVolunteer,
      }}
    >
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
