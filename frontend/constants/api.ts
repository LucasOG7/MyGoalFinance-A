// constants/api.ts
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { API_PREFIX, API_URL } from './config';
import { getToken as getSecureToken } from '../utils/secureStore';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ReqOpts = {
  method?: Method;
  body?: any;
  auth?: boolean;
  /** Tiempo máximo por request (ms). Default: 12000 */
  timeoutMs?: number;
  /** Reintentos en errores de red/timeout o 5xx. Default: 1 (un reintento) */
  retries?: number;
  /** Delay base entre reintentos (ms). Default: 600 */
  retryDelayMs?: number;
};

/** 
 * Resolver de base URL multiplataforma.
 * - Prioriza API_URL que exportas desde ./config
 * - Si no está, usa expo.extra.apiUrl o EXPO_PUBLIC_API_URL
 * - En web usa el hostname actual (útil para http://localhost:3000)
 * - En nativo hace fallback a una IP LAN por defecto (ajústala si quieres)
 */
function resolveApiUrl(configUrl?: string) {
  const extra = (Constants as any)?.expoConfig?.extra?.apiUrl;
  const env   = process.env.EXPO_PUBLIC_API_URL;

  if (Platform.OS === 'web') {
    const host =
      (typeof window !== 'undefined' && window.location?.hostname) || 'localhost';
    // intenta respetar el puerto del config/env si existe; si no, 3000
    const portFromConfig = (() => {
      try {
        const u = new URL(configUrl || extra || env || '');
        return u.port || '';
      } catch {
        return '';
      }
    })();
    const port = portFromConfig || '3000';
    return `http://${host}:${port}`;
  }

  let url = configUrl && !/^undefined$/.test(configUrl) && configUrl.trim() !== ''
    ? configUrl
    : (extra || env || 'http://192.168.1.102:3000');

  // En producción exigir/advertir HTTPS; opcionalmente forzar si EXPO_PUBLIC_FORCE_HTTPS=1
  if (process.env.NODE_ENV === 'production' && String(url).startsWith('http://')) {
    console.warn('[api] En producción, tu API debe usar HTTPS. Ajusta EXPO_PUBLIC_API_URL.');
    if (process.env.EXPO_PUBLIC_FORCE_HTTPS === '1') {
      try {
        const u = new URL(url);
        u.protocol = 'https:';
        url = u.toString();
      } catch {}
    }
  }
  return url;
}

// Base URL efectiva (sin romper tus exports actuales)
const BASE_URL = resolveApiUrl(API_URL);

