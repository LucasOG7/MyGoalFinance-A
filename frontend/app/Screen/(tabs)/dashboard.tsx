// app/Screen/(tabs)/dashboard.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryGroup,
  VictoryLine,
  VictoryPie,
} from 'victory-native';
import api from '../../../constants/api';
import styles, { palette, vxAxis, vxLabel } from '../../../Styles/dashboardStyles';

type Tx = {
  id: number;
  amount: number | string;
  type: 'income' | 'expense';
  category_id?: number | null;
  description?: string | null;
  occurred_at: string; // YYYY-MM-DD
};

type SummaryMonth = {
  month: string; // 'YYYY-MM'
  from: string;
  to: string;
  inc: number;
  exp: number;
  net: number;
  byCategory: { category_id: number | null; total: number }[];
};

/* ------------------ helpers ------------------ */
const pad2 = (n: number) => String(n).padStart(2, '0');
const dateToYM = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
const nextYM = (ym: string, delta: number) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return dateToYM(d);
};
const ymToTitle = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString('es-CL', { month: 'long', year: 'numeric' });
};
const daysInMonth = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};
const fmtCLP = (n: number = 0) =>
  n.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });
const fmtShort = (n: number = 0) => {
  const v = Math.abs(n);
  if (v >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 1_000) return `${Math.round(n / 1_000)}k`;
  return `${Math.round(n)}`;
};
// % helper
const pct = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

/* ------------------ tamaños de gráficos ------------------ */
const winW = Math.min(Dimensions.get('window').width, 480);
const chartW = winW - 32; // paddingHorizontal 16 + 16
const lineH = 200;
const barH = 220;
const pieH = 260;
const pieRadius = Math.min(chartW, pieH) / 2 - 20;

