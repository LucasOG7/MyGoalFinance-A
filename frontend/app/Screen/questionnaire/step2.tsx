import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { useQuestionnaireStore } from "../../../store/useQuestionnaireStore";

export default function Step2() {
  const router = useRouter();
  const setKnowledge = useQuestionnaireStore((state) => state.setKnowledge);

  const handleSelect = (level: string) => {
    setKnowledge(level); // guarda en Zustand
    router.replace("/Screen/questionnaire/step3"); // avanza al Step3
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
          ¿Qué nivel de conocimiento financiero tienes?
        </Text>

        {["Básico", "Intermedio", "Avanzado"].map((level) => (
          <TouchableOpacity
            key={level}
            style={{
              backgroundColor: "#fff",
              padding: 15,
              borderRadius: 8,
              marginBottom: 12,
            }}
            onPress={() => handleSelect(level)}
          >
            <Text style={{ fontSize: 16, textAlign: "center" }}>{level}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </LinearGradient>
  );
}
