// store/auth.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api from '../constants/api';

type User = {
  id?: string;
  email: string;
  name?: string;
  age_range?: string;
  experience?: 'beginner' | 'intermediate' | 'advanced';
  monthly_income?: number | string;
  finance_goal?: string;
  // Permitimos el alias antiguo para no romper si aparece
  montly_income?: number | string;
  [k: string]: any;
};

// Credenciales temporales (solo en memoria) para confirm-email
type PendingCreds = { email: string; password: string } | null;

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ id: string; email: string; requires_confirmation?: boolean }>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;

  pendingCreds: PendingCreds;
  setPendingCreds: (c: PendingCreds) => void;
  clearPendingCreds: () => void;
};

const AuthContext = createContext<AuthContextType>({} as any);

// Normaliza shape del usuario (corrige monthly_income y alias antiguo)
function normalizeUser(u: any | null): User | null {
  if (!u) return null;
  const out: User = { ...u };
  if (out.monthly_income == null && out.montly_income != null) {
    out.monthly_income = out.montly_income;
  }
  return out;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Estado temporal (NO persistente) para confirmación de email
  const [pendingCreds, setPendingCreds] = useState<PendingCreds>(null);

  // Bootstrap de sesión desde AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const [[, t], [, u]] = await AsyncStorage.multiGet(['token', 'user']);
        setToken(t ?? null);
        setUser(u ? normalizeUser(JSON.parse(u)) : null);
      } catch {
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshMe = useCallback(async () => {
    if (!token) return;
    try {
      const me = await api.getProfile();
      const normalized = normalizeUser(me);
      setUser(normalized);
      if (normalized) {
        await AsyncStorage.setItem('user', JSON.stringify(normalized));
      }
    } catch {
      // Silencioso
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login({ email, password });
    const tok = res.access_token;
    setToken(tok);
    await AsyncStorage.setItem('token', tok);

    // Intentar perfil completo; si falla, usar res.user
    const me = await api.getProfile().catch(() => res.user ?? null);
    const normalized = normalizeUser(me);
    setUser(normalized);
    if (normalized) {
      await AsyncStorage.setItem('user', JSON.stringify(normalized));
    }
  }, []);

  const register = useCallback(async (
    name: string,
    email: string,
    password: string
  ): Promise<{ id: string; email: string; requires_confirmation?: boolean }> => {
    const res = await api.register({ name, email, password });
    return res;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout?.().catch(() => {});
    } finally {
      setUser(null);
      setToken(null);
      setPendingCreds(null);
      await AsyncStorage.multiRemove(['token', 'user']);
    }
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshMe,
    pendingCreds,
    setPendingCreds,
    clearPendingCreds: () => setPendingCreds(null),
  }), [user, token, loading, login, register, logout, refreshMe, pendingCreds]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
