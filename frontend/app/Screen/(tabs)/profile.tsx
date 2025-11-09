// app/Screen/(tabs)/profile.tsx
import { useFocusEffect } from "@react-navigation/native"; // 👈 refresca al enfocar
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../store/auth";
import styles from "../../../Styles/profileStyles";

function mapExperienceLabel(v?: string | null) {
  switch ((v || "").toLowerCase()) {
    case "beginner":
      return "Básico";
    case "intermediate":
      return "Intermedio";
    case "advanced":
      return "Avanzado";
    default:
      return v || "No definido";
  }
}

export default function Profile() {
  const router = useRouter();
  const { user, refreshMe, logout } = useAuth();
  const [busy, setBusy] = useState(false);

  // Refrescar perfil REAL del backend al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      refreshMe().catch(() => {});
    }, [refreshMe])
  );

  const displayAge = user?.age_range ?? "No definido";
  const displayKnowledge = useMemo(
    () => mapExperienceLabel(user?.experience),
    [user?.experience]
  );
  const displayIncome = useMemo(() => {
    if (typeof user?.monthly_income === "number") {
      return `$${user.monthly_income.toLocaleString("es-CL")}`;
    }
    return "No definido";
  }, [user?.monthly_income]);
  const displayGoal = user?.finance_goal ?? "No definido";

  // Avatar dinámico
  const avatarUri = "https://i.pravatar.cc/300?u=" + (user?.email || "user");

  const onLogout = async () => {
    try {
      setBusy(true);
      await logout();
      router.replace("/Screen/login");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo cerrar sesión");
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient colors={["#2e3b55", "#1f2738"]} style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
        <Text style={styles.userName}>{user?.name || "Mi Perfil"}</Text>
        {!!user?.email && (
          <Text style={{ color: "#cbd5e1", marginTop: 4 }}>{user.email}</Text>
        )}
      </View>

      {/* Card con información */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Información Personal</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>🎂 Edad:</Text>
          <Text style={styles.value}>{displayAge}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>📊 Nivel en Finanzas:</Text>
          <Text style={styles.value}>{displayKnowledge}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>💰 Ingresos:</Text>
          <Text style={styles.value}>{displayIncome}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>🎯 Meta Financiera:</Text>
          <Text style={styles.value}>{displayGoal}</Text>
        </View>
      </View>

      {/* Editar Perfil */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/Screen/editprofile")}
        disabled={busy}
      >
        <Text style={styles.buttonText}>Editar Perfil</Text>
      </TouchableOpacity>

      {/* Cerrar sesión */}
      <TouchableOpacity
        onPress={onLogout}
        disabled={busy}
        style={[styles.button, { backgroundColor: "#b3261e", marginTop: 12 }]}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Cerrar sesión</Text>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
}
