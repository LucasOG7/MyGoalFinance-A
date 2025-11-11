// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../supabase';

type AuthedReq = Request & { user?: any; token?: string };

export async function requireAuth(
  req: AuthedReq,
  res: Response,
  next: NextFunction
) {
  const PROD = process.env.NODE_ENV === 'production';
  const ALLOW_QUERY_TOKEN = process.env.ALLOW_QUERY_TOKEN === '1';
  let token: string | undefined;

  // 1) Header Authorization: Bearer <token>
  const auth = req.headers.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    token = auth.slice(7);
  }

  // 2) Fallback para SSE/web: query param ?t=<token> (o ?token=)
  //    Deshabilitado por defecto en producción para evitar fuga en logs/caches.
  if (!token) {
    if (!PROD || ALLOW_QUERY_TOKEN) {
      const qp = (req.query?.t ?? req.query?.token) as string | string[] | undefined;
      if (typeof qp === 'string' && qp.length > 0) token = qp;
      if (Array.isArray(qp) && qp.length > 0) token = qp[0];
    }
  }

  if (!token) {
    return res.status(401).json({ detail: 'Falta token' });
  }

  // 3) Verifica el token con Supabase
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ detail: 'Token inválido' });
  }

  // 4) Adjunta el usuario y el token a la request
  req.user = data.user;     // { id, email, ... }
  req.token = token;        // útil si luego quieres crear un cliente supabase-as-user
  next();
}
