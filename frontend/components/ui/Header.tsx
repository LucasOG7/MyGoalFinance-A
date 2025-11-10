import { useRouter } from "expo-router"; // 👈 importar router
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import styles from "../../Styles/headerStyles";
import { useAuth } from "../../store/auth";

export default function Header({ userName }: { userName: string }) {
  const router = useRouter(); // 👈 inicializar router
  const { user } = useAuth();

  const avatarUri = user?.avatar_uri
    ? String(user.avatar_uri)
    : "https://i.pravatar.cc/150?u=" + (user?.email || userName);

  return (
    <View style={styles.container}>
      {/* Logo / Nombre */}
      <Text style={styles.logo}>MyGoalFinance</Text>

      {/* Avatar */}
      <TouchableOpacity
        onPress={() => router.push("../../Screen/(tabs)/profile")}
      >
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
      </TouchableOpacity>
    </View>
  );
}
