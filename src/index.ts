// src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import goalsRoutes from './routes/goals';
import contributionsRoutes from './routes/contributions';
import transactionsRoutes from './routes/transactions';
import recommendationsRoutes from './routes/recommendations';
import chatRoutes from './routes/chat';
import newsRoutes from './routes/news';
import pushRoutes from './routes/push';
import { startNewsAndRatesPolling } from './jobs/newsPoller';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const PROD = process.env.NODE_ENV === 'production';
const REQUIRE_HTTPS = process.env.REQUIRE_HTTPS === '1';

/** CORS: abierto en dev, restringido en producción por ALLOWED_ORIGINS (lista separada por comas) */
function buildCorsOptions(): cors.CorsOptions {
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!PROD || allowed.length === 0) {
    return {
      origin: (_origin, cb) => cb(null, true),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400,
    };
  }
  return {
    origin: (origin, cb) => {
      if (!origin) return cb(null, false);
      const ok = allowed.some((o) => origin === o);
      return cb(ok ? null : new Error('Origin no permitido'), ok);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  };
}

const corsOptions = buildCorsOptions();

app.use(cors(corsOptions));
// Quitar cabecera X-Powered-By y confiar en proxy para HTTPS detection
app.disable('x-powered-by');
app.set('trust proxy', 1);

// Cabeceras de seguridad básicas (sin depender de helmet)
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (PROD) {
    // HSTS sólo en producción
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Limitar tamaño de JSON para evitar payloads excesivos
app.use(express.json({ limit: '100kb' }));

// Rate limit global (defensivo, evita abusos y brute-force general)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300, // hasta 300 req/IP por ventana
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// En producción y si se requiere, rechazar tráfico no-HTTPS
if (PROD && REQUIRE_HTTPS) {
  app.use((req, res, next) => {
    const proto = req.get('x-forwarded-proto');
    const secure = req.secure || proto === 'https';
    if (!secure) return res.status(400).json({ detail: 'HTTPS requerido' });
    next();
  });
}

app.get('/', (_req, res) => res.json({ message: 'MyGoalFinance API (Node + Supabase)' }));
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/goals/contributions', contributionsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/push', pushRoutes);

// 👇 IMPORTANTE: escuchar en 0.0.0.0 para que el teléfono pueda conectarse por la IP LAN
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API lista en http://0.0.0.0:${PORT}`);

  if (process.env.ENABLE_CRON === '1') {
    const g = globalThis as any;
    if (g.__pollerStarted) {
      console.log('⏱️ Poller ya estaba iniciado, skip');
    } else {
      g.__pollerStarted = true;
      startNewsAndRatesPolling();
      console.log('⏱️ Poller iniciado (FX [+ News cuando lo habilites])');
    }
  } else {
    console.log('⏱️ Cron deshabilitado (ENABLE_CRON != 1)');
  }
});
