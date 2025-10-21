// app/Screen/goals.tsx
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import styles from '../../../Styles/goalsStyles';
import { useAuth } from '../../../store/auth';

// ------------------------------
// API URL helper
// ------------------------------
function getApiUrl() {
  const extra = (Constants as any)?.expoConfig?.extra?.apiUrl;
  const env = process.env.EXPO_PUBLIC_API_URL;
  const url = extra || env;
  if (!url) {
    console.warn('[api] Falta EXPO_PUBLIC_API_URL o expo.extra.apiUrl; usando http://localhost:3000');
  }
  return url ?? 'http://localhost:3000';
}

const API_URL = getApiUrl();
const GOALS_URL = `${API_URL}/api/goals`;
console.log('[api] GOALS_URL =', GOALS_URL);

// ------------------------------
// Helpers
// ------------------------------
type ApiGoal = {
  id: number;
  title: string;
  description?: string | null;
  target_amount: number | string;
  current_amount: number | string;
  deadline?: string | null;
  created_at?: string;
};

type GoalUI = {
  id: string;
  title: string;
  target: number;
  current: number;
};

const CLP = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

function mapApiToUI(g: ApiGoal): GoalUI {
  return {
    id: String(g.id),
    title: g.title,
    target: Number(g.target_amount ?? 0),
    current: Number(g.current_amount ?? 0),
  };
}

// ------------------------------
// Component
// ------------------------------
export default function Goals() {
  const router = useRouter();
  const { token } = useAuth();

  const [goals, setGoals] = useState<GoalUI[]>([]);
  const [loading, setLoading] = useState(false);

  const [newGoal, setNewGoal] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  // GET /api/goals
  const fetchGoals = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(GOALS_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const txt = await res.text();
      console.log('[api] GET /goals ->', res.status, txt);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = JSON.parse(txt) as ApiGoal[];
      setGoals((json || []).map(mapApiToUI));
    } catch (e: any) {
      console.log('[goals] fetch error', e?.message || e);
      Alert.alert('Error', 'No se pudieron cargar tus metas.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // POST /api/goals
  const handleAddGoal = async () => {
    if (!token) return Alert.alert('Sesión', 'Debes iniciar sesión.');
    if (!newGoal.trim() || !targetAmount.trim()) {
      Alert.alert('Error', 'Debes ingresar una meta y un monto');
      return;
    }

    const target_amount = Number(targetAmount);
    if (Number.isNaN(target_amount) || target_amount <= 0) {
      Alert.alert('Monto objetivo inválido');
      return;
    }

    try {
      const res = await fetch(GOALS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newGoal.trim(), target_amount }),
      });

      const txt = await res.text();
      console.log('[api] POST /goals ->', res.status, txt);

      if (!res.ok) {
        let detail = txt;
        try {
          detail = JSON.parse(txt)?.detail ?? txt;
        } catch {}
        throw new Error(detail || `HTTP ${res.status}`);
      }

      setNewGoal('');
      setTargetAmount('');
      await fetchGoals();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo crear la meta');
    }
  };

  // POST /api/goals/:id/contribute
  const handleAddContribution = async (goalId: string, amount: number) => {
    if (!token) return Alert.alert('Sesión', 'Debes iniciar sesión.');
    try {
      const res = await fetch(`${GOALS_URL}/${goalId}/contribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });
      const txt = await res.text();
      console.log('[api] POST /goals/:id/contribute ->', res.status, txt);

      if (!res.ok) {
        let detail = txt;
        try {
          detail = JSON.parse(txt)?.detail ?? txt;
        } catch {}
        throw new Error(detail || `HTTP ${res.status}`);
      }

      await fetchGoals();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo registrar el aporte');
    }
  };

  return (
    <LinearGradient colors={['#2e3b55', '#1f2738']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🎯 Mis Metas Financieras</Text>
        <Text style={styles.subtitle}>
          Define, visualiza y sigue el progreso de tus objetivos.
        </Text>

        {/* Formulario nueva meta */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Agregar nueva meta</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Viaje a Europa"
            value={newGoal}
            onChangeText={setNewGoal}
          />
          <TextInput
            style={styles.input}
            placeholder="Monto objetivo (CLP)"
            keyboardType="numeric"
            value={targetAmount}
            onChangeText={setTargetAmount}
          />
          <TouchableOpacity style={styles.button} onPress={handleAddGoal} disabled={loading}>
            <Text style={styles.buttonText}>➕ Agregar Meta</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de metas */}
        {goals.map((goal) => {
          const progress = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
          return (
            <View key={goal.id} style={styles.card}>
              <Text style={styles.cardTitle}>{goal.title}</Text>
              <Text style={styles.cardText}>
                Progreso: {CLP.format(goal.current)} / {CLP.format(goal.target)} CLP
              </Text>

              {/* Barra de progreso */}
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{progress.toFixed(0)}% completado</Text>

              {/* Botones de aporte rápido */}
              <View style={styles.aportContainer}>
                {[10000, 20000, 50000].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={styles.aportButton}
                    onPress={() => handleAddContribution(goal.id, amt)}
                    disabled={loading}
                  >
                    <Text style={styles.aportButtonText}>+{CLP.format(amt)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}

        {!goals.length && !loading ? (
          <Text style={{ color: '#cbd5e1', textAlign: 'center', marginTop: 16 }}>
            Aún no tienes metas. Crea tu primera. ✨
          </Text>
        ) : null}
      </ScrollView>
    </LinearGradient>
  );
}
