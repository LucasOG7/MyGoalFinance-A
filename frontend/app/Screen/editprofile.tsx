// app/Screen/edit-profile.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import SafeKeyboardScreen from '../../components/ui/SafeKeyboardScreen';
import api from '../../constants/api';
import { useAuth } from '../../store/auth';
import editprofileStyles from '../../Styles/editprofileStyles';

function ageToRange(ageNum: number) {
  if (ageNum <= 0 || Number.isNaN(ageNum)) return null;
  if (ageNum <= 25) return '18-25';
  if (ageNum <= 35) return '26-35';
  if (ageNum <= 45) return '36-45';
  return '46+';
}
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
  const [age, setAge] = useState(user?.age_range?.match(/^\d+/)?.[0] ?? '');
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
  const levelRef = useRef<TextInput>(null);
  const incomeRef = useRef<TextInput>(null);
  const goalRef = useRef<TextInput>(null);

  const onSave = async () => {
    try {
      setBusy(true);
      const ageNum = Number(age);
      const age_range = ageToRange(ageNum);
      if (!age_range) return Alert.alert('Valida tu edad', 'Ingresa una edad válida.');

      const monthly_income = Number(income);
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

  return (
    <SafeKeyboardScreen
      scroll
      style={editprofileStyles.container} // usa tu container (centrado vertical)
      bg="#312d69"
      paddingH={20}
      extraBottomPad={16}
      contentJustify="center"            // centra la card como en tu StyleSheet
    >
      {/* Fondo gradiente absoluto */}
      <LinearGradient
        colors={["#2e3b55", "#1f2738"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Card */}
      <View style={editprofileStyles.card}>
        <Text style={editprofileStyles.title}>Editar Perfil</Text>

        <Text style={editprofileStyles.label}>Edad</Text>
        <TextInput
          placeholder="18"
          keyboardType="numeric"
          value={age}
          onChangeText={setAge}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => levelRef.current?.focus()}
          style={editprofileStyles.input}
          editable={!busy}
        />

        <Text style={editprofileStyles.label}>Nivel en Finanzas</Text>
        <TextInput
          ref={levelRef}
          placeholder="Básico / Intermedio / Avanzado"
          value={level}
          onChangeText={setLevel}
          autoCapitalize="sentences"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => incomeRef.current?.focus()}
          style={editprofileStyles.input}
          editable={!busy}
        />

        <Text style={editprofileStyles.label}>Ingresos Mensuales (CLP)</Text>
        <TextInput
          ref={incomeRef}
          placeholder="500000"
          keyboardType="numeric"
          value={income}
          onChangeText={setIncome}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => goalRef.current?.focus()}
          style={editprofileStyles.input}
          editable={!busy}
        />

        <Text style={editprofileStyles.label}>Meta Financiera</Text>
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

        <TouchableOpacity
          onPress={onSave}
          disabled={busy}
          style={[editprofileStyles.button, busy && { opacity: 0.7 }]}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={editprofileStyles.buttonText}>Guardar Cambios</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          disabled={busy}
          style={editprofileStyles.cancelButton}
        >
          <Text style={editprofileStyles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </SafeKeyboardScreen>
  );
}
