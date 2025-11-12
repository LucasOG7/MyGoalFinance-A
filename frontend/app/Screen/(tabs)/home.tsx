// app/Screen/(tabs)/home.tsx
import styles from '@/Styles/homeStyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../constants/api';
import { useAuth } from '../../../store/auth';

// Meses (abreviado)
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

type SummaryMonth = {
  month: string;
  inc: number;
  exp: number;
  net: number;
};

type Rates = { base: 'CLP'; usd: number; eur: number; uf: number; updatedAt: string };

// ▼ NUEVO: tipo UI para metas + mapeo
type GoalUI = { id: string; title: string; target: number; current: number };
function mapGoalUI(g: any): GoalUI {
  return {
    id: String(g.id),
    title: g.title || g.name || 'Meta',
    target: Number(g.target_amount ?? 0),
    current: Number(g.current_amount ?? 0),
  };
}

// Lista común de Acciones rápidas (Home y menú)
const QUICK_ACTIONS: { label: string; icon: keyof typeof Ionicons.glyphMap; route: Href }[] = [
  { label: 'Chatbot', icon: 'chatbox-ellipses', route: '/Screen/(tabs)/chatbot' },
  { label: 'Metas', icon: 'flag', route: '/Screen/(tabs)/goals' },
  { label: 'Recomendaciones', icon: 'sparkles-sharp', route: '/Screen/(tabs)/recommendation' },
  { label: 'Dashboard', icon: 'analytics-sharp', route: '/Screen/(tabs)/dashboard' },
];

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshMe, logout } = useAuth();
  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Selector de año y datos para gráfico de barras (ingresos por mes)
  const thisYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(thisYear);
  const [monthlyIncome, setMonthlyIncome] = useState<{ label: string; value: number; ym?: string }[]>([]);

  const [profile, setProfile] = useState<any>(null);
  const [sum, setSum] = useState<SummaryMonth | null>(null);
  const [rates, setRates] = useState<Rates | null>(null);
  // ▼ metas ahora tipadas con GoalUI
  const [goals, setGoals] = useState<GoalUI[]>([]);

  // Header UI states
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body?: string }>>([]);
  const [headerH, setHeaderH] = useState(0);

  const firstName = useMemo(() => {
    const n = profile?.name || '';
    return n.split(' ')[0] || '¡Hola!';
  }, [profile]);

  // Avatar desde el store si existe; fallback a pravatar usando email
  const avatarUri = useMemo(() => {
    if (user?.avatar_uri) return String(user.avatar_uri);
    const key = user?.email || profile?.email || 'user';
    return 'https://i.pravatar.cc/300?u=' + key;
  }, [user?.avatar_uri, user?.email, profile?.email]);

  const load = useCallback(async () => {
    try {
      setBusy(true);
      const [p, s, r, g, t] = await Promise.allSettled([
        api.getProfile(),
        api.summaryMonth(),           // KPIs mes actual
        api.newsRates(),              // USD/EUR/UF
        api.listGoals(),              // metas del usuario
        api.listTransactions({ from: `${selectedYear}-01-01`, to: `${selectedYear}-12-31` }), // transacciones del año seleccionado
      ]);

      if (p.status === 'fulfilled') setProfile(p.value);
      if (s.status === 'fulfilled') {
        const { inc, exp, net, month } = s.value as any;
        setSum({ inc, exp, net, month });
      }
      if (r.status === 'fulfilled') setRates(r.value as Rates);
      if (g.status === 'fulfilled') {
        const arr = (g.value as any[] | undefined) ?? [];
        setGoals(arr.slice(0, 2).map(mapGoalUI)); // ← mostrar solo 2 metas en Home
      }
      if (t.status === 'fulfilled') {
        const txs = (t.value as any[]) ?? [];
        setMonthlyIncome(buildMonthlyIncome(txs, selectedYear));
      }
    } finally {
      setBusy(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    load();
  }, [load]);

  // Suscripción a notificaciones para poblar el dropdown
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((n) => {
      const id = String((n as any)?.request?.identifier ?? Date.now());
      const title = (n as any)?.request?.content?.title ?? 'Notificación';
      const body = (n as any)?.request?.content?.body ?? '';
      setNotifications((arr) => [{ id, title, body }, ...arr].slice(0, 10));
    });
    return () => { sub.remove(); };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Refrescar usuario (incluye avatar_uri desde AsyncStorage) y datos del dashboard
      await refreshMe();
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load, refreshMe]);

  const onLogout = useCallback(async () => {
    try {
      await logout();
      router.replace('/Screen/login');
    } catch {}
  }, [logout, router]);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <StatusBar style="light" />
      {/* Header */}
      <LinearGradient colors={['#0f172a', '#0f172a']} style={styles.header} onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}>
        <View style={styles.headerContent}>
          {/* icono app + nombre usuario */}
          <View style={styles.headerLeft}>
            <Ionicons name="wallet" size={22} color="#f59e0b" style={styles.appIcon} />
            <Text style={styles.h1} numberOfLines={1}>
              {firstName || 'Usuario'}
            </Text>
          </View>

          {/* campana, menú, avatar */}
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => setNotifOpen((v) => !v)}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Abrir notificaciones"
            >
              <Ionicons name="notifications-outline" size={18} color="#c8d0e3" />
            </Pressable>

            <Pressable
              onPress={() => setMenuOpen((v) => !v)}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Abrir menú"
            >
              <Ionicons name="ellipsis-vertical" size={18} color="#c8d0e3" />
            </Pressable>

            <TouchableOpacity
              onPress={() => router.push('/Screen/profile')}
              style={styles.profileButton}
            >
              <Image source={{ uri: avatarUri }} style={styles.profileImage} />
            </TouchableOpacity>
          </View>
        </View>

      </LinearGradient>

      {/* Dropdowns anclados como overlay bajo el header */}
      {notifOpen && (
        <NotificationsDropdown
          notifications={notifications}
          onClose={() => setNotifOpen(false)}
          topOffset={headerH}
        />
      )}
      {menuOpen && (
        <MenuDropdown
          actionsOpen={actionsOpen}
          onToggleActions={() => setActionsOpen((v) => !v)}
          onProfile={() => router.push('/Screen/(tabs)/profile')}
          onSettings={() => router.push('/Screen/editprofile')}
          onLogout={onLogout}
          onClose={() => setMenuOpen(false)}
          topOffset={headerH}
        />
      )}

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 40 : 16 }
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* KPIs (primero visible) */}
        <View style={styles.row}>
          <KpiCard label="Ingresos" value={sum?.inc ?? 0} color="#26c281" icon="arrow-up-circle" />
          <KpiCard label="Gastos" value={sum?.exp ?? 0} color="#ff5a5f" icon="arrow-down-circle" />
          <KpiCard label="Neto" value={sum?.net ?? 0} color="#4dabf7" icon="wallet" />
        </View>

        {/* Gráfico: Ingresos por mes (debajo de KPIs) */}
        <View style={styles.dashboardCard}>
          <View style={styles.yearSelector}>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.yearArrowBtn}
              onPress={() => setSelectedYear((y) => y - 1)}
            >
              <Text style={styles.yearArrowTxt}>{'<'}</Text>
            </TouchableOpacity>
            {[selectedYear - 2, selectedYear - 1, selectedYear].map((y) => (
              <TouchableOpacity
                key={y}
                onPress={() => setSelectedYear(y)}
                style={[styles.yearBtn, y === selectedYear && styles.yearBtnActive]}
              >
                <Text style={styles.yearBtnTxt}>{y}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.yearArrowBtn}
              onPress={() => setSelectedYear((y) => y + 1)}
            >
              <Text style={styles.yearArrowTxt}>{'>'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.dashboardLabel}>Ingresos por mes (Año {selectedYear})</Text>
          <View style={styles.barChartWrap}>
            <BarChart
              data={monthlyIncome}
              onBarPress={(ym) => {
                if (!ym) return;
                router.push({ pathname: '/Screen/(tabs)/transactions', params: { month: ym } });
              }}
            />
          </View>
        </View>

        {/* Acciones rápidas */}
        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
        <View style={styles.quickRow}>
          {QUICK_ACTIONS.map((a) => (
            <QuickButton key={a.label} label={a.label} icon={a.icon} onPress={() => router.push(a.route)} />
          ))}
        </View>

        {/* Goals preview */}
        <Section
          title="Tus metas activas"
          actionLabel="Ver metas"
          onAction={() => router.push('/Screen/(tabs)/goals')}
        >
          {busy ? (
            <Loader />
          ) : goals.length === 0 ? (
            <Empty text="Aún no tienes metas activas. ¡Crea una para empezar!" />
          ) : (
            goals.map((g) => {
              const pct = g.target > 0 ? Math.min((g.current / g.target) * 100, 100) : 0;
              return (
                <Pressable
                  key={g.id}
                  onPress={() => router.push('/Screen/(tabs)/goals')}
                  style={styles.tile}
                >
                  <Text style={styles.tileTitle}>{g.title}</Text>
                  <Text style={styles.tileSubtitle}>
                    Progreso: {formatCLP(g.current)} / {formatCLP(g.target)} CLP
                  </Text>

                  {/* Barra de progreso inline (sin depender de estilos externos) */}
                  <View style={{ height: 8, backgroundColor: '#e2e8f015', borderRadius: 999, marginTop: 8, overflow: 'hidden' }}>
                    <View style={{ width: `${pct}%`, height: '100%', backgroundColor: '#22c55e' }} />
                  </View>
                  <Text style={{ color: '#94a3b8', marginTop: 6 }}>{pct.toFixed(0)}% completado</Text>
                </Pressable>
              );
            })
          )}
        </Section>

        {/* Tipos de cambio (último) */}
        <Section title="Tipos de cambio">
          <View style={styles.row}>
            <RateCard title="Dólar (USD):" value={rates?.usd} hint="1 CLP → USD" />
            <RateCard title="Euro (EUR):" value={rates?.eur} hint="1 CLP → EUR" />
            <RateCard title="UF:" value={rates?.uf} hint={rates ? `Fecha: ${new Date(rates.updatedAt).toLocaleDateString()}` : ''} />
          </View>
        </Section>

        {/* Bottom padding para tabs */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ----------------------------- UI helpers ----------------------------- */

// Construye array {label, value, ym} con ingresos por mes del año seleccionado
function buildMonthlyIncome(txs: any[], year: number): { label: string; value: number; ym: string }[] {
  const map: Record<string, number> = {};
  for (let m = 1; m <= 12; m++) {
    const ym = `${year}-${String(m).padStart(2, '0')}`;
    map[ym] = 0;
  }
  for (const t of txs ?? []) {
    const ym = String(t?.occurred_at ?? '').slice(0, 7);
    if (t?.type === 'income' && map[ym] != null) {
      map[ym] += Number(t?.amount ?? 0);
    }
  }
  return Array.from({ length: 12 }, (_, i) => {
    const ym = `${year}-${String(i + 1).padStart(2, '0')}`;
    return {
      label: MONTHS_SHORT[i],
      value: map[ym] ?? 0,
      ym,
    };
  });
}

function BarChart({ data, onBarPress }: { data: { label: string; value: number; ym?: string }[]; onBarPress?: (ym: string) => void }) {
  const max = Math.max(...(data?.map((d) => d.value) ?? [0]), 1);
  const MAX_H = 140;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.barScroll}
      contentContainerStyle={styles.barChartRow}
    >
      {(data ?? []).map((d, idx) => {
        const h = Math.round((d.value / max) * MAX_H);
        return (
          <TouchableOpacity key={idx} style={styles.barItem} onPress={() => d.ym && onBarPress?.(d.ym)}>
            <View style={[styles.bar, { height: h }]} />
            <Text style={styles.barValue}>{formatCLP(d.value)}</Text>
            <Text style={styles.barLabel}>{d.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function KpiCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.kpi}>
      <View style={[styles.kpiIconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color }]}>{formatCLP(value)}</Text>
    </View>
  );
}

function RateCard({ title, value, hint }: { title: string; value?: number | null; hint?: string }) {
  return (
    <View style={styles.rate}>
      <Text style={styles.rateTitle}>{title}</Text>
      <Text style={styles.rateValue}>{value != null ? formatRate(value) : '—'}</Text>
      {!!hint && <Text style={styles.rateHint}>{hint}</Text>}
    </View>
  );
}

function QuickButton({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable 
      onPress={onPress} 
      style={({ pressed }) => [
        styles.quickBtn,
        pressed && { transform: [{ scale: 0.95 }], opacity: 0.8 }
      ]}
    >
      <Ionicons name={icon} size={22} color="#1f2738" />
      <Text style={styles.quickTxt} numberOfLines={1} ellipsizeMode="tail">{label}</Text>
    </Pressable>
  );
}

/* ------------------------------ Header dropdowns ------------------------------ */
function NotificationsDropdown({ notifications, onClose, topOffset }: { notifications: Array<{ id: string; title: string; body?: string }>; onClose: () => void; topOffset: number }) {
  return (
    <View style={[styles.dropdownWrap, { top: topOffset }] }>
      <View style={styles.dropdownCard}>
        <View style={styles.dropdownTop}>
          <Text style={styles.dropdownTitle}>Notificaciones</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={16} color="#cbd5e1" />
          </Pressable>
        </View>
        {notifications.length === 0 ? (
          <View style={styles.dropdownEmpty}>
            <Text style={styles.dropdownEmptyTxt}>No hay notificaciones</Text>
          </View>
        ) : (
          notifications.slice(0, 6).map((n) => (
            <View key={n.id} style={styles.dropdownItem}>
              <View style={styles.dropdownIconWrap}>
                <Ionicons name="notifications" size={14} color="#f59e0b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dropdownItemTitle} numberOfLines={1}>{n.title}</Text>
                {!!n.body && (
                  <Text style={styles.dropdownItemDesc} numberOfLines={1} ellipsizeMode="tail">{n.body}</Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

function MenuDropdown({ actionsOpen, onToggleActions, onProfile, onSettings, onLogout, onClose, topOffset }: {
  actionsOpen: boolean;
  onToggleActions: () => void;
  onProfile: () => void;
  onSettings: () => void;
  onLogout: () => void;
  onClose: () => void;
  topOffset: number;
}) {
  const router = useRouter();
  return (
    <View style={[styles.dropdownWrap, { top: topOffset }] }>
      <View style={styles.dropdownCard}>
        <View style={styles.dropdownTop}>
          <Text style={styles.dropdownTitle}>Menú</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={16} color="#cbd5e1" />
          </Pressable>
        </View>
        <Pressable style={styles.dropdownItem} onPress={onProfile}>
          <View style={styles.dropdownIconWrap}><Ionicons name="person" size={14} color="#f59e0b" /></View>
          <Text style={styles.dropdownItemTitle}>Mi perfil</Text>
        </Pressable>

        {/* Acciones rápidas con submenú */}
        <View style={styles.dropdownItemRow}>
          <Pressable
            style={styles.dropdownLeft}
            onPress={onToggleActions}
            accessibilityRole="button"
            accessibilityLabel="Alternar acciones rápidas"
          >
            <View style={styles.dropdownIconWrap}><Ionicons name="flash" size={14} color="#f59e0b" /></View>
            <Text style={styles.dropdownItemTitle}>Acciones rápidas</Text>
          </Pressable>
          <Pressable
            onPress={onToggleActions}
            hitSlop={8}
            style={styles.dropdownChevronBtn}
            accessibilityRole="button"
            accessibilityLabel={actionsOpen ? 'Cerrar submenú' : 'Abrir submenú'}
          >
            <Ionicons name={actionsOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#cbd5e1" />
          </Pressable>
        </View>
        {actionsOpen && (
          <View style={styles.submenu}>
            {QUICK_ACTIONS.map((a) => (
              <Pressable key={a.label} style={styles.submenuItem} onPress={() => router.push(a.route)}>
                <Ionicons name={a.icon} size={14} color="#cbd5e1" />
                <Text style={styles.submenuText}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable style={styles.dropdownItem} onPress={onSettings}>
          <View style={styles.dropdownIconWrap}><Ionicons name="settings" size={14} color="#f59e0b" /></View>
          <Text style={styles.dropdownItemTitle}>Configuración</Text>
        </Pressable>
        <Pressable style={styles.dropdownItem} onPress={onLogout}>
          <View style={styles.dropdownIconWrap}><Ionicons name="log-out" size={14} color="#f59e0b" /></View>
          <Text style={styles.dropdownItemTitle}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Section({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTop}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={8}>
            <Text style={styles.sectionAction}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      <View>{children}</View>
    </View>
  );
}

function Loader() {
  return (
    <View style={styles.loader}>
      <ActivityIndicator />
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTxt}>{text}</Text>
    </View>
  );
}

/* ------------------------------ helpers ------------------------------ */

function formatCLP(n: number) {
  try {
    return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
  } catch {
    return `$${Math.round(n)}`;
  }
}
function formatRate(n: number) {
  // n: valor unitario (ej: 0.001051 USD por CLP)
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 3 });
  if (n >= 1) return n.toFixed(3);
  return n.toPrecision(3);
}
