// store/auth.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken as getSecureToken, setToken as setSecureToken, removeToken as removeSecureToken } from '../utils/secureStore';
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
const LOCAL_PHRASES_SUCCESS_FAILURE: { content: string; author: string }[] = [
  { content: 'El éxito es la suma de pequeños esfuerzos diarios.', author: 'Anónimo' },
  { content: 'El fracaso es la oportunidad de empezar de nuevo con más inteligencia.', author: 'Henry Ford' },
  { content: 'No es sobre ganar siempre, sino sobre aprender siempre.', author: 'Anónimo' },
  { content: 'Caer está permitido, levantarse es obligatorio.', author: 'Anónimo' },
  { content: 'La disciplina supera al talento cuando el talento no se disciplina.', author: 'Anónimo' },
  { content: 'Quien persevera, alcanza.', author: 'Proverbio' },
  { content: 'El que no arriesga, no gana.', author: 'Anónimo' },
  { content: 'La paciencia es el secreto del éxito.', author: 'Anónimo' },
  { content: 'Tu futuro se crea por lo que haces hoy, no mañana.', author: 'Robert Kiyosaki' },
  { content: 'Nunca es tarde para ser quien podrías haber sido.', author: 'George Eliot' },
  { content: 'Convierte tus heridas en sabiduría.', author: 'Oprah Winfrey' },
  { content: 'El éxito es ir de fracaso en fracaso sin perder el entusiasmo.', author: 'Winston Churchill' },
  { content: 'La constancia convierte lo ordinario en extraordinario.', author: 'Anónimo' },
  { content: 'Sueña en grande, trabaja en silencio, deja que tu éxito haga ruido.', author: 'Anónimo' },
  { content: 'El éxito llega cuando la preparación se encuentra con la oportunidad.', author: 'Anónimo' },
  { content: 'Hazlo ahora; a veces “después” se convierte en “nunca”.', author: 'Anónimo' },
];

type User = {
  id?: string;
  email: string;
  name?: string;
  age_range?: string;
  experience?: 'beginner' | 'intermediate' | 'advanced';
  monthly_income?: number | string;
  finance_goal?: string;
  // URI de avatar (data:base64 o http/https)
  avatar_uri?: string | null;
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
  motivation: { content: string; author: string } | null;
  refreshMotivation: () => Promise<void>;
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
  const [motivation, setMotivation] = useState<{ content: string; author: string } | null>(null);

  // Estado temporal (NO persistente) para confirmación de email
  const [pendingCreds, setPendingCreds] = useState<PendingCreds>(null);

  // Bootstrap de sesión leyendo token desde SecureStore (fallback a AsyncStorage)
  useEffect(() => {
    (async () => {
      try {
        const [[, u], [, avatar], [, m]] = await AsyncStorage.multiGet([
          'user',
          'avatar_uri',
          'motivation_quote',
        ]);
        const t = await getSecureToken();
        setToken(t ?? null);
        const base = u ? normalizeUser(JSON.parse(u)) : null;
        const merged = base ? { ...base, avatar_uri: avatar ?? base.avatar_uri ?? null } : null;
        setUser(merged);
        if (m) {
          try {
            const parsed = JSON.parse(m);
            if (parsed && parsed.content) setMotivation({ content: String(parsed.content), author: String(parsed.author ?? '') });
          } catch {}
        }
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
      // hidratar avatar_uri desde almacenamiento local
      const avatar = await AsyncStorage.getItem('avatar_uri');
      const merged = normalized ? { ...normalized, avatar_uri: avatar ?? normalized.avatar_uri ?? null } : null;
      setUser(merged);
      if (merged) {
        await AsyncStorage.setItem('user', JSON.stringify(merged));
      }
    } catch {
      // Silencioso
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login({ email, password });
    const tok = res.access_token;
    setToken(tok);
    await setSecureToken(tok);

    // Intentar perfil completo; si falla, usar res.user
    const me = await api.getProfile().catch(() => res.user ?? null);
    const normalized = normalizeUser(me);
    const avatar = await AsyncStorage.getItem('avatar_uri');
    const merged = normalized ? { ...normalized, avatar_uri: avatar ?? normalized.avatar_uri ?? null } : null;
    setUser(merged);
    if (merged) {
      await AsyncStorage.setItem('user', JSON.stringify(merged));
    }
    await refreshMotivation();
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
      setMotivation(null);
      await removeSecureToken();
      await AsyncStorage.multiRemove(['user', 'avatar_uri', 'motivation_quote']);
    }
  }, []);

  const refreshMotivation = useCallback(async () => {
    try {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;

      const [storedQuote, storedDate] = await Promise.all([
        AsyncStorage.getItem('motivation_quote'),
        AsyncStorage.getItem('motivation_quote_date'),
      ]);
      if (storedQuote && storedDate === key) {
        try {
          const parsed = JSON.parse(storedQuote);
          if (parsed && parsed.content) {
            setMotivation({ content: String(parsed.content), author: String(parsed.author ?? '') });
            return;
          }
        } catch {}
      }

      const hash = Array.from(key).reduce((s, c) => s + c.charCodeAt(0), 0);
      const idx = hash % LOCAL_PHRASES_SUCCESS_FAILURE.length;
      const q = LOCAL_PHRASES_SUCCESS_FAILURE[idx];

      setMotivation(q);
      await AsyncStorage.multiSet([
        ['motivation_quote', JSON.stringify(q)],
        ['motivation_quote_date', key],
      ]);
    } catch {}
  }, []);

  useEffect(() => {
    refreshMotivation().catch(() => {});
  }, [refreshMotivation]);

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
    motivation,
    refreshMotivation,
  }), [user, token, loading, login, register, logout, refreshMe, pendingCreds, motivation, refreshMotivation]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
