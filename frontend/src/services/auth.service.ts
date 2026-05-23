import { createContext } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  skills?: string[];
  experience?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  setUser: () => {},
  loading: true,
});

export const authHeader = () => {
  const token = localStorage.getItem('hireiq_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
