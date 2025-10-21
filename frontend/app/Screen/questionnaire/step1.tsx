import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { useQuestionnaireStore } from "../../../store/useQuestionnaireStore";

export default function Step1() {
  const router = useRouter();
  const setAgeRange = useQuestionnaireStore((state) => state.setAgeRange);

  const handleSelect = (range: string) => {
    setAgeRange(range); // guarda en Zustand
    router.replace("/Screen/questionnaire/step2"); // avanza
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
          ¿Cuál es tu rango etario?
        </Text>

        {["18-25", "26-35", "36-50", "50+"].map((r) => (
          <TouchableOpacity
            key={r}
            style={{
              backgroundColor: "#fff",
              padding: 15,
              borderRadius: 8,
              marginBottom: 12,
            }}
            onPress={() => handleSelect(r)}
          >
            <Text style={{ fontSize: 16, textAlign: "center" }}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </LinearGradient>
  );
}
