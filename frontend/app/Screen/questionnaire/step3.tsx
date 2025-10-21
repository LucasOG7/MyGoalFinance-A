import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { useQuestionnaireStore } from "../../../store/useQuestionnaireStore";

export default function Step3() {
  const router = useRouter();
  const setIncome = useQuestionnaireStore((state) => state.setIncome);

  const handleSelect = (income: string) => {
    setIncome(income); // guarda en Zustand
    router.replace("/Screen/questionnaire/step4"); // avanza al Step4
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
          ¿Cuál es tu ingreso mensual aproximado?
        </Text>

        {["< $500.000", "$500.000 – $1.000.000", "> $1.000.000"].map(
          (range) => (
            <TouchableOpacity
              key={range}
              style={{
                backgroundColor: "#fff",
                padding: 15,
                borderRadius: 8,
                marginBottom: 12,
              }}
              onPress={() => handleSelect(range)}
            >
              <Text style={{ fontSize: 16, textAlign: "center" }}>{range}</Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </LinearGradient>
  );
}
