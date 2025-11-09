// src/routes/news.ts
import { Router } from 'express';
import Parser from 'rss-parser';
import { supabaseAdmin } from '../supabase';

const router = Router();
const parser = new Parser();

// Cache simple en memoria para reducir llamadas
let lastRates: any = null;
let lastRatesAt = 0;
let lastFeed: any[] = [];
let lastFeedAt = 0;

const RATES_TTL_MS = 5 * 60 * 1000; // 5 min
const FEED_TTL_MS  = 10 * 60 * 1000; // 10 min

// Fuente de tipos de cambio (CLP): https://mindicador.cl
async function fetchRatesCL() {
  // Devuelve { usd, eur, uf } en CLP
  const base = 'https://mindicador.cl/api';
  
  try {
    const [dolar, euro, uf] = await Promise.all([
      fetch(`${base}/dolar`).then(r => r.json()).catch(err => {
        console.error('[fetchRatesCL] Error fetching USD:', err.message);
        return null;
      }),
      fetch(`${base}/euro`).then(r => r.json()).catch(err => {
        console.error('[fetchRatesCL] Error fetching EUR:', err.message);
        return null;
      }),
      fetch(`${base}/uf`).then(r => r.json()).catch(err => {
        console.error('[fetchRatesCL] Error fetching UF:', err.message);
        return null;
      }),
    ]);

    console.log('[fetchRatesCL] Raw responses:', { 
      dolar: dolar ? 'OK' : 'NULL', 
      euro: euro ? 'OK' : 'NULL', 
      uf: uf ? 'OK' : 'NULL' 
    });

    const usd = Number(dolar?.serie?.[0]?.valor ?? 0);
    const eur = Number(euro?.serie?.[0]?.valor ?? 0);
    const ufv = Number(uf?.serie?.[0]?.valor ?? 0);

    console.log('[fetchRatesCL] Parsed values:', { usd, eur, uf: ufv });

    if (!usd || !eur || !ufv) {
      console.error('[fetchRatesCL] Datos incompletos detectados:', { 
        usd: usd || 'MISSING', 
        eur: eur || 'MISSING', 
        uf: ufv || 'MISSING' 
      });
      
      // Usar valores por defecto temporales para evitar que la app se rompa
      return {
        base: 'CLP',
        usd: usd || 950, // Valor aproximado USD/CLP
        eur: eur || 1000, // Valor aproximado EUR/CLP  
        uf: ufv || 37000, // Valor aproximado UF/CLP
        updatedAt: new Date().toISOString(),
        isDefault: true
      };
    }

    return {
      base: 'CLP',
      usd,
      eur,
      uf: ufv,
      updatedAt: new Date().toISOString(),
      isDefault: false
    };
  } catch (error) {
    console.error('[fetchRatesCL] Error general:', error);
    // Valores por defecto en caso de error completo
    return {
      base: 'CLP',
      usd: 950,
      eur: 1000,
      uf: 37000,
      updatedAt: new Date().toISOString(),
      isDefault: true
    };
  }
}

// Fuente de noticias: Google News RSS en español Chile (finanzas/economía)
const GOOGLE_FIN_FEED =
  'https://news.google.com/rss/search?q=finanzas+OR+econom%C3%ADa&hl=es-419&gl=CL&ceid=CL:es-419';

async function fetchFinanceNews() {
  const feed = await parser.parseURL(GOOGLE_FIN_FEED);
  // Normaliza algunos campos
  return (feed.items || []).slice(0, 20).map((it) => ({
    id: it.guid || it.link || it.id || String(it.isoDate || it.pubDate || it.title),
    title: it.title || 'Sin título',
    url: it.link,
    source: (it.creator || it.author || it.source || 'Google News') as string,
    published_at: it.isoDate || it.pubDate || null,
  })).filter(a => !!a.url);
}

// GET /api/news/rates
router.get('/rates', async (_req, res) => {
  try {
    const now = Date.now();
    if (!lastRates || now - lastRatesAt > RATES_TTL_MS) {
      lastRates = await fetchRatesCL();
      lastRatesAt = now;

      // Guarda snapshot para auditoría/alertas
      await supabaseAdmin.from('fx_snapshot').insert({
        base: 'CLP',
        usd: lastRates.usd,
        eur: lastRates.eur,
        uf: lastRates.uf,
      });
    }
    res.json(lastRates);
  } catch (e: any) {
    res.status(400).json({ detail: e?.message || 'No se pudieron cargar los tipos de cambio' });
  }
});

// GET /api/news/feed
router.get('/feed', async (_req, res) => {
  try {
    const now = Date.now();
    if (!lastFeed || now - lastFeedAt > FEED_TTL_MS) {
      lastFeed = await fetchFinanceNews();
      lastFeedAt = now;
    }
    res.json(lastFeed);
  } catch (e: any) {
    res.status(400).json({ detail: e?.message || 'No se pudo cargar el feed' });
  }
});

export default router;