/* ------------------ componente ------------------ */
export default function Dashboard() {
  const [month, setMonth] = useState<string>(() => dateToYM());
  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<SummaryMonth | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setBusy(true);
        const [sum, list] = await Promise.all([
          api.summaryMonth({ month }),
          api.listTransactions({ month }),
        ]);
        if (!cancelled) {
          setSummary(sum as SummaryMonth);
          setTxs(list as Tx[]);
        }
      } catch (e) {
        console.error('dashboard fetch error', e);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [month]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [sum, list] = await Promise.all([
        api.summaryMonth({ month }),
        api.listTransactions({ month }),
      ]);
      setSummary(sum as SummaryMonth);
      setTxs(list as Tx[]);
    } catch (e) {
      console.error('dashboard refresh error', e);
    } finally {
      setRefreshing(false);
    }
  }, [month]);

  /* ------- series diarias (línea) ------- */
  const { seriesIncome, seriesExpense } = useMemo(() => {
    const totalDays = daysInMonth(month);
    const incArr = Array.from({ length: totalDays }, (_, i) => ({ x: i + 1, y: 0 }));
    const expArr = Array.from({ length: totalDays }, (_, i) => ({ x: i + 1, y: 0 }));

    txs.forEach((t) => {
      if (!t.occurred_at?.startsWith(month)) return;
      const day = Number(t.occurred_at.slice(8, 10));
      const amt = Number(t.amount ?? 0);
      if (day >= 1 && day <= totalDays) {
        if (t.type === 'income') incArr[day - 1].y += amt;
        else expArr[day - 1].y += amt;
      }
    });
    return { seriesIncome: incArr, seriesExpense: expArr };
  }, [txs, month]);

  /* ------- barras semanales ------- */
  const weekBars = useMemo(() => {
    const weeks = [
      { x: 'S1', inc: 0, exp: 0 },
      { x: 'S2', inc: 0, exp: 0 },
      { x: 'S3', inc: 0, exp: 0 },
      { x: 'S4', inc: 0, exp: 0 },
      { x: 'S5', inc: 0, exp: 0 },
    ];
    txs.forEach((t) => {
      if (!t.occurred_at?.startsWith(month)) return;
      const day = Number(t.occurred_at.slice(8, 10));
      const idx = Math.min(Math.ceil(day / 7), 5) - 1;
      const amt = Number(t.amount ?? 0);
      if (t.type === 'income') weeks[idx].inc += amt;
      else weeks[idx].exp += amt;
    });
    return weeks;
  }, [txs, month]);

  /* ------- pie por categoría (con fallback) ------- */
  const pieDataByCategory = useMemo(() => {
    const rows = summary?.byCategory ?? [];
    if (rows.length > 0) {
      return rows
        .map((r) => ({
          x: r.category_id == null ? 'Sin categoría' : `Cat ${r.category_id}`,
          y: Number(r.total ?? 0),
        }))
        .filter((d) => d.y > 0);
    }
    const map = new Map<string, number>();
    for (const t of txs) {
      if (t.type !== 'expense') continue;
      if (!t.occurred_at?.startsWith(month)) continue;
      const key = t.category_id ? `Cat ${t.category_id}` : 'Sin categoría';
      map.set(key, (map.get(key) ?? 0) + Number(t.amount ?? 0));
    }
    return Array.from(map.entries())
      .map(([x, total]) => ({ x, y: total }))
      .filter((d) => d.y > 0);
  }, [summary, txs, month]);

  /* ------- pie Ingresado/Gastado/Ahorrado ------- */
  const pieIncomeSpendSave = useMemo(() => {
    const inc = Number(summary?.inc ?? 0);
    const exp = Number(summary?.exp ?? 0);
    const save = Math.max(inc - exp, 0);
    const vals = [
      { label: 'Ingresado', y: inc },
      { label: 'Gastado', y: exp },
      { label: 'Ahorrado', y: save },
    ];
    const total = vals.reduce((s, v) => s + v.y, 0);
    if (total <= 0) return [] as { x: string; y: number }[];
    return vals.map((v) => ({ x: v.label, y: v.y }));
  }, [summary]);

  const inc = Number(summary?.inc ?? 0);
  const exp = Number(summary?.exp ?? 0);
  const net = Number(summary?.net ?? 0);

  /* ------------------ UI ------------------ */
  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 80 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#2563EB"
          colors={["#2563EB"]}
        />
      }
    >
      {/* Header con mes */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navBtn} onPress={() => setMonth((m) => nextYM(m, -1))}>
          <Text style={styles.navBtnTxt}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{ymToTitle(month)}</Text>
        <TouchableOpacity style={styles.navBtn} onPress={() => setMonth((m) => nextYM(m, +1))}>
          <Text style={styles.navBtnTxt}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* KPIs */}
      <View style={styles.kpisRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Ingresos</Text>
          <Text style={[styles.kpiValue, { color: palette.income }]}>{fmtCLP(inc)}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Gastos</Text>
          <Text style={[styles.kpiValue, { color: palette.expense }]}>{fmtCLP(exp)}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Neto</Text>
          <Text style={[styles.kpiValue, { color: palette.net }]}>{fmtCLP(net)}</Text>
        </View>
      </View>

      {busy && (
        <View style={styles.busy}>
          <ActivityIndicator />
        </View>
      )}

      {/* Línea: Ingresos vs Gastos (diario) */}
      {!busy && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ingresos vs Gastos (diario)</Text>
          <VictoryChart
            width={chartW}
            height={lineH}
            padding={{ left: 68, right: 16, top: 8, bottom: 30 }}
          >
            <VictoryAxis style={vxAxis} tickFormat={(t) => `${t}`} />
            <VictoryAxis dependentAxis style={vxAxis} tickFormat={(t) => fmtShort(Number(t))} />
            <VictoryLine
              interpolation="monotoneX"
              data={seriesIncome}
              style={{ data: { stroke: palette.income, strokeWidth: 2 } }}
            />
            <VictoryLine
              interpolation="monotoneX"
              data={seriesExpense}
              style={{ data: { stroke: palette.expense, strokeWidth: 2 } }}
            />
          </VictoryChart>
        </View>
      )}

      {/* Barras: totales por semana */}
      {!busy && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Totales por semana</Text>
          <VictoryChart
            width={chartW}
            height={barH}
            padding={{ left: 68, right: 16, top: 8, bottom: 30 }}
            domainPadding={{ x: 22 }}
          >
            <VictoryAxis style={vxAxis} />
            <VictoryAxis dependentAxis style={vxAxis} tickFormat={(t) => fmtShort(Number(t))} />
            <VictoryGroup offset={14}>
              <VictoryBar
                data={weekBars.map((w) => ({ x: w.x, y: w.inc }))}
                style={{ data: { fill: palette.income } }}
                barWidth={12}
              />
              <VictoryBar
                data={weekBars.map((w) => ({ x: w.x, y: w.exp }))}
                style={{ data: { fill: palette.expense } }}
                barWidth={12}
              />
            </VictoryGroup>
          </VictoryChart>
        </View>
      )}

      {/* Pie: Distribución Ingresado / Gastado / Ahorrado (con %) */}
      {!busy && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Distribución: Ingresado vs Gastado vs Ahorrado</Text>
          {pieIncomeSpendSave.length === 0 ? (
            <Text style={styles.emptyText}>Aún no hay movimientos para este mes.</Text>
          ) : (
            (() => {
              const totalDist = pieIncomeSpendSave.reduce(
                (s, d) => s + Number(d.y || 0),
                0
              );
              return (
                <VictoryPie
                  width={chartW}
                  height={pieH}
                  data={pieIncomeSpendSave}
                  x="x"
                  y="y"
                  innerRadius={Math.round(pieRadius * 0.5)}
                  padAngle={1}
                  labelRadius={Math.round(pieRadius * 0.92)}
                  style={{ labels: vxLabel }}
                  colorScale={[palette.pieIncome, palette.pieExpense, palette.pieSaving]}
                  labels={({ datum }) =>
                    `${datum.x}\n${pct(Number(datum.y || 0), totalDist)}%`
                  }
                />
              );
            })()
          )}
        </View>
      )}
    </ScrollView>
  );
}
