import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin, getProfileIdByAuthId } from '../supabase';
import { requireAuth } from '../middleware/auth';

const router = Router();

const depositSchema = z.object({
  amount: z.number().positive(),
  return_url: z.string().url().optional(),
});

function genId(prefix = 'dep') {
  const rnd = Math.random().toString(36).slice(2, 8);
  const ts = Date.now().toString(36);
  return `${prefix}_${ts}_${rnd}`;
}

function getWebpayConfig() {
  const commerce = process.env.TRANSBANK_COMMERCE_CODE || '';
  const apiKey   = process.env.TRANSBANK_API_KEY || '';
  const base     = process.env.WEBPAY_BASE_URL || 'https://webpay3gint.transbank.cl';
  if (!commerce || !apiKey) throw new Error('Faltan TRANSBANK_COMMERCE_CODE / TRANSBANK_API_KEY en .env');
  return { commerce, apiKey, base };
}

async function webpayCreateTransaction(p: { amount: number; buy_order: string; session_id: string; return_url: string }) {
  const { commerce, apiKey, base } = getWebpayConfig();
  const url = `${base}/rswebpaytransaction/api/webpay/v1.2/transactions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Tbk-Api-Key-Id': commerce,
      'Tbk-Api-Key-Secret': apiKey,
    },
    body: JSON.stringify({ amount: p.amount, buy_order: p.buy_order, session_id: p.session_id, return_url: p.return_url }),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(JSON.parse(txt)?.error || `HTTP ${res.status}`);
  const j = JSON.parse(txt);
  const token: string = j.token;
  const wbUrl: string = j.url;
  return { token, url: `${wbUrl}?token_ws=${token}` };
}

async function webpayCommit(token: string) {
  const { commerce, apiKey, base } = getWebpayConfig();
  const url = `${base}/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Tbk-Api-Key-Id': commerce,
      'Tbk-Api-Key-Secret': apiKey,
    },
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(JSON.parse(txt)?.error || `HTTP ${res.status}`);
  return JSON.parse(txt);
}

router.post('/deposit', requireAuth, async (req: any, res) => {
  const parsed = depositSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const uid = req.user.id;
  const userId = await getProfileIdByAuthId(uid);
  if (!userId) return res.status(404).json({ detail: 'Perfil no encontrado' });

  const depositId = genId('dep');
  const { amount, return_url } = parsed.data;

  try {
    const ret = return_url || process.env.WEBPAY_RETURN_URL || `${req.protocol}://${req.get('host')}/api/payments/webpay/return`;
    const t = await webpayCreateTransaction({ amount, buy_order: depositId, session_id: String(userId), return_url: ret });
    return res.status(201).json({ provider: 'webpay', deposit_id: depositId, token: t.token, payment_url: t.url });
  } catch (e: any) {
    return res.status(400).json({ detail: e?.message || 'No se pudo crear el depósito' });
  }
});

router.all('/webpay/return', async (req, res) => {
  const token = String((req.query?.token_ws as any) || (req.body as any)?.token_ws || '');
  if (!token) return res.status(400).json({ detail: 'Falta token_ws' });
  try {
    const commit = await webpayCommit(token);
    if (String(commit?.status).toUpperCase() !== 'AUTHORIZED') {
      return res.status(200).json({ ok: false, status: commit?.status });
    }
    const amount = Number(commit?.amount || 0);
    const session = String(commit?.session_id || '');
    const userId = Number(session);
    if (!userId || !amount) return res.status(200).json({ ok: false });

    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabaseAdmin
      .from('transaction')
      .insert({ user_id: userId, amount, type: 'income', description: 'Depósito Webpay', occurred_at: today });
    if (error) return res.status(400).json({ detail: error.message });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(400).json({ detail: e?.message || 'Commit Webpay falló' });
  }
});

export default router;
