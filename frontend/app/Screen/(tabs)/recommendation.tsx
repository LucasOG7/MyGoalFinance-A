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
import recommendationStyles from "../../../Styles/recommendationStyles";
import { Feather } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';

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

  const exp = String(user.experience || '').toLowerCase();
  const goal = String(user.finance_goal || '').toLowerCase();
  const hasIncome = isNumericLike(user.monthly_income);

  // Sugerencias comunes
  if (goal.includes('ahorr')) {
    out.push({ id: 'r1', title: 'Fondo de emergencia', description: 'Separa 3–6 meses de gastos en una cuenta líquida.' });
  }
  if (hasIncome) {
    out.push({ id: 'r3', title: 'Ahorro automático', description: 'Programa un 10% de tu ingreso mensual como transferencia.' });
  }

  // Según nivel
  if (exp.includes('begin')) {
    out.push({ id: 'rb1', title: 'Invierte simple', description: 'Prefiere instrumentos diversificados y de bajo costo.' });
    out.push({ id: 'rb2', title: 'Presupuesto 50/30/20', description: 'Asigna 50% necesidades, 30% deseos y 20% ahorro.' });
  } else if (exp.includes('intermed')) {
    out.push({ id: 'ri1', title: 'Diversifica con ETFs', description: 'Elige índices amplios para reducir riesgo específico.' });
    out.push({ id: 'ri2', title: 'Reduce comisiones', description: 'Prefiere fondos con TER bajo y evita costos ocultos.' });
    out.push({ id: 'ri3', title: 'Revisa deuda cara', description: 'Prioriza pagar créditos con alta tasa de interés.' });
  } else if (exp.includes('advance') || exp.includes('avanz')) {
    out.push({ id: 'ra1', title: 'Rebalanceo trimestral', description: 'Ajusta tu cartera para mantener tu asignación objetivo.' });
    out.push({ id: 'ra2', title: 'Optimiza impuestos', description: 'Usa cuentas con beneficios tributarios cuando existan.' });
    out.push({ id: 'ra3', title: 'Aporta a jubilación', description: 'Automatiza contribuciones y revisa tu tasa de ahorro.' });
    out.push({ id: 'ra4', title: 'Monitorea patrimonio', description: 'Registra activos y pasivos mensualmente para seguir progreso.' });
    out.push({ id: 'ra5', title: 'Tilts moderados', description: 'Aplica sesgos medidos (p. ej. value/quality) con control de riesgo.' });
  }

  if (out.length === 0) {
    out.push({
      id: 'r0',
      title: 'Completa tu perfil',
      description: 'Ajusta tu objetivo y nivel financiero para recomendaciones más precisas.',
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
  const [limitSeed] = useState<number>(() => Math.floor(Math.random() * 1000));

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

  // Derivar nombre de nivel y límite de recomendaciones según experiencia
  const levelName = useMemo(() => {
    const exp = String(user?.experience || '').toLowerCase();
    if (exp.includes('begin')) return 'Básico';
    if (exp.includes('intermed')) return 'Intermedio';
    if (exp.includes('advance') || exp.includes('avanz')) return 'Avanzado';
    return 'Básico';
  }, [user?.experience]);

  const recLimit = useMemo(() => {
    const exp = String(user?.experience || '').toLowerCase();
    if (exp.includes('begin')) return 2; // básico fijo
    if (exp.includes('intermed')) return 3 + (limitSeed % 2); // 3–4
    if (exp.includes('advance') || exp.includes('avanz')) return 5 + (limitSeed % 2); // 5–6
    return 3; // por defecto
  }, [user?.experience, limitSeed]);

  // Siempre muestra algún contenido: primero fallback local, luego intenta servidor
  useEffect(() => {
    let active = true;

    const load = async () => {
      // 1) Fallback local inmediato si el perfil está listo
      if (ready) {
        const fb = localFallbackRecs(user).slice(0, recLimit);
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

        const fbAll = localFallbackRecs(user);
        const mapped = (serverRecs || []).map((r: any, i: number) => ({
          id: r.id ?? String(i),
          title: r.title ?? r.name ?? 'Recomendación',
          description: r.description ?? r.text ?? '',
        }));

        // Combina servidor + fallback y deduplica por título
        const combined = [...mapped, ...fbAll];
        const seen = new Set<string>();
        const unique = combined.filter((rec) => {
          const key = String(rec.title || '').trim().toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setRecs(unique.slice(0, recLimit));
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
      bg="#0f172a"
      extraBottomPad={Platform.OS === 'ios' ? -40 : 0}
      paddingTop={-20}
    >
      <LinearGradient colors={["#0f172a", "#0f172a"]} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 0, flex: 1 }}>
          <View style={recommendationStyles.headerRow}>
            <TouchableOpacity style={recommendationStyles.backButton} onPress={() => router.replace('/Screen/(tabs)/home')}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ width: 36 }} />
          </View>
          <View style={recommendationStyles.headerWrap}>
            <Text style={recommendationStyles.title}>Recomendaciones</Text>
            <Text style={recommendationStyles.subtitle}>Basadas en tu perfil y objetivos.</Text>

            {ready && (
              <View style={recommendationStyles.levelRow}>
                <View style={recommendationStyles.levelChip}>
                  <Text style={recommendationStyles.levelChipTxt}>Nivel: {levelName}</Text>
                </View>
                <View style={recommendationStyles.levelChip}>
                  <Text style={recommendationStyles.levelChipTxt}>Mostrando {recs.length} de {recLimit}</Text>
                </View>
              </View>
            )}
          </View>

        {showSpinner ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator />
          </View>
        ) : !ready ? (
          <View style={recommendationStyles.infoCard}>
            <Text style={recommendationStyles.infoText}>
              • Completa tu perfil (edad, nivel, ingresos y meta) para recibir recomendaciones.
            </Text>
            <TouchableOpacity onPress={() => router.push("/Screen/editprofile")} style={recommendationStyles.ctaBtn}>
              <Text style={recommendationStyles.ctaTxt}>Completar perfil</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {!!errorMsg && (
              <View style={recommendationStyles.errorCard}>
                <Text style={recommendationStyles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <FlatList
              data={recs}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={recommendationStyles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#ffa000"
                  colors={["#ffa000"]}
                />
              }
              renderItem={({ item }) => (
                <View style={recommendationStyles.card}>
                  <View style={recommendationStyles.cardHeader}>
                    <View style={recommendationStyles.cardIconWrap}>
                      <Feather name="star" size={18} color="#f3b34c" />
                    </View>
                    <Text style={recommendationStyles.cardTitle}>{item.title}</Text>
                  </View>
                  <Text style={recommendationStyles.cardDesc}>{item.description}</Text>
                </View>
              )}
              ListEmptyComponent={
                <View style={recommendationStyles.infoCard}>
                  <Text style={recommendationStyles.infoText}>No hay recomendaciones aún. ¡Prueba ajustar tu perfil!</Text>
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
