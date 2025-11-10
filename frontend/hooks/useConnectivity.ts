import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

type ConnectivityState = {
  online: boolean;
  lastChangeAt: number | null;
};

async function pingInternet(timeoutMs = 4000): Promise<boolean> {
  // Usamos un endpoint muy ligero común; en web evitamos usarlo por CORS
  const url = 'https://www.google.com/generate_204';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'GET', signal: ctrl.signal });
    clearTimeout(timer);
    return !!res && (res.status >= 200 && res.status < 500);
  } catch {
    clearTimeout(timer);
    return false;
  }
}

export function useConnectivity(intervalMs = 8000) {
  const [state, setState] = useState<ConnectivityState>({ online: true, lastChangeAt: null });
  const prevOnlineRef = useRef<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const onUp = () => {
        if (!mounted) return;
        setState((s) => ({ online: true, lastChangeAt: Date.now() }));
      };
      const onDown = () => {
        if (!mounted) return;
        setState((s) => ({ online: false, lastChangeAt: Date.now() }));
      };
      // Estado inicial
      setState({ online: typeof navigator !== 'undefined' ? !!navigator.onLine : true, lastChangeAt: Date.now() });
      window.addEventListener('online', onUp);
      window.addEventListener('offline', onDown);
      return () => {
        mounted = false;
        window.removeEventListener('online', onUp);
        window.removeEventListener('offline', onDown);
      };
    }

    // Nativo: ping periódico
    let cancelled = false;
    const check = async () => {
      const ok = await pingInternet().catch(() => false);
      if (cancelled) return;
      setState((s) => {
        const changed = s.online !== ok;
        return { online: ok, lastChangeAt: changed ? Date.now() : s.lastChangeAt };
      });
    };
    // estado inicial
    check();
    const id = setInterval(check, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  const wasOnline = prevOnlineRef.current;
  prevOnlineRef.current = state.online;

  const cameBackOnline = useMemo(() => {
    return wasOnline === false && state.online === true ? Date.now() : null;
  }, [state.online, wasOnline]);

  return { online: state.online, lastChangeAt: state.lastChangeAt, cameBackOnline };
}