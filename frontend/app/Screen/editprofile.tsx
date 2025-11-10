// app/Screen/edit-profile.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeKeyboardScreen from '../../components/ui/SafeKeyboardScreen';
import api from '../../constants/api';
import { useAuth } from '../../store/auth';
import editprofileStyles from '../../Styles/editprofileStyles';

const AGE_OPTIONS = ['18-25', '26-35', '36-45', '46+'] as const;
const LEVEL_OPTIONS = ['Básico', 'Intermedio', 'Avanzado'] as const;

function toExperience(v: string): 'beginner' | 'intermediate' | 'advanced' {
  const s = v.trim().toLowerCase();
  if (s.startsWith('bás') || s.startsWith('bas')) return 'beginner';
  if (s.startsWith('inter')) return 'intermediate';
  return 'advanced';
}

export default function EditProfile() {
  const router = useRouter();
  const { user, refreshMe } = useAuth();

  // Prefills
  const [ageRange, setAgeRange] = useState<string>(user?.age_range ?? '18-25');
  const [level, setLevel] = useState(
    user?.experience === 'beginner'
      ? 'Básico'
      : user?.experience === 'intermediate'
      ? 'Intermedio'
      : user?.experience === 'advanced'
      ? 'Avanzado'
      : '',
  );
  const [income, setIncome] = useState(
    user?.monthly_income != null ? String(user.monthly_income) : '',
  );
  const [goal, setGoal] = useState(user?.finance_goal ?? '');
  const [busy, setBusy] = useState(false);

  // Refs para saltar entre inputs
  const incomeRef = useRef<TextInput>(null);
  const goalRef = useRef<TextInput>(null);

  // helpers
  const onlyDigits = (s: string) => s.replace(/[^\d]/g, '');
  const formatCLP = (n: number) => n.toLocaleString('es-CL');

  // estado "dirty" para habilitar/deshabilitar guardar y confirmar cancelar
  const initial = useMemo(() => ({
    ageRange: user?.age_range ?? '18-25',
    level:
      user?.experience === 'beginner'
        ? 'Básico'
        : user?.experience === 'intermediate'
        ? 'Intermedio'
        : user?.experience === 'advanced'
        ? 'Avanzado'
        : '',
    income: user?.monthly_income != null ? String(user.monthly_income) : '',
    goal: user?.finance_goal ?? '',
  }), [user]);
  const isDirty = useMemo(
    () =>
      ageRange !== initial.ageRange ||
      level !== initial.level ||
      income !== initial.income ||
      goal !== initial.goal,
    [ageRange, level, income, goal, initial]
  );

  const onSave = async () => {
    try {
      setBusy(true);
      const age_range = ageRange;

      const monthly_income = Number(onlyDigits(income));
      if (Number.isNaN(monthly_income) || monthly_income < 0) {
        return Alert.alert('Valida tus ingresos', 'Ingresa un número válido.');
      }

      await api.updateProfile({
        age_range,
        experience: toExperience(level),
        monthly_income,
        finance_goal: goal.trim(),
      });
      await refreshMe();
      Alert.alert('¡Guardado!', 'Tu perfil fue actualizado.');
      router.replace('/Screen/(tabs)/profile');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  };

  const onCancel = () => {
    if (isDirty) {
      Alert.alert('Descartar cambios', 'Tienes cambios sin guardar, ¿quieres salir?', [
        { text: 'Seguir editando', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  return (
    <SafeKeyboardScreen
      scroll
      style={editprofileStyles.container} // usa tu container (centrado vertical)
      bg="transparent"
      bgGradientColors={["#2e3b55", "#1f2738"] as const}
      paddingH={20}
      extraBottomPad={16}
      contentJustify="center"            // centra la card como en tu StyleSheet
    >

      {/* Card */}
      <View style={editprofileStyles.card}>
        <Text style={editprofileStyles.title}>Editar Perfil</Text>

        <Text style={editprofileStyles.label}>Edad</Text>
        <View style={editprofileStyles.chipRow}>
          {AGE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => setAgeRange(opt)}
              style={[editprofileStyles.chip, ageRange === opt && editprofileStyles.chipActive]}
              accessibilityRole="button"
              accessibilityLabel={`Edad ${opt}`}
            >
              <Text style={[editprofileStyles.chipText, ageRange === opt && editprofileStyles.chipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={editprofileStyles.label}>Nivel en Finanzas</Text>
        <View style={editprofileStyles.chipRow}>
          {LEVEL_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => setLevel(opt)}
              style={[editprofileStyles.chip, level === opt && editprofileStyles.chipActive]}
              accessibilityRole="button"
              accessibilityLabel={`Nivel ${opt}`}
            >
              <Text style={[editprofileStyles.chipText, level === opt && editprofileStyles.chipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={editprofileStyles.label}>Ingresos Mensuales (CLP)</Text>
        <View style={editprofileStyles.inputRow}>
          <Ionicons name="cash-outline" size={18} color="#cbd5e1" style={editprofileStyles.inputIcon} />
          <TextInput
            ref={incomeRef}
            placeholder="500000"
            keyboardType="numeric"
            value={income}
            onChangeText={(t) => setIncome(onlyDigits(t))}
            onBlur={() => setIncome((v) => String(formatCLP(Number(onlyDigits(v)) || 0)))}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => goalRef.current?.focus()}
            style={editprofileStyles.input}
            editable={!busy}
          />
        </View>

        <Text style={editprofileStyles.label}>Meta Financiera</Text>
        <View style={editprofileStyles.inputRow}>
          <Ionicons name="rocket-outline" size={18} color="#cbd5e1" style={editprofileStyles.inputIcon} />
          <TextInput
            ref={goalRef}
            placeholder="Ahorrar / Pagar deudas..."
            value={goal}
            onChangeText={setGoal}
            returnKeyType="done"
            onSubmitEditing={onSave}
            style={editprofileStyles.input}
            editable={!busy}
          />
        </View>
        <View style={editprofileStyles.chipRow}>
          {['Ahorrar', 'Pagar deudas', 'Invertir', 'Viaje', 'Fondo emergencia'].map((opt) => (
            <TouchableOpacity key={opt} onPress={() => setGoal(opt)} style={editprofileStyles.chipSmall}>
              <Text style={editprofileStyles.chipSmallText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={editprofileStyles.actionsRow}>
          <TouchableOpacity
            onPress={onSave}
            disabled={busy || !isDirty}
            style={[editprofileStyles.primaryButton, (busy || !isDirty) && { opacity: 0.8 }]}
          >
            {busy ? (
              <ActivityIndicator color="#1f2937" />
            ) : (
              <>
                <Text style={editprofileStyles.primaryButtonText}>Guardar Cambios</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onCancel}
            disabled={busy}
            style={editprofileStyles.cancelButton}
          >
            <Text style={editprofileStyles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeKeyboardScreen>
  );
}
