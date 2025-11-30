// supabase/functions/api/index.ts
// API unificada para MyGoalFinance (auth, profile, transactions, goals, news,
// recommendations, chat con GROQ y push).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { parse as parseCsv } from "csv-parse/sync";

/* ───────────────────────────── Tipos y helpers base ───────────────────────────── */

type UserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
} | null;

type Ctx = {
  sb: SupabaseClient;      // cliente con token del usuario (RLS activo)
  admin: SupabaseClient;   // service-role (sin RLS). ¡Usar con filtros!
  user: UserLike;
  profileId: number | null;
};

// 🔗 Deep link de confirmación de email
const EMAIL_REDIRECT_TO =
  Deno.env.get("EMAIL_REDIRECT_TO") ?? "mygoalfinance://auth/callback";

// CORS helpers
function withCORS(res: Response) {
  const h = new Headers(res.headers);
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type");
  h.set("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  return new Response(res.body, { status: res.status, headers: h });
}

function jsonOK(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
function jsonErr(detail: string, status = 400) {
  return jsonOK({ detail }, status);
}

async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const txt = await req.text();
    return txt ? (JSON.parse(txt) as any) : {};
  } catch {
    return {};
  }
}

/** "YYYY-MM" → {from: "YYYY-MM-01", to: "YYYY-MM-<last>"} */
function monthToRange(ym?: string) {
  if (!ym) {
    const d = new Date();
    ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  const [y, m] = ym.split("-").map(Number);
  const from = `${y}-${String(m).padStart(2, "0")}-01`;
  const last = new Date(y, m, 0).getDate();
  const to = `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { from, to };
}

/** Asegura/obtiene el id de user_profile del usuario autenticado */
async function ensureProfileId(ctx: Ctx): Promise<number> {
  if (!ctx.user) throw new Error("Unauthenticated");
  if (ctx.profileId) return ctx.profileId;

  // Intentar obtener el perfil más reciente por id (tolerante a duplicados)
  const { data: row, error } = await ctx.admin
    .from("user_profile")
    .select("id")
    .eq("id_supabase", ctx.user.id)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.log("ensureProfileId select warn:", error.message || error);
  }

  if (row && (row as any).id) {
    ctx.profileId = (row as any).id;
    return (row as any).id;
  }

  // ⚠️ La tabla exige "name" NOT NULL → construir un valor por defecto seguro
  const meta = (ctx.user?.user_metadata || {}) as Record<string, unknown>;
  const metaName = typeof meta.name === "string" ? meta.name.trim() : "";
  const fallbackFromEmail =
    (ctx.user?.email && String(ctx.user.email).split("@")[0]) || "";
  const safeName = metaName || fallbackFromEmail || "Usuario";

  // Crear perfil mínimo
  const { data: created, error: e2 } = await ctx.admin
    .from("user_profile")
    .insert({
      id_supabase: ctx.user.id,
      email: ctx.user.email ?? null,
      name: safeName,
    })
    .select("id")
    .single();

  if (e2) throw new Error(e2.message || "No se pudo crear el perfil");
  ctx.profileId = created.id;
  return created.id;
}

/* ─────────────────────────────────── AUTH ─────────────────────────────────── */

async function authLogin(req: Request, ctx: Ctx) {
  const body = await readJson(req);
  const email = String(body?.email || "");
  const password = String(body?.password || "");
  if (!email || !password) return jsonErr("Faltan credenciales", 400);

  const { data, error } = await ctx.sb.auth.signInWithPassword({ email, password });
  if (error) return jsonErr(error.message || "Login inválido", 400);

  return jsonOK({
    access_token: data.session?.access_token || "",
    user: data.user || null,
  });
}

async function authRegister(req: Request, ctx: Ctx) {
  const body = await readJson(req);
  const email = String(body?.email || "");
  const password = String(body?.password || "");
  const name = String(body?.name || "");

  if (!email || !password) return jsonErr("Faltan email/password", 400);

  const { data, error } = await ctx.sb.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: EMAIL_REDIRECT_TO,
    },
  });
  if (error) return jsonErr(error.message || "No se pudo registrar", 400);

  return jsonOK(
    {
      id: data.user?.id || "",
      email: data.user?.email || email,
      requires_confirmation: true,
    },
    201,
  );
}

async function authMe(_req: Request, ctx: Ctx) {
  if (!ctx.user) return jsonErr("No autenticado", 401);
  const pid = await ensureProfileId(ctx);
  const { data: profile } = await ctx.admin.from("user_profile").select("*").eq("id", pid).single();
  return jsonOK({ user: ctx.user, profile });
}

/* ───────────────────────────────── PROFILE ───────────────────────────────── */

async function getProfile(_req: Request, ctx: Ctx) {
  const pid = await ensureProfileId(ctx);
  const { data, error } = await ctx.admin.from("user_profile").select("*").eq("id", pid).single();
  if (error) return jsonErr(error.message, 400);
  return jsonOK(data);
}

async function updateProfile(req: Request, ctx: Ctx) {
  const pid = await ensureProfileId(ctx);
  const body = await readJson(req);

  // Si envían name vacío, no lo sobrescribas a null en tablas NOT NULL
  if (typeof body.name === "string" && body.name.trim() === "") {
    delete (body as any).name;
  }

  const { data, error } = await ctx.admin
    .from("user_profile")
    .update(body)
    .eq("id", pid)
    .select()
    .single();
  if (error) return jsonErr(error.message, 400);
  return jsonOK(data);
}

// ───────────────────────────── PROFILE: subir avatar ─────────────────────────────
async function uploadAvatar(req: Request, ctx: Ctx) {
  const pid = await ensureProfileId(ctx);

  const ctype = req.headers.get("content-type") || "";
  if (!ctype.toLowerCase().includes("multipart/form-data")) {
    return jsonErr('Se espera multipart/form-data con campo "file"', 400);
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonErr('Falta el archivo en el campo "file"', 400);

  const buf = new Uint8Array(await file.arrayBuffer());
  const mime = file.type || "image/jpeg";

  // Extensión simple por mime
  const ext =
    mime.includes("png") ? "png" :
    mime.includes("webp") ? "webp" :
    "jpg";

  // Ruta destino en el bucket
  const path = `avatars/${pid}/${Date.now()}.${ext}`;

  // Subir al bucket "avatars" (debe existir)
  const { error: upErr } = await ctx.admin.storage
    .from("avatars")
    .upload(path, buf, { contentType: mime, upsert: true });

  if (upErr) return jsonErr(upErr.message, 400);

  // URL pública (si el bucket es público)
  const { data: pub } = ctx.admin.storage.from("avatars").getPublicUrl(path);
  const publicUrl = (pub && (pub as any).publicUrl) || "";

  // Guardar en el perfil
  await ctx.admin.from("user_profile")
    .update({ avatar_url: publicUrl })
    .eq("id", pid);

  return jsonOK({ url: publicUrl });
}

/* ────────────────────────────── TRANSACTIONS ────────────────────────────── */

async function listTransactions(req: Request, ctx: Ctx) {
  const pid = await ensureProfileId(ctx);
  const url = new URL(req.url);

  let from = url.searchParams.get("from") || undefined;
  let to = url.searchParams.get("to") || undefined;
  const month = url.searchParams.get("month") || undefined;

  if (!from && !to && month) {
    const r = monthToRange(month);
    from = r.from;
    to = r.to;
  }

  let q = ctx.admin
    .from("transaction")
    .select("*")
    .eq("user_id", pid)
    .order("occurred_at", { ascending: false });

  if (from) q = q.gte("occurred_at", from);
  if (to) q = q.lte("occurred_at", to);

  const { data, error } = await q;
  if (error) return jsonErr(error.message, 400);
  return jsonOK(data || []);
}

async function createTransaction(req: Request, ctx: Ctx) {
  const pid = await ensureProfileId(ctx);
  const body = await readJson(req);

  const type = body?.type === "expense" ? "expense" : "income";
  const rawAmount = Number(body?.amount || 0);
  const amount = type === "expense" ? -Math.abs(rawAmount) : Math.abs(rawAmount);
  if (!(Math.abs(amount) > 0)) return jsonErr("amount inválido", 400);

  const description = (body?.description ? String(body.description) : "").trim() || null;

  // Acepta "occurred_at" (correcto) o "date" (compatibilidad)
  const occurred_at =
    String((body as any)?.occurred_at || (body as any)?.date || "").trim() ||
    new Date().toISOString().slice(0, 10);

  const payload = {
    user_id: pid,
    type,
    amount,
    description,
    occurred_at,
    category_id: null as number | null,
  };

  // opcionalmente aceptar category_id al crear manualmente
  if (body && (body as any).category_id != null) {
    payload.category_id = Number((body as any).category_id);
  }

  const { data, error } = await ctx.admin
    .from("transaction")
    .insert(payload)
    .select()
    .single();

  if (error) return jsonErr(error.message, 400);
  return jsonOK({ id: (data as any).id }, 201);
}

async function summaryMonth(req: Request, ctx: Ctx) {
  const pid = await ensureProfileId(ctx);
  const url = new URL(req.url);
  const month = url.searchParams.get("month") || undefined;
  const range = monthToRange(month);

  const { data, error } = await ctx.admin
    .from("transaction")
    .select("amount,type,category_id")
    .eq("user_id", pid)
    .gte("occurred_at", range.from)
    .lte("occurred_at", range.to);

  if (error) return jsonErr(error.message, 400);

  let inc = 0;
  let exp = 0;
  const byCat = new Map<number, number>();

  for (const t of data || []) {
    const v = Number((t as any).amount || 0);
    const cat = (t as any).category_id as number | null;
    if (v >= 0) inc += v;
    else exp += Math.abs(v);

    if (cat != null) {
      const prev = byCat.get(cat) ?? 0;
      byCat.set(cat, prev + v);
    }
  }

  const net = inc - exp;
  const byCategory = Array.from(byCat.entries()).map(([category_id, total]) => ({
    category_id,
    total,
  }));

  return jsonOK({
    month: month || "",
    inc,
    exp,
    net,
    from: range.from,
    to: range.to,
    byCategory,
  });
}

/**
 * Importar movimientos.
 * - Puede recibir JSON: { rows: [...] }
 * - O multipart/form-data con:
 *    - campo "file" (Excel/CSV)
 *    - opcionalmente campo "rows" con JSON serializado
 */
async function importTransactions(req: Request, ctx: Ctx) {
  const pid = await ensureProfileId(ctx);
  const ctype = (req.headers.get("content-type") || "").toLowerCase();

  let rows: any[] = [];

  if (ctype.includes("application/json") || ctype.includes("text/json")) {
    // Modo antiguo: JSON { rows }
    const body = await readJson(req);
    rows = Array.isArray((body as any)?.rows) ? (body as any).rows : [];
  } else if (ctype.includes("multipart/form-data")) {
    // Nuevo: multipart/form-data
    const form = await req.formData();

    // 1) Si viene un campo "rows" en texto JSON, usarlo directo
    const rowsField = form.get("rows");
    if (typeof rowsField === "string") {
      try {
        const parsed = JSON.parse(rowsField);
        if (Array.isArray(parsed)) {
          rows = parsed;
        }
      } catch (e) {
        console.log("Error parseando rows desde formData:", e);
      }
    }

    // 2) Si no hay "rows", intentar leer archivo "file" (Excel/CSV)
    if (!rows.length) {
      const f = form.get("file");
      if (f instanceof File) {
        const buf = new Uint8Array(await f.arrayBuffer());
        const name = (f as any).name || "";
        const mime = f.type || "";
        const ext = (name.split(".").pop() || "").toLowerCase();

        try {
          if (ext === "csv" || mime.includes("csv") || mime === "text/plain") {
            const text = new TextDecoder("utf-8").decode(buf);
            // Heurística simple para delimitador ; o ,
            const delimiter =
              text.includes(";") && !text.includes(",") ? ";" : ",";
            rows = parseCsv(text, {
              columns: true,
              skip_empty_lines: true,
              delimiter,
            }) as any[];
          } else {
            // Asumir Excel
            const wb = XLSX.read(buf, { type: "buffer" });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            rows = XLSX.utils.sheet_to_json(sheet, { defval: null }) as any[];
          }
        } catch (e) {
          console.log("Error parseando archivo de import:", e);
        }
      }
    }
  } else {
    // Fallback: intentar JSON por si acaso
    const body = await readJson(req);
    rows = Array.isArray((body as any)?.rows) ? (body as any).rows : [];
  }

  if (!rows.length) {
    return jsonOK({ imported: 0 });
  }

  const todayIso = new Date().toISOString().slice(0, 10);

  const normalizeDate = (value: unknown): string => {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      // Serial Excel → usar UTC para evitar desfases
      const baseMs = Date.UTC(1899, 11, 30); // 1899-12-30
      const ms = baseMs + Math.round(value) * 86_400_000;
      const d = new Date(ms);
      return d.toISOString().slice(0, 10);
    }

    if (typeof value === "string") {
      const s = value.trim();
      if (!s) return todayIso;

      // dd/mm/yyyy o dd-mm-yyyy
      const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
      if (m) {
        const d = m[1].padStart(2, "0");
        const mo = m[2].padStart(2, "0");
        let y = m[3];
        if (y.length === 2) y = (Number(y) >= 70 ? "19" : "20") + y;
        const year = y.padStart(4, "0");
        return `${year}-${mo}-${d}`;
      }

      // yyyy-mm-dd
      const m2 = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (m2) {
        const year = m2[1];
        const mo = m2[2].padStart(2, "0");
        const d = m2[3].padStart(2, "0");
        return `${year}-${mo}-${d}`;
      }
    }

    return todayIso;
  };

  const parseAmountCLP = (raw: unknown): number | null => {
    if (raw == null) return null;
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;

    const s = String(raw).trim();
    if (!s) return null;
    const negative = s.includes("-");
    const cleaned = s.replace(/[^0-9,]/g, "");
    if (!cleaned) return null;
    const integerPart = cleaned.split(",")[0];
    const n = Number(integerPart);
    if (!Number.isFinite(n)) return null;
    return negative ? -n : n;
  };

  // cache categorías por nombre (lowercase)
  const catCache = new Map<string, number>();

  const getCategoryId = async (name: string): Promise<number | null> => {
    const key = name.trim().toLowerCase();
    if (!key) return null;
    const cached = catCache.get(key);
    if (cached) return cached;

    const { data: existing, error } = await ctx.admin
      .from("category")
      .select("id")
      .eq("name", name)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.log("category lookup error:", error.message || error);
    }

    if (existing && (existing as any).id) {
      const id = (existing as any).id as number;
      catCache.set(key, id);
      return id;
    }

    const { data: created, error: e2 } = await ctx.admin
      .from("category")
      .insert({ name })
      .select("id")
      .single();

    if (e2) {
      console.log("category insert error:", e2.message || e2);
      return null;
    }

    const id = (created as any).id as number;
    catCache.set(key, id);
    return id;
  };

  const toInsert: any[] = [];

  for (const r of rows) {
    const row = r as any;

    const rawDate = row.date ?? row.FECHA ?? row.fecha;
    const rawAmount = row.amount ?? row.MONTO ?? row.monto;
    const rawDesc = row.description ?? row.DESCRIPCION ?? row.descripcion;

    const parsedAmount = parseAmountCLP(rawAmount);
    if (parsedAmount === null || parsedAmount === 0) continue;

    const type = parsedAmount < 0 ? "expense" : "income";
    const occurred_at = normalizeDate(rawDate);
    const description =
      typeof rawDesc === "string" && rawDesc.trim().length > 0
        ? rawDesc.trim()
        : type === "income"
        ? "Ingreso"
        : "Gasto";

    const category_id = await getCategoryId(description);

    toInsert.push({
      user_id: pid,
      type,
      amount: parsedAmount,
      description,
      category_id,
      occurred_at,
    });
  }

  if (!toInsert.length) {
    return jsonOK({ imported: 0 });
  }

  const { error } = await ctx.admin.from("transaction").insert(toInsert);
  if (error) return jsonErr(error.message, 400);

  return jsonOK({ imported: toInsert.length });
}

/* ────────────────────────────────── GOALS ───────────────────────────────── */

async function listGoals(_req: Request, ctx: Ctx) {
  const pid = await ensureProfileId(ctx);
  const { data, error } = await ctx.admin
    .from("financial_goal")
    .select("*")
    .eq("user_id", pid)
    .order("created_at", { ascending: false });
  if (error) return jsonErr(error.message, 400);
  return jsonOK(data || []);
}

async function createGoal(req: Request, ctx: Ctx) {
  const pid = await ensureProfileId(ctx);
  const body = await readJson(req);

  const title = String(body?.title || "").trim();
  const target_amount = Number(body?.target_amount || 0);
  if (title.length < 2) return jsonErr("Título demasiado corto", 400);
  if (!(target_amount > 0)) return jsonErr("target_amount debe ser > 0", 400);

  const description =
    body?.description == null || String(body.description).trim() === ""
      ? undefined
      : String(body.description).trim();
  const deadline =
    body?.deadline == null || String(body.deadline).trim() === ""
      ? undefined
      : String(body.deadline).trim(); // "YYYY-MM-DD"

  const payload = {
    user_id: pid,
    title,
    target_amount,
    current_amount: 0,
    description,
    deadline,
  };

  const { data, error } = await ctx.admin
    .from("financial_goal")
    .insert(payload)
    .select()
    .single();

  if (error) return jsonErr(error.message, 400);
  return jsonOK({ id: (data as any).id }, 201);
}

async function updateGoal(req: Request, ctx: Ctx, goalId: number) {
  const pid = await ensureProfileId(ctx);
  const body = await readJson(req);

  const { data, error } = await ctx.admin
    .from("financial_goal")
    .update(body)
    .eq("id", goalId)
    .eq("user_id", pid)
    .select()
    .single();

  if (error) return jsonErr(error.message, 400);
  return jsonOK(data);
}

async function deleteGoal(_req: Request, ctx: Ctx, goalId: number) {
  const pid = await ensureProfileId(ctx);
  const { error } = await ctx.admin
    .from("financial_goal")
    .delete()
    .eq("id", goalId)
    .eq("user_id", pid);
  if (error) return jsonErr(error.message, 400);
  return jsonOK({ ok: true });
}

// POST /goals/:id/contribute
async function contributeGoal(req: Request, ctx: Ctx, goalId: number) {
  const pid = await ensureProfileId(ctx);
  const body = await readJson(req);
  const amount = Number(body?.amount || 0);
  const note = body?.note ? String(body.note) : null;
  if (!(amount > 0)) return jsonErr("amount debe ser > 0", 400);

  // 1) Confirmar que la meta es del usuario
  const { data: g, error: e0 } = await ctx.admin
    .from("financial_goal")
    .select("user_id,current_amount")
    .eq("id", goalId)
    .single();
  if (e0) return jsonErr(e0.message, 400);
  if (!g || Number((g as any).user_id) !== pid) return jsonErr("Meta no encontrada", 404);

  // 2) Insertar contribución (si tienes tabla goal_contribution)
  await ctx.admin.from("goal_contribution").insert({ goal_id: goalId, amount, note });

  // 3) Actualizar current_amount de la meta
  const next = Number((g as any).current_amount || 0) + amount;
  const { data: updated, error: e2 } = await ctx.admin
    .from("financial_goal")
    .update({ current_amount: next })
    .eq("id", goalId)
    .eq("user_id", pid)
    .select()
    .single();
  if (e2) return jsonErr(e2.message, 400);

  return jsonOK(updated);
}

// GET /goals/contributions/:goalId
async function listContributions(_req: Request, ctx: Ctx, goalId: number) {
  const pid = await ensureProfileId(ctx);

  // validar ownership
  const { data: g, error: e0 } = await ctx.admin
    .from("financial_goal")
    .select("user_id")
    .eq("id", goalId)
    .single();
  if (e0) return jsonErr(e0.message, 400);
  if (!g || Number((g as any).user_id) !== pid) return jsonErr("Meta no encontrada", 404);

  const { data, error } = await ctx.admin
    .from("goal_contribution")
    .select("*")
    .eq("goal_id", goalId)
    .order("created_at", { ascending: false });

  if (error) return jsonErr(error.message, 400);
  return jsonOK(data || []);
}

/* ─────────────────────────────────── NEWS ─────────────────────────────────── */

async function newsRates(_req: Request, ctx: Ctx) {
  const { data, error } = await ctx.admin
    .from("fx_snapshot")
    .select("base, usd, eur, uf, taken_at")
    .order("taken_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return jsonErr(error.message, 400);
  const r = (data || {}) as any;
  return jsonOK({
    base: String(r.base || "CLP"),
    usd: Number(r.usd) || 0,
    eur: Number(r.eur) || 0,
    uf: Number(r.uf) || 0,
    updatedAt: r.taken_at || new Date().toISOString(),
  });
}

async function newsFeed(_req: Request, ctx: Ctx) {
  const { data, error } = await ctx.admin
    .from("news_seen")
    .select("article_id,title,url,source,published_at")
    .order("published_at", { ascending: false })
    .limit(20);
  if (error) return jsonErr(error.message, 400);

  const items = (data || []).map((r: any) => ({
    id: r.article_id,
    title: r.title,
    url: r.url,
    source: r.source,
    published_at: r.published_at,
  }));
  return jsonOK(items);
}

/* ───────────────────────────── RECOMMENDATIONS ───────────────────────────── */

async function listRecommendations(_req: Request, ctx: Ctx) {
  const pid = await ensureProfileId(ctx);
  const { data, error } = await ctx.admin
    .from("recommendation")
    .select("*")
    .eq("user_id", pid)
    .order("created_at", { ascending: false });
  if (error) return jsonErr(error.message, 400);
  return jsonOK(data || []);
}

/* ─────────────────────────────────── PUSH ─────────────────────────────────── */

async function pushRegister(req: Request, ctx: Ctx) {
  const pid = await ensureProfileId(ctx);
  const body = await readJson(req);
  const token = String(body?.token || "").trim();
  const platform = String(body?.platform || "").trim(); // 'ios' | 'android' | 'web'
  if (!token) return jsonErr("token requerido", 400);

  const { error } = await ctx.admin
    .from("push_token")
    .upsert({ user_id: pid, token, platform }, { onConflict: "token" })
    .select();

  if (error) return jsonErr(error.message, 400);
  return jsonOK({ ok: true });
}

/* ─────────────────────────────────── CHAT ─────────────────────────────────── */

async function chatHistory(_req: Request, ctx: Ctx) {
  const pid = await ensureProfileId(ctx);
  const { data, error } = await ctx.admin
    .from("chat_message")
    .select("id,user_id,sender,message,timestamp")
    .eq("user_id", pid)
    .order("timestamp", { ascending: true })
    .limit(200);
  if (error) return jsonErr(error.message, 400);
  return jsonOK(data || []);
}

async function chatSend(req: Request, ctx: Ctx) {
  const pid = await ensureProfileId(ctx);
  const body = await readJson(req);
  const message = String(body?.message || "").trim();
  if (!message) return jsonErr("message requerido", 400);

  // 1) guardar mensaje del usuario
  const { data: userMsg, error: e1 } = await ctx.admin
    .from("chat_message")
    .insert({ user_id: pid, sender: "user", message }) // timestamp: default now()
    .select()
    .single();
  if (e1) return jsonErr(e1.message, 400);

  // 2) llamar a GROQ
  const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";
  const GROQ_MODEL = Deno.env.get("GROQ_MODEL") ?? "llama-3.1-8b-instant";
  if (!GROQ_API_KEY) return jsonErr("Falta GROQ_API_KEY en variables de entorno", 500);

  // contexto breve a partir del historial reciente
  const { data: lastMsgs } = await ctx.admin
    .from("chat_message")
    .select("sender,message")
    .eq("user_id", pid)
    .order("timestamp", { ascending: false })
    .limit(12);

  const msgs = (lastMsgs || [])
    .reverse()
    .map((m: any) => ({ role: m.sender === "user" ? "user" : "assistant", content: String(m.message || "") }));

  msgs.push({ role: "user", content: message });

  let botText = "Entendido.";
  try {
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: msgs,
        temperature: 0.3,
      }),
    });

    const out: any = await resp.json().catch(() => ({}));
    botText =
      out?.choices?.[0]?.message?.content?.trim?.() ||
      out?.choices?.[0]?.message?.content ||
      "🤖";
  } catch (_e) {
    botText = "Tuve un problema para generar la respuesta, intenta de nuevo.";
  }

  // 3) guardar respuesta del bot
  const { data: botMsg, error: e2 } = await ctx.admin
    .from("chat_message")
    .insert({ user_id: pid, sender: "bot", message: botText })
    .select()
    .single();
  if (e2) return jsonErr(e2.message, 400);

  // 4) compat con tu front { user, bot }
  return jsonOK({ user: userMsg, bot: botMsg });
}

/* ───────────────────────────────── ROUTER ───────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return withCORS(jsonOK("ok"));

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE) {
    return withCORS(jsonErr("Faltan variables de entorno de Supabase", 500));
  }

  const url = new URL(req.url);
  let path = url.pathname;
  path = path.replace(/^\/functions\/v1/, "");
  if (!path.startsWith("/api")) path = "/api" + path;
  const p = path.replace(/^\/api/, "") || "/";

  console.log(`[api] ${req.method} ${p}`);

  // Healthcheck
  if (p === "/health" && (req.method === "GET" || req.method === "HEAD")) {
    return withCORS(jsonOK({ ok: true, time: new Date().toISOString() }));
  }

  const sb = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data: auth } = await sb.auth.getUser();
  const user: UserLike = auth?.user ?? null;
  const ctx: Ctx = { sb, admin, user, profileId: null };

  try {
    async function getWebpayConfig() {
      const commerce = Deno.env.get("TRANSBANK_COMMERCE_CODE") ?? "";
      const apiKey = Deno.env.get("TRANSBANK_API_KEY") ?? "";
      const base = Deno.env.get("WEBPAY_BASE_URL") ?? "https://webpay3gint.transbank.cl";
      if (!commerce || !apiKey) throw new Error("Faltan credenciales de Webpay");
      return { commerce, apiKey, base };
    }

    async function webpayCreateTransaction(amount: number, buy_order: string, session_id: string, return_url: string) {
      const { commerce, apiKey, base } = await getWebpayConfig();
      const url = `${base}/rswebpaytransaction/api/webpay/v1.2/transactions`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Tbk-Api-Key-Id": commerce, "Tbk-Api-Key-Secret": apiKey },
        body: JSON.stringify({ amount, buy_order, session_id, return_url }),
      });
      const txt = await res.text();
      if (!res.ok) throw new Error((JSON.parse(txt) as any)?.error || `HTTP ${res.status}`);
      const j = JSON.parse(txt);
      const token: string = j.token;
      const wbUrl: string = j.url;
      return { token, url: `${wbUrl}?token_ws=${token}` };
    }

    async function webpayCommit(token: string) {
      const { commerce, apiKey, base } = await getWebpayConfig();
      const url = `${base}/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`;
      const res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json", "Tbk-Api-Key-Id": commerce, "Tbk-Api-Key-Secret": apiKey } });
      const txt = await res.text();
      if (!res.ok) throw new Error((JSON.parse(txt) as any)?.error || `HTTP ${res.status}`);
      return JSON.parse(txt);
    }

    if (p === "/payments/deposit" && req.method === "POST") {
      const pid = await ensureProfileId(ctx);
      const body = await readJson(req);
      const amount = Number(body?.amount || 0);
      if (!(amount > 0)) return withCORS(jsonErr("amount debe ser > 0", 400));
      const origin = new URL(req.url).origin;
      const retBase = Deno.env.get("WEBPAY_RETURN_URL") || `${origin}/functions/v1/api/payments/webpay/return`;
      const depId = `dep_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
      try {
        const t = await webpayCreateTransaction(amount, depId, String(pid), retBase);
        return withCORS(jsonOK({ provider: "webpay", deposit_id: depId, token: t.token, payment_url: t.url }, 201));
      } catch (e) {
        const msg = (e as any)?.message || "No se pudo crear el depósito";
        return withCORS(jsonErr(msg, 400));
      }
    }

    if (p === "/payments/webpay/return" && (req.method === "GET" || req.method === "POST")) {
      const url = new URL(req.url);
      const token = String(url.searchParams.get("token_ws") || (await readJson(req))?.token_ws || "");
      if (!token) return withCORS(jsonErr("Falta token_ws", 400));
      try {
        const commit = await webpayCommit(token);
        if (String(commit?.status).toUpperCase() !== "AUTHORIZED") {
          return withCORS(jsonOK({ ok: false, status: commit?.status }));
        }
        const amount = Number(commit?.amount || 0);
        const userId = Number(commit?.session_id || 0);
        if (!userId || !amount) return withCORS(jsonOK({ ok: false }));
        const today = new Date().toISOString().slice(0, 10);
        const { error } = await ctx.admin
          .from("transaction")
          .insert({ user_id: userId, amount, type: "income", description: "Depósito Webpay", occurred_at: today });
        if (error) return withCORS(jsonErr(error.message, 400));
        return withCORS(jsonOK({ ok: true }));
      } catch (e) {
        const msg = (e as any)?.message || "Commit Webpay falló";
        return withCORS(jsonErr(msg, 400));
      }
    }
    // AUTH
    if (p === "/auth/login" && req.method === "POST") return withCORS(await authLogin(req, ctx));
    if (p === "/auth/register" && req.method === "POST") return withCORS(await authRegister(req, ctx));
    if (p === "/auth/me" && req.method === "GET") return withCORS(await authMe(req, ctx));
    if (p === "/auth/logout" && req.method === "POST") return withCORS(jsonOK({ ok: true }));

    // PROFILE
    if (p === "/profile" && req.method === "GET") return withCORS(await getProfile(req, ctx));
    if (p === "/profile" && req.method === "PUT") return withCORS(await updateProfile(req, ctx));
    if (p === "/profile/avatar" && req.method === "POST") return withCORS(await uploadAvatar(req, ctx));

    // TRANSACTIONS
    if (p === "/transactions" && req.method === "GET") return withCORS(await listTransactions(req, ctx));
    if (p === "/transactions" && req.method === "POST") return withCORS(await createTransaction(req, ctx));
    if (p === "/transactions/import" && req.method === "POST")
      return withCORS(await importTransactions(req, ctx));
    if (p.startsWith("/transactions/summary/month") && req.method === "GET")
      return withCORS(await summaryMonth(req, ctx));

    // GOALS
    if (p === "/goals" && req.method === "GET") return withCORS(await listGoals(req, ctx));
    if (p === "/goals" && req.method === "POST") return withCORS(await createGoal(req, ctx));

    const mGoal = p.match(/^\/goals\/(\d+)$/);
    if (mGoal && req.method === "PATCH") return withCORS(await updateGoal(req, ctx, Number(mGoal[1])));
    if (mGoal && req.method === "DELETE") return withCORS(await deleteGoal(req, ctx, Number(mGoal[1])));

    const mContrib = p.match(/^\/goals\/(\d+)\/contribute$/);
    if (mContrib && req.method === "POST")
      return withCORS(await contributeGoal(req, ctx, Number(mContrib[1])));

    const mListContrib = p.match(/^\/goals\/contributions\/(\d+)$/);
    if (mListContrib && req.method === "GET") {
      return withCORS(await listContributions(req, ctx, Number(mListContrib[1])));
    }

    // NEWS
    if (p === "/news/rates" && req.method === "GET") return withCORS(await newsRates(req, ctx));
    if (p === "/news/feed" && req.method === "GET") return withCORS(await newsFeed(req, ctx));

    // RECOMMENDATIONS
    if (p === "/recommendations" && req.method === "GET")
      return withCORS(await listRecommendations(req, ctx));

    // PUSH TOKENS
    if (p === "/push/register" && req.method === "POST")
      return withCORS(await pushRegister(req, ctx));

    // CHAT
    if (p === "/chat" && req.method === "GET") return withCORS(await chatHistory(req, ctx));
    if ((p === "/chat/message" || p === "/chat") && req.method === "POST")
      return withCORS(await chatSend(req, ctx));

    return withCORS(jsonErr(`Not Found: ${p}`, 404));
  } catch (e: unknown) {
    const msg =
      e && typeof e === "object" && "message" in e
        ? String((e as any).message)
        : "Internal error";
    console.log("[api][error]", msg);
    return withCORS(jsonErr(msg, 400));
  }
});
