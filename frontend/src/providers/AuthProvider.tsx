import React, { useState, useEffect, ReactNode } from 'react';
import { AuthContext, AuthUser } from '../services/auth.service';
import { client } from '../services/api.service';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('hireiq_token');
      const savedUser = localStorage.getItem('hireiq_user');

      if (token && savedUser) {
        try {
          // Verify token validity with a simple request
          const res = await client.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(res.data.user);
        } catch (error) {
          console.error('Session restoration failed:', error);
          localStorage.removeItem('hireiq_token');
          localStorage.removeItem('hireiq_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const handleSetUser = (newUser: AuthUser | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('hireiq_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('hireiq_user');
      localStorage.removeItem('hireiq_token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser: handleSetUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
