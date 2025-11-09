// app/Screen/(tabs)/recap.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../../constants/api';

/* ---------- Tipos mínimos para lo que usamos ---------- */
type SummaryMonth = {
  month: string;
  inc: number;
  exp: number;
  net: number;
};

type Profile = {
  name?: string;
  age_range?: string | null;
  experience?: 'beginner' | 'intermediate' | 'advanced' | null;
  monthly_income?: number | null;
  finance_goal?: string | null;
};

type Goal = {
  id: number | string;
  title: string;
  target_amount?: number | string | null;
  current_amount?: number | string | null;
};

/* ---------- Helpers de formato ---------- */
const CLP = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});
const pct = (v: number) =>
  `${(Number.isFinite(v) ? Math.max(-999, Math.min(999, v)) : 0)
    .toLocaleString('es-CL', { maximumFractionDigits: 0 })}%`;

export default function RecapScreen() {
  const router = useRouter();

  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [sum, setSum] = useState<SummaryMonth | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);

  const firstName = useMemo(() => {
    const n = profile?.name || '';
    return n.split(' ')[0] || '¡Hola!';
  }, [profile]);

  const load = useCallback(async () => {
    try {
      setBusy(true);
      const [p, s, g] = await Promise.allSettled([
        api.getProfile(),
        api.summaryMonth(),
        api.listGoals(),
      ]);

      if (p.status === 'fulfilled') setProfile(p.value as Profile);
      if (s.status === 'fulfilled') setSum(s.value as SummaryMonth);
      if (g.status === 'fulfilled') setGoals((g.value as Goal[]) ?? []);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo cargar tu resumen.');
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

  /* ---------- Cálculos de Salud Financiera ---------- */
  const ingresos = Math.max(sum?.inc ?? 0, 0);
  const gastos = Math.max(sum?.exp ?? 0, 0);
  const ahorroMes = Math.max(ingresos - gastos, 0);
  const tasaAhorro = ingresos > 0 ? (ahorroMes / ingresos) * 100 : 0;

  // Target sugerido: 6 meses de gastos
  const emergencyTarget = Math.round(gastos * 6);

  // Buscar meta de emergencia por título
  const emergencyGoal = goals.find(
    (x) =>
      typeof x.title === 'string' &&
      x.title.toLowerCase().includes('emerg')
  );

  const emergencySaved = Number(emergencyGoal?.current_amount ?? 0);
  const emergencyGoalTarget =
    Number(emergencyGoal?.target_amount ?? 0) || emergencyTarget;

  const emergencyPct =
    emergencyGoalTarget > 0
      ? Math.min(100, (emergencySaved / emergencyGoalTarget) * 100)
      : 0;

  const suggestMonthly = Math.max(
    Math.round((emergencyGoalTarget / 12) / 1000) * 1000,
    0
  );

  const handleCreateEmergencyGoal = async () => {
    try {
      const target = emergencyTarget > 0 ? emergencyTarget : 500000; // fallback
      await api.createGoal({
        title: 'Fondo de emergencia',
        target_amount: target,
      });
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo crear la meta.');
    }
  };

  return (
    <SafeAreaView style={sx.safe} edges={['left', 'right']}>
      <LinearGradient colors={['#0f172a', '#0f172a']} style={sx.header}>
        <Text style={sx.h1}>Resumen de tu Perfil</Text>
        <Text style={sx.subtitle}>{firstName}, aquí va tu snapshot personal</Text>
      </LinearGradient>

      <ScrollView
        style={sx.scroll}
        contentContainerStyle={sx.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 1) Estado de tu perfil */}
        <View style={sx.card}>
          <View style={sx.cardAccent} />
          <View style={sx.cardTop}>
            <View style={sx.cardTopLeft}>
              <View style={sx.cardIconWrap}>
                <Feather name="user" size={18} color="#000" />
              </View>
              <Text style={sx.cardTitle}>Estado de tu perfil</Text>
            </View>
          </View>

          <Row label="Edad">
            <Text style={sx.value}>
              {profile?.age_range ?? 'No definido'}
            </Text>
          </Row>
          <Row label="Nivel en finanzas">
            <Text style={sx.value}>
              {profile?.experience
                ? profile.experience === 'beginner'
                  ? 'Básico'
                  : profile.experience === 'intermediate'
                  ? 'Intermedio'
                  : 'Avanzado'
                : 'No definido'}
            </Text>
          </Row>
          <Row label="Ingresos mensuales">
            <Text style={sx.value}>
              {profile?.monthly_income != null
                ? CLP.format(profile.monthly_income)
                : 'No definido'}
            </Text>
          </Row>
          <Row label="Meta financiera principal">
            <Text style={sx.value}>
              {profile?.finance_goal || 'No definido'}
            </Text>
          </Row>
        </View>

        {/* 2) Salud financiera (tasa + emergencia) */}
        <View style={sx.card}>
          <View style={sx.cardAccent} />
          <View style={sx.cardTop}>
            <View style={sx.cardTopLeft}>
              <View style={sx.cardIconWrap}>
                <Feather name="activity" size={18} color="#000" />
              </View>
              <Text style={sx.cardTitle}>Salud financiera</Text>
            </View>
          </View>

          <Row label="Tasa de ahorro">
            <Text style={sx.value}>
              {pct(tasaAhorro)} ({CLP.format(ahorroMes)} / {CLP.format(ingresos)})
            </Text>
          </Row>

          <View style={{ height: 10 }} />

          <Text style={sx.itemTitle}>Fondo de emergencia (6 meses)</Text>
          <Text style={sx.value}>
            {CLP.format(emergencySaved)} / {CLP.format(emergencyGoalTarget)}
          </Text>
          <View style={sx.progressBar}>
            <View style={[sx.progressFill, { width: `${emergencyPct}%` }]} />
          </View>

          {!emergencyGoal ? (
            <Pressable style={sx.cta} onPress={handleCreateEmergencyGoal} disabled={busy}>
              {busy ? (
                <ActivityIndicator color="#1f2738" />
              ) : (
                <Text style={sx.ctaText}>
                  Crear fondo de emergencia (objetivo sugerido {CLP.format(emergencyTarget)})
                </Text>
              )}
            </Pressable>
          ) : (
            <Text style={sx.hint}>
              Sugerencia: aporta {CLP.format(suggestMonthly)} al mes a tu fondo de emergencia.
            </Text>
          )}
        </View>

        {/* 3) Acciones rápidas */}
        <View style={sx.row3}>
          <Tile
            title="Ver metas"
            onPress={() => router.push('/Screen/(tabs)/goals')}
          />
          <Tile
            title="Añadir movimiento"
            onPress={() => router.push('/Screen/(tabs)/transactions')}
          />
          <Tile
            title="Chatbot"
            onPress={() => router.push('/Screen/(tabs)/chatbot')}
          />
        </View>

        {/* Nota legal */}
        <Text style={sx.disclaimer}>
          Este contenido es educativo y no constituye asesoría financiera personalizada.
        </Text>

        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Subcomponentes ---------- */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={sx.row}>
      <Text style={sx.label}>{label}</Text>
      <View style={{ flex: 1, alignItems: 'flex-end' }}>{children}</View>
    </View>
  );
}

function Tile({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable 
      onPress={onPress} 
      style={({ pressed }) => [
        sx.tile,
        pressed && { transform: [{ scale: 0.95 }], opacity: 0.8 }
      ]}
    >
      <Text style={sx.tileTxt}>{title}</Text>
    </Pressable>
  );
}

/* ---------- Estilos (paleta del Home) ---------- */

const sx = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a', paddingTop: 0 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  brand: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '600',
  },
  h1: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: '#cbd5e1',
    marginTop: 4,
  },

  scroll: { flex: 1 },
  content: { padding: 16 },

  card: {
    backgroundColor: '#1f2738',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    overflow: 'hidden',
  },
  cardAccent: {
    height: 4,
    backgroundColor: '#f59e0b',
    borderRadius: 999,
    marginBottom: 10,
    opacity: 0.95,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.4)',
  },
  cardTitle: {
    color: '#e8edf7',
    fontSize: 16,
    fontWeight: '800',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1f2937',
  },
  label: { color: '#94a3b8', fontSize: 14 },
  value: { color: '#e5e7eb', fontSize: 14, fontWeight: '600' },

  link: { color: '#f59e0b', fontWeight: '800' },

  itemTitle: { color: '#cbd5e1', fontWeight: '600', marginBottom: 4 },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
  },

  hint: { color: '#cbd5e1', marginTop: 10 },

  cta: {
    backgroundColor: '#ffb300',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  ctaText: { color: '#1f2738', fontWeight: '800' },

  row3: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  tile: {
    flex: 1,
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tileTxt: {
    color: '#1f2738',
    fontWeight: '800',
    textAlign: 'center',
    fontSize: 14,
  },

  disclaimer: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 14,
  },
});
