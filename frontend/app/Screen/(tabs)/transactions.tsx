import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import SafeKeyboardScreen from '../../../components/ui/SafeKeyboardScreen';
import api from '../../../constants/api';
import styles, { C } from '../../../Styles/transactionsStyles';

type Tx = {
  id: number;
  user_id: number;
  amount: number;
  type: 'income'|'expense';
  category_id?: number|null;
  description?: string|null;
  occurred_at: string; // 'YYYY-MM-DD'
};

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
  // Mes "canónico" siempre día 1
  const [monthDate, setMonthDate] = useState<Date>(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [list, setList] = useState<Tx[]>([]);

  // Form
  const [tType, setTType] = useState<'income'|'expense'>('income');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');

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

  useEffect(() => { load(); }, [load]);

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
        occurred_at: ymdLocal(), // 👈 SIEMPRE LOCAL (YYYY-MM-DD)
      });
      setAmount('');
      setDesc('');
      await load(); // refresca lista/KPIs
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar');
    }
  };

  return (
    <SafeKeyboardScreen withTabBarPadding={true} bg={C.bg1} paddingTop={0}>
      <View style={[styles.container, { backgroundColor: C.bg1 }]}>
      {/* Título principal */}
      <Text style={styles.mainTitle}>Transacciones</Text>
      
      {/* Header navegación por mes */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
          <Text style={styles.navBtnTxt}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {monthTitle(monthDate)}
        </Text>
        <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
          <Text style={styles.navBtnTxt}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* KPIs */}
      <View style={styles.kpisRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Ingresos</Text>
          <Text style={[styles.kpiValue, { color: C.income }]}>
            ${kpis.inc.toLocaleString('es-CL')}
          </Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Gastos</Text>
          <Text style={[styles.kpiValue, { color: C.expense }]}>
            ${kpis.exp.toLocaleString('es-CL')}
          </Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Neto</Text>
          <Text style={styles.kpiValue}>
            ${kpis.net.toLocaleString('es-CL')}
          </Text>
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
          contentContainerStyle={{ paddingBottom: 230 }}
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

      {/* Formulario inferior */}
      <View style={styles.formCard}>
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
    </View>
    </SafeKeyboardScreen>
  );
}
