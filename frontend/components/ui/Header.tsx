import { useRouter } from "expo-router"; // 👈 importar router
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import styles from "../../Styles/headerStyles";

export default function Header({ userName }: { userName: string }) {
  const router = useRouter(); // 👈 inicializar router

  return (
    <View style={styles.container}>
      {/* Logo / Nombre */}
      <Text style={styles.logo}>MyGoalFinance</Text>

      {/* Avatar */}
      <TouchableOpacity
        onPress={() => router.push("../../Screen/(tabs)/profile")}
      >
        <Image
          source={{ uri: "https://i.pravatar.cc/150?u=" + userName }} // avatar dinámico
          style={styles.avatar}
        />
      </TouchableOpacity>
    </View>
  );
}
