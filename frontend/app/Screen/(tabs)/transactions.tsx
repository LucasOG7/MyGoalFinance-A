import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View, Platform, Modal, Linking, ScrollView } from 'react-native';
import SafeKeyboardScreen from '../../../components/ui/SafeKeyboardScreen';
import api from '../../../constants/api';
import styles, { C } from '../../../Styles/transactionsStyles';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type Tx = {
  id: number;
  user_id: number;
  amount: number;
  type: 'income'|'expense';
  category_id?: number|null;
  description?: string|null;
  occurred_at: string; // 'YYYY-MM-DD'
};

type Goal = { id: string; title: string; target_amount?: number; current_amount?: number };

/* ───────── helpers de fecha en FRONT ───────── */
const ymdLocal = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const ymOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
const monthTitle = (d: Date) => {
  const title = d.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' });
  return title.charAt(0).toUpperCase() + title.slice(1);
};

export default function Transactions() {
  const insets = useSafeAreaInsets();
  const { month: monthParam } = useLocalSearchParams<{ month?: string }>();
  // Mes "canónico" siempre día 1; inicializa desde `month` si viene en la ruta
  const [monthDate, setMonthDate] = useState<Date>(() => {
    const param = typeof monthParam === 'string' ? monthParam : '';
    if (/^\d{4}-\d{2}$/.test(param)) {
      const [y, m] = param.split('-').map((n) => Number(n));
      return new Date(y, m - 1, 1);
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Acepta cambios de parámetro `month` mientras la pantalla ya está montada
  useEffect(() => {
    const param = typeof monthParam === 'string' ? monthParam : '';
    if (/^\d{4}-\d{2}$/.test(param)) {
      const [y, m] = param.split('-').map((n) => Number(n));
      const d = new Date(y, m - 1, 1);
      // Evita set si ya está en el mismo mes
      if (ymOf(d) !== ymOf(monthDate)) {
        setMonthDate(d);
      }
    }
  }, [monthParam]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [list, setList] = useState<Tx[]>([]);

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositProvider, setDepositProvider] = useState<'mercadopago' | 'webpay'>('webpay');
  const [creatingDeposit, setCreatingDeposit] = useState(false);
  const [depositState, setDepositState] = useState<{ status: 'idle' | 'pending' | 'approved' | 'failed'; amount?: number }>({ status: 'idle' });

  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [alloc, setAlloc] = useState<Record<string, string>>({});
  const [distributing, setDistributing] = useState(false);

  // Form
  const [tType, setTType] = useState<'income'|'expense'>('income');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [showForm, setShowForm] = useState(false);

  const ym = useMemo(() => ymOf(monthDate), [monthDate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await api.listTransactions({ month: ym });
      setList(rows);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudieron cargar movimientos');
    } finally {
      setLoading(false);
    }
  }, [ym]);

  const checkDepositApproval = useCallback(() => {
    if (depositState.status !== 'pending') return;
    const today = ymdLocal();
    const ok = list.some((t) => t.type === 'income' && String(t.description || '').toLowerCase().includes('depósito webpay') && t.occurred_at === today && (!depositState.amount || Number(t.amount) >= Number(depositState.amount || 0)));
    if (ok) setDepositState({ status: 'approved' });
  }, [depositState, list]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { checkDepositApproval(); }, [list, checkDepositApproval]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  // KPIs
  const kpis = useMemo(() => {
    let inc = 0, exp = 0;
    for (const r of list) {
      const n = Number(r.amount) || 0;
      if (r.type === 'income') inc += n; else exp += n;
    }
    return { inc, exp, net: inc - exp };
  }, [list]);

  const prevMonth = () => {
    const d = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1);
    setMonthDate(d);
  };
  const nextMonth = () => {
    const d = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    setMonthDate(d);
  };

  const save = async () => {
    const val = Number(amount.replace(/[^\d.-]/g, ''));
    if (!val || val <= 0) return Alert.alert('Monto', 'Ingresa un monto válido');

    try {
      await api.createTransaction({
        amount: val,
        type: tType,
        description: desc || undefined,
        occurred_at: ymdLocal(), // SIEMPRE LOCAL (YYYY-MM-DD)
      });
      setAmount('');
      setDesc('');
      await load(); // refresca lista/KPIs
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar');
    }
  };

  const startDeposit = () => {
    setDepositProvider('webpay');
    setDepositAmount('');
    setShowDepositModal(true);
  };

  const pollForDeposit = async (ms = 60000) => {
    const started = Date.now();
    while (Date.now() - started < ms) {
      try { await load(); } catch {}
      await new Promise((r) => setTimeout(r, 5000));
    }
  };

  const confirmDeposit = async () => {
    const val = Number(depositAmount.replace(/[^\d.-]/g, ''));
    if (!val || val <= 0) return Alert.alert('Monto', 'Ingresa un monto válido');
    setCreatingDeposit(true);
    try {
      const r = await api.createDeposit({ amount: val, provider: 'webpay' });
      const url = r.payment_url;
      if (url) {
        setDepositState({ status: 'pending', amount: val });
        Alert.alert('Depósito', 'Abriendo checkout de pago');
        Linking.openURL(url).catch(() => {});
        pollForDeposit();
      } else {
        Alert.alert('Depósito', 'No se obtuvo URL de pago');
      }
      setShowDepositModal(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo iniciar el depósito');
      setDepositState({ status: 'failed' });
    } finally {
      setCreatingDeposit(false);
    }
  };

  const openDistribute = async () => {
    try {
      const g = await api.listGoals();
      const act = (g as any[]).filter((x) => (Number(x?.target_amount || 0) - Number(x?.current_amount || 0)) > 0);
      setGoals(act.map((x) => ({ id: String(x.id), title: String(x.title || x.name || 'Meta'), target_amount: Number(x.target_amount || 0), current_amount: Number(x.current_amount || 0) })));
      const init: Record<string, string> = {};
      act.forEach((x) => { init[String(x.id)] = ''; });
      setAlloc(init);
      setShowDistributeModal(true);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudieron cargar metas');
    }
  };

  const totalAlloc = useMemo(() => Object.values(alloc).reduce((s, v) => s + (Number(v.replace(/[^\d.-]/g, '')) || 0), 0), [alloc]);

  const doDistribute = async () => {
    if (goals.length === 0) return setShowDistributeModal(false);
    if (totalAlloc <= 0) return Alert.alert('Distribución', 'Ingresa montos a distribuir');
    setDistributing(true);
    try {
      for (const g of goals) {
        const amt = Number((alloc[g.id] || '').replace(/[^\d.-]/g, ''));
        if (amt && amt > 0) {
          await api.addContribution(g.id, { amount: amt });
        }
      }
      setShowDistributeModal(false);
      setAlloc({});
      Alert.alert('Distribución', 'Se registraron los aportes en tus metas');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo distribuir');
    } finally {
      setDistributing(false);
    }
  };

  return (
    <SafeKeyboardScreen withTabBarPadding={true} bg={C.bg1} paddingTop={0}>
      <View style={[styles.container, { backgroundColor: C.bg1 }]}>
      {/* Título principal */}
      <Text style={styles.mainTitle}>Movimientos</Text>
      
      

      

      

      <Text style={{ color: C.text, fontSize: 16, marginBottom: 10 }}>¿Qué acción deseas realizar?</Text>
      <View style={styles.actionsRow}>
        <View style={styles.actionItem}>
          <TouchableOpacity style={styles.actionIconWrap} onPress={startDeposit}>
            <Ionicons name="arrow-down" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.actionLabel}>Depositar</Text>
        </View>
        <View style={styles.actionItem}>
          <TouchableOpacity style={styles.actionIconWrap} onPress={() => setTType('expense') }>
            <Ionicons name="arrow-up" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.actionLabel}>Retirar</Text>
        </View>
        <View style={styles.actionItem}>
          <TouchableOpacity style={styles.actionIconWrap} onPress={openDistribute}>
            <Ionicons name="pie-chart" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.actionLabel}>Distribuir depósito</Text>
        </View>
      </View>

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Recientes</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>Ver todos</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderColor: C.border, borderWidth: 1, borderRadius: 18, paddingHorizontal: 8, paddingVertical: 4 }}>
            <TouchableOpacity onPress={prevMonth} style={{ paddingHorizontal: 4, paddingVertical: 2 }}>
              <Ionicons name="chevron-back" size={16} color={C.text} />
            </TouchableOpacity>
            <Text style={{ color: C.text, fontSize: 12, fontWeight: '700', marginHorizontal: 6 }}>{monthTitle(monthDate)}</Text>
            <TouchableOpacity onPress={nextMonth} style={{ paddingHorizontal: 4, paddingVertical: 2 }}>
              <Ionicons name="chevron-forward" size={16} color={C.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      

      {/* Lista */}
      {loading ? (
        <View style={styles.busy}><ActivityIndicator /></View>
      ) : list.length === 0 ? (
        <Text style={styles.emptyText}>Sin movimientos en este mes</Text>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={{ paddingBottom: (Platform.OS === 'ios' ? insets.bottom : 0) + (showForm ? 240 : 80) }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2563EB"
              colors={["#2563EB"]}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemDesc}>{item.description || (item.type === 'income' ? 'Ingreso' : 'Gasto')}</Text>
                <Text style={styles.itemDate}>{item.occurred_at}</Text>
              </View>
              <Text
                style={[
                  styles.itemAmount,
                  { color: item.type === 'income' ? C.income : C.expense },
                ]}
              >
                {(item.type === 'income' ? '+' : '-')}${Number(item.amount).toLocaleString('es-CL')}
              </Text>
            </View>
          )}
        />
      )}

      <Modal transparent visible={showDepositModal} animationType="fade" onRequestClose={() => setShowDepositModal(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setShowDepositModal(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={styles.modalCard}>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Depósito</Text>
              <Text style={styles.modalSubtitle}>Webpay/Transbank</Text>
            </View>

            <View style={styles.moneyInputRow}>
              <Text style={styles.currencyPrefix}>$</Text>
              <TextInput
                style={{ flex: 1, color: C.text, fontSize: 18, fontWeight: '700' }}
                placeholder="Monto"
                placeholderTextColor={C.muted}
                keyboardType="numeric"
                value={depositAmount}
                onChangeText={setDepositAmount}
              />
            </View>

            <View style={styles.quickChipsRow}>
              {[10000, 20000, 50000, 100000].map((v) => {
                const active = Number(depositAmount.replace(/[^\d.-]/g, '')) === v;
                return (
                  <TouchableOpacity key={v} onPress={() => setDepositAmount(String(v))} style={[styles.chip, active && styles.chipActive]}>
                    <Text style={styles.chipText}>${v.toLocaleString('es-CL')}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity disabled={creatingDeposit} onPress={confirmDeposit} style={[styles.saveBtn, { marginTop: 8, opacity: creatingDeposit ? 0.7 : 1 }]}>
              {creatingDeposit ? <ActivityIndicator color={C.actionText} /> : <Text style={styles.saveBtnTxt}>Continuar con Webpay</Text>}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal transparent visible={showDistributeModal} animationType="fade" onRequestClose={() => setShowDistributeModal(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setShowDistributeModal(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, maxHeight: '80%' }}>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Distribuir depósito</Text>
            <ScrollView>
              {goals.length === 0 ? (
                <Text style={{ color: C.muted }}>No hay metas activas</Text>
              ) : (
                goals.map((g) => (
                  <View key={g.id} style={{ marginBottom: 10 }}>
                    <Text style={{ color: C.text, marginBottom: 6 }}>{g.title}</Text>
                    <TextInput style={styles.amountInput} placeholder="Monto" placeholderTextColor={C.muted} keyboardType="numeric" value={alloc[g.id] || ''} onChangeText={(txt) => setAlloc((m) => ({ ...m, [g.id]: txt }))} />
                  </View>
                ))
              )}
            </ScrollView>
            <Text style={{ color: C.textDim, marginTop: 6 }}>Total: ${totalAlloc.toLocaleString('es-CL')}</Text>
            <TouchableOpacity disabled={distributing} onPress={doDistribute} style={[styles.saveBtn, { marginTop: 8, opacity: distributing ? 0.7 : 1 }]}>
              {distributing ? <ActivityIndicator color={C.actionText} /> : <Text style={styles.saveBtnTxt}>Distribuir</Text>}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {showForm && (
      <View style={[
        styles.formCard,
        { bottom: Platform.OS === 'ios' ? insets.bottom + -65 + 6 : 8 }
      ] }>
        <View style={styles.typeRow}>
          <TouchableOpacity
            onPress={() => setTType('income')}
            style={[styles.typeBtn, tType === 'income' && styles.typeBtnActiveIncome]}
          >
            <Text style={[styles.typeBtnTxt, tType === 'income' && styles.typeBtnTxtActive]}>Ingreso</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTType('expense')}
            style={[styles.typeBtn, tType === 'expense' && styles.typeBtnActiveExpense]}
          >
            <Text style={[styles.typeBtnTxt, tType === 'expense' && styles.typeBtnTxtActive]}>Gasto</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.amountInput}
          placeholder="Monto"
          placeholderTextColor={C.muted}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <TextInput
          style={styles.descriptionInput}
          placeholder="Descripción (opcional)"
          placeholderTextColor={C.muted}
          value={desc}
          onChangeText={setDesc}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnTxt}>Guardar movimiento</Text>
        </TouchableOpacity>
      </View>
      )}
    </View>
    </SafeKeyboardScreen>
  );
}
