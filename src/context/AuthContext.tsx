import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { setApiToken, setOnUnauthorized, TOKEN_STORAGE_KEY } from '../api/client';
import { getCurrentApiUrl, loadSavedApiUrl, saveApiUrl } from '../config/apiConfig';
import { Utilizador } from '../types/models';

export interface RegisterPayload {
  nome_utilizador: string;
  email: string;
  numero_telemovel?: string;
  password: string;
}

interface AuthContextValue {
  token: string | null;
  user: Utilizador | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  apiUrl: string;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  fetchUser: () => Promise<Utilizador | null>;
  setToken: (newToken: string | null) => Promise<void>;
  logout: () => Promise<void>;
  updateApiUrl: (url: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<Utilizador | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiUrl, setApiUrl] = useState<string>(getCurrentApiUrl());

  const setToken = useCallback(async (newToken: string | null) => {
    setApiToken(newToken);
    setTokenState(newToken);
    if (newToken) {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    } else {
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, []);

  const logout = useCallback(async () => {
    await setToken(null);
    setUser(null);
  }, [setToken]);

  const fetchUser = useCallback(async (): Promise<Utilizador | null> => {
    try {
      const response = await api.get<{ data: Utilizador }>('/utilizadores/me');
      const userData = response.data.data;
      setUser(userData);
      return userData;
    } catch {
      await logout();
      return null;
    }
  }, [logout]);

  useEffect(() => {
    setOnUnauthorized(() => {
      void logout();
    });
    return () => setOnUnauthorized(null);
  }, [logout]);

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      try {
        const resolvedUrl = await loadSavedApiUrl();
        if (mounted) {
          setApiUrl(resolvedUrl);
        }

        const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (storedToken) {
          setApiToken(storedToken);
          if (mounted) {
            setTokenState(storedToken);
          }
          await fetchUser();
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    void bootstrap();
    return () => {
      mounted = false;
    };
  }, [fetchUser]);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const response = await api.post<{ token?: string }>('/utilizadores/login', {
        email: identifier.trim(),
        password,
      });

      const receivedToken = response.data?.token;
      if (!receivedToken) {
        throw new Error('Token não devolvido pelo servidor.');
      }

      await setToken(receivedToken);
      const profile = await fetchUser();
      if (!profile) {
        throw new Error('Não foi possível carregar os dados do utilizador.');
      }
    },
    [fetchUser, setToken],
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    await api.post('/utilizadores', {
      nome_utilizador: payload.nome_utilizador.trim(),
      email: payload.email.trim(),
      numero_telemovel: payload.numero_telemovel?.trim() || undefined,
      password: payload.password,
    });
  }, []);

  const updateApiUrl = useCallback(async (url: string) => {
    const nextUrl = await saveApiUrl(url);
    setApiUrl(nextUrl);
    return nextUrl;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isLoading,
      isAuthenticated: Boolean(token && user),
      apiUrl,
      login,
      register,
      fetchUser,
      setToken,
      logout,
      updateApiUrl,
    }),
    [token, user, isLoading, apiUrl, login, register, fetchUser, setToken, logout, updateApiUrl],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
