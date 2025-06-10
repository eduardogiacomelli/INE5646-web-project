import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react'; // <--- CORRIGIDO
import api from '../services/api';

interface User {
  _id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginUser: (token: string, userData: User) => void;
  logoutUser: () => void;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      try {
        const response = await api.get<User>('/auth/me');
        setUser(response.data);
        setToken(storedToken);
        localStorage.setItem('authUser', JSON.stringify(response.data));
      } catch (error) {
        console.error('Falha na autenticação automática ao verificar token:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        setToken(null);
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginUser = (newToken: string, userData: User) => {
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUser', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
    setIsLoading(false);
  };

  const logoutUser = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token && !!user,
      isLoading,
      loginUser,
      logoutUser,
      checkAuthStatus
    }}>
      {!isLoading ? children : (
        <div className="container" style={{ textAlign: 'center', paddingTop: '5rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <article aria-busy="true">A carregar aplicação...</article>
          <p>Por favor, aguarde.</p>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
