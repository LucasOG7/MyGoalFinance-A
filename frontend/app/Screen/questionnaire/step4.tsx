// app/Screen/questionnaire/step4.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../../constants/api";
import { useAuth } from "../../../store/auth";
import { useQuestionnaireStore } from "../../../store/useQuestionnaireStore";

// Mapeos de valores del cuestionario -> backend
const mapExperience = (k: string): "beginner" | "intermediate" | "advanced" => {
  const s = (k || "").toLowerCase();
  if (s.startsWith("bás") || s.startsWith("bas")) return "beginner";
  if (s.startsWith("inter")) return "intermediate";
  return "advanced";
};

const mapIncome = (i: string): number => {
  switch (i) {
    case "< $500.000":
      return 300000;
    case "$500.000 – $1.000.000":
      return 750000;
    case "> $1.000.000":
      return 1500000;
    default:
      return 0;
  }
};

export default function Step4() {
  const router = useRouter();
  const { data, setGoal, reset } = useQuestionnaireStore();
  const { refreshMe } = useAuth();
  const [busy, setBusy] = useState(false);

  const handleSelect = async (goal: string) => {
    try {
      setBusy(true);
      setGoal(goal); // guarda en Zustand

      // Construir payload para tu backend (profileUpdateSchema)
      const payload = {
        age_range: data.ageRange,                    // string
        experience: mapExperience(data.knowledge),   // enum
        monthly_income: mapIncome(data.income),       // number
        finance_goal: goal,                          // string
      };

      await api.updateProfile(payload); // PUT /api/profile (auth: true en api.ts)
      await refreshMe();                // refresca user en el store

      Alert.alert("¡Listo!", "Tu perfil financiero ha sido guardado");
      reset();                          // limpia cuestionario local
      router.replace("/Screen/(tabs)/home");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo guardar tu perfil");
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient colors={["#526074ff", "#312d69ff"]} style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: "center", padding: 30 }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "bold",
            color: "#fff",
            marginBottom: 20,
          }}
        >
          ¿Cuál es tu principal objetivo financiero?
        </Text>

        {["Ahorrar", "Invertir", "Salir de deudas", "Otro"].map((option) => (
          <TouchableOpacity
            key={option}
            style={{
              backgroundColor: "#fff",
              padding: 15,
              borderRadius: 8,
              marginBottom: 12,
              opacity: busy ? 0.7 : 1,
            }}
            onPress={() => handleSelect(option)}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator />
            ) : (
              <Text style={{ fontSize: 16, textAlign: "center" }}>{option}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </LinearGradient>
  );
}
