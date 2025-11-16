// app/Screen/(tabs)/profile.tsx
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  const [changingPhoto, setChangingPhoto] = useState(false);

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

  // Avatar elegido o fallback dinámico
  const avatarUri = user?.avatar_uri
    ? String(user.avatar_uri)
    : "https://i.pravatar.cc/300?u=" + (user?.email || "user");

  // Helpers para guardar y refrescar avatar
  const saveAvatarUri = async (newUri: string) => {
    await AsyncStorage.setItem("avatar_uri", newUri);
    await refreshMe();
  };

  const handleResult = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset) return;
    let newUri = asset.uri;
    if (asset.base64) {
      const mime = asset.type && asset.type.includes("image") ? "image/jpeg" : "image/jpeg";
      newUri = `data:${mime};base64,${asset.base64}`;
    }
    await saveAvatarUri(newUri);
  };

  const pickFromLibrary = async () => {
    try {
      setChangingPhoto(true);
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permisos", "Necesitamos acceso a tu galería para continuar.");
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });
      await handleResult(result);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo seleccionar la imagen");
    } finally {
      setChangingPhoto(false);
    }
  };

  const takePhoto = async () => {
    try {
      setChangingPhoto(true);
      if (Platform.OS === "web") {
        Alert.alert("No disponible", "Tomar foto con la cámara no está disponible en web.");
        return;
      }
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permisos", "Necesitamos acceso a la cámara para continuar.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });
      await handleResult(result);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo tomar la foto");
    } finally {
      setChangingPhoto(false);
    }
  };

  const presentChangePhoto = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Elegir de la galería", "Tomar foto con la cámara", "Cancelar"],
          cancelButtonIndex: 2,
          title: "Actualizar foto de perfil",
        },
        (idx) => {
          if (idx === 0) pickFromLibrary();
          else if (idx === 1) takePhoto();
        }
      );
      return;
    }
    // Android / otros
    Alert.alert("Actualizar foto de perfil", "Elige una opción", [
      { text: "Galería", onPress: pickFromLibrary },
      { text: "Cámara", onPress: takePhoto },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

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
    <LinearGradient colors={["#0f172a", "#0f172a"]} style={styles.container}>
      {/* Encabezado superior */}
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <Text style={styles.headerSubtitle}>Gestiona tu información personal</Text>
      </View>

      {/* Avatar */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            {/* Ícono de edición superpuesto */}
            <TouchableOpacity
              onPress={presentChangePhoto}
              disabled={changingPhoto}
              style={styles.avatarEditBtn}
              accessibilityRole="button"
              accessibilityLabel="Editar foto de perfil"
            >
              {changingPhoto ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="pencil" size={18} color="#1f2937" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.name || "Mi Perfil"}</Text>
          {!!user?.email && (
            <Text style={{ color: "#cbd5e1", marginTop: 4 }}>{user.email}</Text>
          )}
        </View>
      </View>

      {/* Card con información */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderTitle}>Información Personal</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>🎂 Edad</Text>
          <Text style={styles.value}>{displayAge}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>📊 Nivel en Finanzas</Text>
          <Text style={styles.value}>{displayKnowledge}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>💰 Ingresos</Text>
          <Text style={styles.value}>{displayIncome}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>🎯 Meta Financiera</Text>
          <Text style={styles.value}>{displayGoal}</Text>
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/Screen/editprofile")}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Editar Perfil"
        >
          <Ionicons name="create" size={18} color="#1f2937" style={styles.primaryButtonIcon} />
          <Text style={styles.primaryButtonText}>Editar Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onLogout}
          disabled={busy}
          style={styles.logoutButton}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
        >
          {busy ? (
            <ActivityIndicator color="#e11d48" />
          ) : (
            <>
              <View style={styles.logoutButtonIconWrap}>
                <Ionicons name="log-out-outline" size={16} color="#e11d48" />
              </View>
              <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
