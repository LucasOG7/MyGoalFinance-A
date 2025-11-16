// app/Screen/goals.tsx
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [refreshing, setRefreshing] = useState(false);

  const [newGoal, setNewGoal] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  // Estados para edición
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalUI | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTarget, setEditTarget] = useState('');

  // Estados para aporte personalizado
  const [customContributionModalVisible, setCustomContributionModalVisible] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');

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

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchGoals();
    } finally {
      setRefreshing(false);
    }
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

  // Función para abrir modal de edición
  const handleEditGoal = (goal: GoalUI) => {
    setEditingGoal(goal);
    setEditTitle(goal.title);
    setEditTarget(goal.target.toString());
    setEditModalVisible(true);
  };

  // Función para guardar cambios de edición
  const handleSaveEdit = async () => {
    if (!token || !editingGoal) return Alert.alert('Error', 'Sesión inválida');
    if (!editTitle.trim()) return Alert.alert('Error', 'El título es requerido');
    if (!editTarget.trim() || isNaN(Number(editTarget)) || Number(editTarget) <= 0) {
      return Alert.alert('Error', 'El monto objetivo debe ser un número válido mayor a 0');
    }

    try {
      const res = await fetch(`${GOALS_URL}/${editingGoal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          target_amount: Number(editTarget),
        }),
      });

      const txt = await res.text();
      console.log('[api] PUT /goals/:id ->', res.status, txt);

      if (!res.ok) {
        let detail = txt;
        try {
          detail = JSON.parse(txt)?.detail ?? txt;
        } catch {}
        throw new Error(detail || `HTTP ${res.status}`);
      }

      setEditModalVisible(false);
      setEditingGoal(null);
      setEditTitle('');
      setEditTarget('');
      await fetchGoals();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo actualizar la meta');
    }
  };

  // Función para eliminar meta
  const handleDeleteGoal = (goal: GoalUI) => {
    Alert.alert(
      'Eliminar Meta',
      `¿Estás seguro de que deseas eliminar la meta "${goal.title}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            if (!token) return Alert.alert('Error', 'Sesión inválida');
            try {
              const res = await fetch(`${GOALS_URL}/${goal.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });

              const txt = await res.text();
              console.log('[api] DELETE /goals/:id ->', res.status, txt);

              if (!res.ok) {
                let detail = txt;
                try {
                  detail = JSON.parse(txt)?.detail ?? txt;
                } catch {}
                throw new Error(detail || `HTTP ${res.status}`);
              }

              await fetchGoals();
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'No se pudo eliminar la meta');
            }
          }
        }
      ]
    );
  };

  // Función para abrir modal de aporte personalizado
  const handleCustomContribution = (goalId: string) => {
    setSelectedGoalId(goalId);
    setCustomContributionModalVisible(true);
  };

  // Función para procesar aporte personalizado
  const handleSaveCustomContribution = async () => {
    if (!token || !selectedGoalId || !customAmount.trim()) {
      Alert.alert('Error', 'Por favor ingresa una cantidad válida');
      return;
    }

    const amount = Number(customAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'La cantidad debe ser un número mayor a 0');
      return;
    }

    try {
      await handleAddContribution(selectedGoalId, amount);
      setCustomContributionModalVisible(false);
      setSelectedGoalId(null);
      setCustomAmount('');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo agregar el aporte');
    }
  };

  return (
    <LinearGradient colors={['#0f172a', '#0f172a']} style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12 }}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/Screen/(tabs)/home')}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Mis Metas Financieras</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ffa000"
            colors={["#ffa000"]}
          />
        }
      >
        <Text style={styles.subtitle}>
          Define, visualiza y sigue el progreso de tus objetivos.
        </Text>

        {/* Formulario nueva meta */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Agregar nueva meta</Text>
          <Text style={styles.inputLabel}>Nombre de la meta</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Viaje a Europa"
            placeholderTextColor="#94a3b8"
            value={newGoal}
            onChangeText={setNewGoal}
          />
          <Text style={styles.inputLabel}>Monto objetivo</Text>
          <TextInput
            style={styles.input}
            placeholder="Monto objetivo (CLP)"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            value={targetAmount}
            onChangeText={setTargetAmount}
          />
          <TouchableOpacity style={styles.button} onPress={handleAddGoal} disabled={loading}>
            <Text style={styles.buttonText}>Empezar Meta</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de metas */}
        {goals.map((goal) => {
          const progress = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
          return (
            <View key={goal.id} style={styles.card}>
              {/* Header con título y botones de acción */}
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { flex: 1 }]}>{goal.title}</Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEditGoal(goal)}
                  >
                    <Ionicons name="pencil" size={16} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteGoal(goal)}
                  >
                    <Ionicons name="trash" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
              
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
                {/* Botón de aporte personalizado */}
                <TouchableOpacity
                  style={styles.customAportButton}
                  onPress={() => handleCustomContribution(goal.id)}
                  disabled={loading}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {!goals.length && !loading ? (
          <Text style={{ color: '#cbd5e1', textAlign: 'center', marginTop: 16 }}>
            ¡Crea tu primera meta para empezar! ✨
          </Text>
        ) : null}
      </ScrollView>

      {/* Modal de edición */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Meta</Text>
            
            <Text style={styles.inputLabel}>Nombre de la meta</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Viaje a Europa"
              placeholderTextColor="#94a3b8"
              value={editTitle}
              onChangeText={setEditTitle}
            />
            
            <Text style={styles.inputLabel}>Monto objetivo</Text>
            <TextInput
              style={styles.input}
              placeholder="Monto objetivo (CLP)"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={editTarget}
              onChangeText={setEditTarget}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEdit}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de aporte personalizado */}
      <Modal
        visible={customContributionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setCustomContributionModalVisible(false);
          setSelectedGoalId(null);
          setCustomAmount('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Aporte Personalizado</Text>
            
            <Text style={styles.inputLabel}>Cantidad a aportar</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 15000"
              placeholderTextColor="#94a3b8"
              value={customAmount}
              onChangeText={setCustomAmount}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setCustomContributionModalVisible(false);
                  setSelectedGoalId(null);
                  setCustomAmount('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveCustomContribution}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
}
