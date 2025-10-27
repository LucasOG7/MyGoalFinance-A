// app/Screen/(tabs)/recommendation.tsx
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import SafeKeyboardScreen from "../../../components/ui/SafeKeyboardScreen";
import api from "../../../constants/api";
import { useAuth } from "../../../store/auth";

type Rec = { id: string | number; title: string; description: string };

function isNumericLike(v: any) {
  if (v === null || v === undefined) return false;
  if (typeof v === "number") return !Number.isNaN(v);
  if (typeof v === "string") return v.trim() !== "" && !Number.isNaN(Number(v));
  return false;
}

function localFallbackRecs(user: any): Rec[] {
  const out: Rec[] = [];
  if (!user) return out;

  if (String(user.finance_goal || "").toLowerCase().includes("ahorr")) {
    out.push({
      id: "r1",
      title: "Fondo de emergencia",
      description: "Separa 3–6 meses de gastos en una cuenta líquida.",
    });
  }
  if ((user.experience || "").toLowerCase() === "beginner") {
    out.push({
      id: "r2",
      title: "Invierte simple",
      description: "Prefiere instrumentos diversificados y de bajo costo.",
    });
  }
  if (isNumericLike(user.monthly_income)) {
    out.push({
      id: "r3",
      title: "Ahorro automático",
      description: "Programa un 10% de tu ingreso mensual como transferencia.",
    });
  }
  if (out.length === 0) {
    out.push({
      id: "r0",
      title: "Completa tu perfil",
      description:
        "Ajusta tu objetivo y nivel financiero para recomendaciones más precisas.",
    });
  }
  return out;
}

export default function Recommendation() {
  const router = useRouter();
  const { user, refreshMe } = useAuth();

  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Refresca el perfil del backend al enfocar
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoadingUser(true);
        setErrorMsg(null);
        try {
          await refreshMe();
          if (__DEV__) console.log("[recs] refreshMe OK");
        } catch (e: any) {
          if (__DEV__) console.log("[recs] refreshMe ERROR:", e?.message);
        } finally {
          if (active) setLoadingUser(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [refreshMe])
  );

  // Perfil “listo” con monthly_income tolerando string/number
  const ready = useMemo(() => {
    const ok =
      Boolean(user?.age_range) &&
      Boolean(user?.experience) &&
      isNumericLike(user?.monthly_income) &&
      Boolean(user?.finance_goal);
    if (__DEV__) console.log("[recs] ready?", ok, { user });
    return ok;
  }, [user]);

  // Siempre muestra algún contenido: primero fallback local, luego intenta servidor
  useEffect(() => {
    let active = true;

    const load = async () => {
      // 1) Fallback local inmediato si el perfil está listo
      if (ready) {
        const fb = localFallbackRecs(user);
        setRecs(fb);
      } else {
        setRecs([]);
      }

      // 2) Si no está listo, no pidas servidor (muestra cartel para completar perfil)
      if (!ready) return;

      setLoadingRecs(true);
      setErrorMsg(null);
      try {
        const serverRecs = (await api.listRecommendations().catch((err: any) => {
          if (__DEV__) console.log("[recs] listRecommendations ERROR:", err?.message);
          throw err;
        })) as any[];

        if (!active) return;

        if (!serverRecs || serverRecs.length === 0) {
          // ya dejé el fallback puesto arriba; no hago nada
          if (__DEV__) console.log("[recs] servidor sin recs, usando fallback");
        } else {
          const mapped = serverRecs.map((r: any, i: number) => ({
            id: r.id ?? String(i),
            title: r.title ?? r.name ?? "Recomendación",
            description: r.description ?? r.text ?? "",
          }));
          setRecs(mapped);
        }
      } catch (e: any) {
        setErrorMsg(e?.message ?? "No se pudieron cargar recomendaciones.");
        // dejamos el fallback ya seteado
      } finally {
        if (active) setLoadingRecs(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [ready, user]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshMe();
      // The useEffect will automatically reload recommendations when user changes
    } catch (e: any) {
      if (__DEV__) console.log("[recs] refresh error:", e?.message);
    } finally {
      setRefreshing(false);
    }
  }, [refreshMe]);

  const showSpinner = loadingUser || loadingRecs;

  return (
    <SafeKeyboardScreen 
      withTabBarPadding={true} 
      bg="#2e3b55"
      extraBottomPad={Platform.OS === 'ios' ? -40 : 0}
    >
      <LinearGradient colors={["#2e3b55", "#1f2738"]} style={{ flex: 1 }}>
        <View style={{ padding: 20, flex: 1 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#fff", textAlign: "center" }}>
            💡 Recomendaciones
          </Text>
          <Text style={{ color: "#cbd5e1", marginBottom: 16, textAlign: "center" }}>
            Basadas en tu perfil y objetivos.
          </Text>

        {showSpinner ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator />
          </View>
        ) : !ready ? (
          <View
            style={{
              backgroundColor: "#fff",
              padding: 16,
              borderRadius: 12,
              marginTop: 8,
            }}
          >
            <Text>
              • Completa tu perfil (edad, nivel, ingresos y meta) para recibir
              recomendaciones.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/Screen/editprofile")}
              style={{
                marginTop: 12,
                backgroundColor: "#ffa000",
                padding: 12,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                Completar perfil
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {!!errorMsg && (
              <View
                style={{
                  backgroundColor: "#fee2e2",
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: "#b91c1c" }}>{errorMsg}</Text>
              </View>
            )}

            <FlatList
              data={recs}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ paddingBottom: 24 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#ffa000"
                  colors={["#ffa000"]}
                />
              }
              renderItem={({ item }) => (
                <View
                  style={{
                    backgroundColor: "#fff",
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontWeight: "700", marginBottom: 6 }}>
                    {item.title}
                  </Text>
                  <Text style={{ color: "#334155" }}>{item.description}</Text>
                </View>
              )}
              ListEmptyComponent={
                <View
                  style={{
                    backgroundColor: "#fff",
                    padding: 16,
                    borderRadius: 12,
                    marginTop: 8,
                  }}
                >
                  <Text>
                    No hay recomendaciones aún. ¡Prueba ajustar tu perfil!
                  </Text>
                </View>
              }
            />
          </>
        )}

        {/* <TouchableOpacity
          onPress={() => router.replace("/Screen/(tabs)/home")}
          style={{
            backgroundColor: "#ffa000",
            padding: 14,
            borderRadius: 10,
            alignItems: "center",
            marginTop: 16,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Volver al Inicio</Text>
        </TouchableOpacity> */}
      </View>
      </LinearGradient>
    </SafeKeyboardScreen>
  );
}
