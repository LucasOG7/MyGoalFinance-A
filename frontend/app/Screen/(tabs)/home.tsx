// app/Screen/(tabs)/home.tsx
import styles from '@/Styles/homeStyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../../constants/api';

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

export default function Home() {
  const router = useRouter();
  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'1D' | '1M' | '12M'>('1M');

  const [profile, setProfile] = useState<any>(null);
  const [sum, setSum] = useState<SummaryMonth | null>(null);
  const [rates, setRates] = useState<Rates | null>(null);
  // ▼ metas ahora tipadas con GoalUI
  const [goals, setGoals] = useState<GoalUI[]>([]);

  const firstName = useMemo(() => {
    const n = profile?.name || '';
    return n.split(' ')[0] || '¡Hola!';
  }, [profile]);

  // Avatar dinámico basado en el email del usuario
  const avatarUri = useMemo(() => {
    return "https://i.pravatar.cc/300?u=" + (profile?.email || "user");
  }, [profile?.email]);

  const load = useCallback(async () => {
    try {
      setBusy(true);
      const [p, s, r, g] = await Promise.allSettled([
        api.getProfile(),
        api.summaryMonth(),           // KPIs mes actual
        api.newsRates(),              // USD/EUR/UF
        api.listGoals(),              // metas del usuario
      ]);

      if (p.status === 'fulfilled') setProfile(p.value);
      if (s.status === 'fulfilled') {
        const { inc, exp, net, month } = s.value as any;
        setSum({ inc, exp, net, month });
      }
      if (r.status === 'fulfilled') setRates(r.value as Rates);
      if (g.status === 'fulfilled') {
        const arr = (g.value as any[] | undefined) ?? [];
        setGoals(arr.slice(0, 3).map(mapGoalUI)); // ← mapeo a UI + limit 3
      }
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      {/* Header */}
      <LinearGradient colors={['#2e3b55', '#1f2738']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            {/* <Text style={styles.brand}>MyGoalFinance</Text> */}
            <Text style={styles.h1}>¡Hola, {firstName}! </Text>
            <Text style={styles.subtitle}>Tu panel de control financiero</Text>
          </View>
          {/* Profile Picture */}
          <TouchableOpacity 
            onPress={() => router.push('/Screen/profile')}
            style={styles.profileButton}
          >
            <Image
              source={{ uri: avatarUri }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Dashboard Principal - Total Ingresos */}
        <View style={styles.dashboardCard}>
          <Text style={styles.dashboardLabel}>Total Ingresos</Text>
          <Text style={styles.dashboardValue}>{formatCLP(sum?.inc ?? 0)}</Text>
          <View style={styles.dashboardIcon}>
            <Ionicons name="link" size={20} color="#666" />
          </View>
          
          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {(['1D', '1M', '12M'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                onPress={() => setSelectedPeriod(period)}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive
                ]}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive
                ]}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* KPIs */}
        <View style={styles.row}>
          <KpiCard label="Ingresos" value={sum?.inc ?? 0} color="#26c281" icon="arrow-down-circle" />
          <KpiCard label="Gastos" value={sum?.exp ?? 0} color="#ff5a5f" icon="arrow-up-circle" />
          <KpiCard label="Neto" value={sum?.net ?? 0} color="#4dabf7" icon="wallet" />
        </View>

        {/* Rates
        <View style={styles.row}>
          <RateCard title="Dólar (USD)" value={rates?.usd} hint="1 CLP → USD" />
          <RateCard title="Euro (EUR)" value={rates?.eur} hint="1 CLP → EUR" />
          <RateCard title="UF" value={rates?.uf} hint={rates ? `Act: ${new Date(rates.updatedAt).toLocaleDateString()}` : ''} />
        </View> */}

        {/* Quick actions */}
        <View style={styles.quickRow}>
          <QuickButton label="Añadir mov." icon="add-circle" onPress={() => router.push('/Screen/(tabs)/transactions')} />
          <QuickButton label="Chatbot" icon="chatbubble-ellipses" onPress={() => router.push('/Screen/(tabs)/chatbot')} />
          <QuickButton label="Metas" icon="flag" onPress={() => router.push('/Screen/(tabs)/goals')} />
        </View>

        {/* Goals preview – AHORA CON PROGRESO */}
        <Section
          title="Tus metas"
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

        {/* Bottom padding para tabs */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ----------------------------- UI helpers ----------------------------- */

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
    <Pressable onPress={onPress} style={styles.quickBtn}>
      <Ionicons name={icon} size={22} color="#1f2738" />
      <Text style={styles.quickTxt}>{label}</Text>
    </Pressable>
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