async function req<T>(
  path: string,
  {
    method = 'GET',
    body,
    auth = false,
    timeoutMs = 12_000,
    retries = 1,
    retryDelayMs = 600,
  }: ReqOpts = {}
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await getSecureToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  // ⬇️ ÚNICA línea cambiada: usar BASE_URL en vez de API_URL
  const url = `${BASE_URL}${API_PREFIX}${path}`;

  // Intento con reintentos controlados (solo red/timeout/5xx)
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const isAuthPath = path.startsWith('/auth');
      const safeBody = isAuthPath ? '[redacted]' : (body ?? '');
      console.log('➡️ [api]', method, url, auth ? '(auth)' : '', safeBody);

      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = raw; // HTML / texto plano
      }

      const safeData = isAuthPath ? '[redacted]' : data;
      console.log('⬅️ [api]', res.status, path, safeData);

      if (!res.ok) {
        // Si es 5xx y hay reintentos, reintenta
        if (res.status >= 500 && retries - attempt > 0) {
          attempt++;
          await sleep(retryDelayMs * attempt); // backoff lineal
          continue;
        }
        const msg =
          (data && (data.detail || data.message)) || `Error ${res.status}`;
        throw new Error(msg);
      }

      return data as T;
    } catch (err: any) {
      const isAbort = err?.name === 'AbortError';
      const isNetwork =
        !isAbort &&
        (err?.message?.includes('Network') ||
          err?.message === 'TypeError: Network request failed');

      // Reintenta solo para timeout / error de red
      if ((isAbort || isNetwork) && retries - attempt > 0) {
        console.log(
          '[api] retrying due to',
          isAbort ? 'timeout' : 'network error',
          '→ attempt',
          attempt + 1
        );
        attempt++;
        await sleep(retryDelayMs * attempt);
        continue;
      }

      console.error('[api] fetch error', err?.message || err);
      if (isAbort) throw new Error('Tiempo de espera agotado');
      throw new Error('No se pudo conectar con el servidor');
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Convierte "YYYY-MM" a [primer_día, último_día] */
function monthToRange(ym: string) {
  // ym = "YYYY-MM"
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m) return { from: ym, to: ym }; // fallback defensivo
  const from = `${y}-${String(m).padStart(2, '0')}-01`;
  const last = new Date(y, m, 0).getDate(); // último día del mes
  const to = `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
  return { from, to };
}

/** Tipo opcional para el summary mensual */
type SummaryMonth = {
  month: string;
  from: string;
  to: string;
  inc: number;
  exp: number;
  net: number;
  byCategory: { category_id: number; total: number }[];
};

/** Tipos de chat */
type ChatMsg = {
  id: number;
  user_id?: number;
  sender: 'user' | 'bot';
  message: string;
  timestamp: string; // ISO
};

type ChatSendResponse = {
  user: ChatMsg;
  bot: ChatMsg;
};

/** === NUEVOS TIPOS NEWS/RATES === */
type Rates = {
  base: 'CLP';
  usd: number;
  eur: number;
  uf: number;
  updatedAt: string;
};

type Article = {
  id: string;
  title: string;
  url: string;
  source?: string;
  published_at?: string | null;
};

export const api = {
  // AUTH
  register: (p: { name: string; email: string; password: string }) =>
    req<{ id: string; email: string; requires_confirmation?: boolean }>(
      '/auth/register',
      { method: 'POST', body: p }
    ),

  login: (p: { email: string; password: string }) =>
    req<{ access_token: string; user?: any }>(
      '/auth/login',
      { method: 'POST', body: p }
    ),

  logout: () =>
    req<{ ok: boolean }>(
      '/auth/logout',
      { method: 'POST', auth: true }
    ),

  me: () => req<any>('/auth/me', { auth: true }),

  // PROFILE
  getProfile: () => req<any>('/profile', { auth: true }),
  updateProfile: (p: any) =>
    req<any>('/profile', { method: 'PUT', body: p, auth: true }),

  // GOALS
  listGoals: () => req<any[]>('/goals', { auth: true }),
  createGoal: (p: any) =>
    req<{ id: string }>('/goals', { method: 'POST', body: p, auth: true }),
  updateGoal: (id: string, p: any) =>
    req<any>(`/goals/${id}`, { method: 'PATCH', body: p, auth: true }),
  deleteGoal: (id: string) =>
    req<void>(`/goals/${id}`, { method: 'DELETE', auth: true }),

  // TRANSACTIONS
  listTransactions: (q?: { from?: string; to?: string; month?: string }) => {
    let from = q?.from;
    let to = q?.to;

    // Si te pasan "month", conviértelo a rango
    if (!from && !to && q?.month) {
      const r = monthToRange(q.month);
      from = r.from;
      to = r.to;
    }

    // Si por error llega "YYYY-MM" en from/to, normalízalo también
    if (from && from.length === 7) {
      const r = monthToRange(from);
      from = r.from;
      if (!to) to = r.to; // fin del mismo mes
    }
    if (to && to.length === 7) {
      const r = monthToRange(to);
      to = r.to;
    }

    const qs =
      from || to
        ? `?from=${encodeURIComponent(from ?? '')}&to=${encodeURIComponent(to ?? '')}`
        : '';

    return req<any[]>(`/transactions${qs}`, { auth: true });
  },

  createTransaction: (p: any) =>
    req<{ id: string }>('/transactions', { method: 'POST', body: p, auth: true }),

  /** NUEVOS HELPERS DE TRANSACCIONES */
  updateTransaction: (id: number | string, p: any) =>
    req<any>(`/transactions/${id}`, { method: 'PATCH', body: p, auth: true }),

  deleteTransaction: (id: number | string) =>
    req<void>(`/transactions/${id}`, { method: 'DELETE', auth: true }),

  /** RESUMEN MENSUAL (KPIs + categorías) */
  summaryMonth: (p?: { month?: string }) =>
    req<SummaryMonth>(
      `/transactions/summary/month${p?.month ? `?month=${encodeURIComponent(p.month)}` : ''}`,
      { auth: true }
    ),

  // CONTRIBUTIONS
  listContributions: (goalId: string) =>
    req<any[]>(`/goals/contributions/${goalId}`, { auth: true }),
  addContribution: (goalId: string, p: any) =>
    req<{ id: string }>(`/goals/contributions/${goalId}`, {
      method: 'POST',
      body: p,
      auth: true,
    }),

  // RECOMMENDATIONS
  listRecommendations: () => req<any[]>('/recommendations', { auth: true }),

  // ──────────────────────────────
  // CHAT (Groq-ready, consistente)
  // ──────────────────────────────

  /** Historial del chat del usuario (GET /api/chat) */
  chatHistory: () => req<ChatMsg[]>('/chat', { auth: true }),

  /** Envía un mensaje y devuelve { user, bot } (POST /api/chat/message) */
  chatSend: (message: string) =>
    req<ChatSendResponse>('/chat/message', {
      method: 'POST',
      body: { message },
      auth: true,
    }),

  /** Compatibilidad con código antiguo que esperaba { reply } */
  chatMessage: async (message: string) => {
    const res = await req<ChatSendResponse>('/chat', {
      method: 'POST',
      body: { message },
      auth: true,
    });
    return { reply: res.bot.message };
  },

  // ─────────────── PUSH TOKENS ───────────────
  /** Registra el token de notificaciones push en tu backend */
  pushRegister: (p: { token: string; platform: 'ios' | 'android' | 'web' }) =>
    req<{ ok: boolean }>('/push/register', { method: 'POST', body: p, auth: true }),

  // ─────────────── NEWS ───────────────
  /** Tasas: USD, EUR y UF expresados en CLP */
  newsRates: () => req<Rates>('/news/rates', { auth: true }),

  /** Feed de noticias financieras */
  newsFeed: () => req<Article[]>('/news/feed', { auth: true }),

  // ─────────────── PAYMENTS ───────────────
  createDeposit: (p: { amount: number; provider: 'mercadopago' | 'webpay'; return_url?: string }) =>
    req<{ provider: string; deposit_id: string; preference_id?: string; payment_url?: string; sandbox_url?: string }>(
      '/payments/deposit',
      { method: 'POST', body: p, auth: true }
    ),
};

export default api;
