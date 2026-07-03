'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type {
  AuthResponseDto,
  AuthUserDto,
  LoginDto,
  OnboardingDto,
  OnboardingResponseDto,
  RegisterDto,
} from '@repo/shared';
import { apiFetch } from './api';

const ACCESS_KEY = 'agendamento-access';
const REFRESH_KEY = 'agendamento-refresh';

interface AuthContextValue {
  user: AuthUserDto | null;
  loading: boolean;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  onboard: (dto: OnboardingDto) => Promise<OnboardingResponseDto>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readToken(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserDto | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = useCallback((res: AuthResponseDto) => {
    window.localStorage.setItem(ACCESS_KEY, res.accessToken);
    window.localStorage.setItem(REFRESH_KEY, res.refreshToken);
    setUser(res.user);
  }, []);

  const clear = useCallback(() => {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    setUser(null);
  }, []);

  // Ao carregar, tenta restaurar a sessão trocando o refresh token (rotação).
  useEffect(() => {
    const refreshToken = readToken(REFRESH_KEY);
    if (!refreshToken) {
      setLoading(false);
      return;
    }
    apiFetch<AuthResponseDto>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    })
      .then(persist)
      .catch(clear)
      .finally(() => setLoading(false));
  }, [persist, clear]);

  const login = useCallback(
    async (dto: LoginDto) => {
      const res = await apiFetch<AuthResponseDto>('/auth/login', {
        method: 'POST',
        body: dto,
      });
      persist(res);
    },
    [persist],
  );

  const register = useCallback(
    async (dto: RegisterDto) => {
      const res = await apiFetch<AuthResponseDto>('/auth/register', {
        method: 'POST',
        body: dto,
      });
      persist(res);
    },
    [persist],
  );

  const onboard = useCallback(
    async (dto: OnboardingDto) => {
      const res = await apiFetch<OnboardingResponseDto>(
        '/tenants/onboarding',
        { method: 'POST', body: dto },
      );
      persist(res);
      return res;
    },
    [persist],
  );

  const logout = useCallback(async () => {
    const accessToken = readToken(ACCESS_KEY);
    const refreshToken = readToken(REFRESH_KEY);
    if (accessToken && refreshToken) {
      await apiFetch('/auth/logout', {
        method: 'POST',
        token: accessToken,
        body: { refreshToken },
      }).catch(() => undefined);
    }
    clear();
  }, [clear]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, onboard, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  return ctx;
}
