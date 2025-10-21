// components/GoalsPreview.tsx
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import api from '../../constants/api';
import { useAuth } from '../../store/auth';

type Goal = {
  id: number;
  title: string;
  target_amount: number | string;
  current_amount: number | string;
};

const CLP = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

export default function GoalsPreview({ limit = 3 }: { limit?: number }) {
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await api.listGoals(); // GET /api/goals
      setGoals((data || []).slice(0, limit));
    } catch (e) {
      // opcional: algún toast/alert
      console.log('[home] goals preview error', e);
    } finally {
      setLoading(false);
    }
  }, [token, limit]);

  // Recargar cada vez que el Home gana foco
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={{ marginTop: 8 }}>
      {/* Header sección */}
      <View style={{ paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: '#e2e8f0', fontSize: 16, fontWeight: '700' }}>Tus metas</Text>
        <Pressable onPress={() => router.push('/Screen/goals')}>
          <Text style={{ color: '#fbbf24', fontWeight: '600' }}>Ver metas</Text>
        </Pressable>
      </View>

      {/* Contenido */}
      <View style={{ paddingHorizontal: 12, marginTop: 8 }}>
        {loading ? (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <ActivityIndicator />
          </View>
        ) : goals.length === 0 ? (
          <View
            style={{
              backgroundColor: '#0b1324',
              borderRadius: 12,
              padding: 14,
              marginHorizontal: 4,
              borderWidth: 1,
              borderColor: '#1e293b',
            }}
          >
            <Text style={{ color: '#cbd5e1' }}>
              Aún no tienes metas activas. ¡Crea una para empezar!
            </Text>
            <Pressable
              onPress={() => router.push('/Screen/goals')}
              style={{
                marginTop: 10,
                backgroundColor: '#f59e0b',
                alignSelf: 'flex-start',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '700' }}>Crear meta</Text>
            </Pressable>
          </View>
        ) : (
          goals.map((g) => {
            const target = Number(g.target_amount || 0);
            const current = Number(g.current_amount || 0);
            const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;

            return (
              <Pressable
                key={g.id}
                onPress={() => router.push('/Screen/goals')}
                style={{
                  backgroundColor: '#0b1324',
                  borderRadius: 12,
                  padding: 14,
                  marginHorizontal: 4,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: '#1e293b',
                }}
              >
                <Text style={{ color: '#e2e8f0', fontWeight: '700', fontSize: 16 }}>{g.title}</Text>
                <Text style={{ color: '#94a3b8', marginTop: 4 }}>
                  Progreso: {CLP.format(current)} / {CLP.format(target)} CLP
                </Text>

                {/* Barra de progreso */}
                <View
                  style={{
                    height: 8,
                    backgroundColor: '#e2e8f015',
                    borderRadius: 999,
                    marginTop: 8,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      backgroundColor: '#22c55e',
                    }}
                  />
                </View>
                <Text style={{ color: '#94a3b8', marginTop: 6 }}>{pct.toFixed(0)}% completado</Text>
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
}
