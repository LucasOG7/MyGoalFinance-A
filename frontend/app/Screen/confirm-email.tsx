// app/Screen/confirm-email.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../store/auth";

export default function ConfirmEmail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pendingCreds, clearPendingCreds, login } = useAuth();

  const [busy, setBusy] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Si no tenemos las credenciales temporales, manda al login.
  useEffect(() => {
    if (!pendingCreds) {
      router.replace("/Screen/login");
    }
  }, [pendingCreds]);

  const tryLogin = async () => {
    if (!pendingCreds) {
      router.replace("/Screen/login");
      return;
    }
    try {
      setBusy(true);
      await login(pendingCreds.email, pendingCreds.password);
      clearPendingCreds();
      router.replace("/Screen/questionnaire/step1");
    } catch {
      Alert.alert(
        "Aún no confirmado",
        "Revisa tu correo y toca “Ya confirmé” cuando hayas validado tu cuenta."
      );
    } finally {
      setBusy(false);
    }
  };

  // Auto-reintento suave cada 8s (opcional pero cómodo)
  useEffect(() => {
    if (!pendingCreds) return;
    intervalRef.current = setInterval(() => {
      login(pendingCreds.email, pendingCreds.password)
        .then(() => {
          clearPendingCreds();
          router.replace("/Screen/questionnaire/step1");
        })
        .catch(() => {
          // aún no confirmado → ignoramos
        });
    }, 8000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pendingCreds, login]);

  return (
    <LinearGradient
      colors={["#526074ff", "#312d69ff"]}
      style={{
        flex: 1,
        paddingTop: insets.top + 24,
        paddingBottom: Math.max(16, insets.bottom + 16),
        paddingHorizontal: 24,
        justifyContent: "center",
      }}
    >
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: 20,
        }}
      >
        <Text style={{ color: "white", fontSize: 22, fontWeight: "700" }}>
          Confirma tu email
        </Text>

        <Text
          style={{
            color: "#dbe5ff",
            marginTop: 8,
            lineHeight: 20,
          }}
        >
          Te enviamos un enlace de verificación a{" "}
          <Text style={{ fontWeight: "700" }}>
            {pendingCreds?.email ?? "tu correo"}
          </Text>
          . Abre el enlace y vuelve aquí para continuar con el cuestionario.
        </Text>

        <TouchableOpacity
          onPress={tryLogin}
          disabled={busy}
          style={{
            marginTop: 16,
            backgroundColor: "#1f2a44",
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          {busy ? (
            <ActivityIndicator />
          ) : (
            <Text style={{ color: "white", fontWeight: "700" }}>
              Ya confirmé
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            clearPendingCreds();
            router.replace("/Screen/login");
          }}
          style={{ marginTop: 12, alignItems: "center" }}
        >
          <Text style={{ color: "#b9c6e4" }}>Volver al inicio de sesión</Text>
        </TouchableOpacity>

        {/* 
          (Opcional) Botón para reenviar el correo
          Necesitarías exponer un endpoint /auth/resend o usar supabase desde el backend.
          Lo dejamos comentado como recordatorio:
        */}
        {/* 
        <TouchableOpacity
          onPress={handleResend}
          style={{ marginTop: 8, alignItems: "center" }}
        >
          <Text style={{ color: "#b9c6e4" }}>Reenviar correo de verificación</Text>
        </TouchableOpacity>
        */}
      </View>
    </LinearGradient>
  );
}
