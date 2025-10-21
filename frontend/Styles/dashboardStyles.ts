// Styles/dashboardStyles.ts
import { StyleSheet } from 'react-native';

/** Paleta centralizada y colores de series */
export const palette = {
  // base
  bg: '#2f3b52',
  card: 'rgba(255,255,255,0.08)',
  cardAlt: 'rgba(255,255,255,0.12)',
  border: 'rgba(255,255,255,0.14)',
  textPrimary: '#F8FAFC',
  textMuted: '#CBD5E1',

  // acentos
  brand: '#f59e0b',

  // métricas
  income: '#16a34a',
  expense: '#ef4444',
  net: '#60a5fa',

  // pies
  pieIncome: '#0ea5a5',
  pieExpense: '#ef4444',
  pieSaving: '#22c55e',
  pieNeutral: '#94a3b8',

  // ejes/grids para charts
  axis: 'rgba(255,255,255,0.18)',
  grid: 'rgba(255,255,255,0.06)',
};

/** Estilos “reutilizables” de Victory (pásalos en style={...}) */
export const vxAxis = {
  axis: { stroke: palette.axis },
  tickLabels: { fill: palette.textMuted, fontSize: 10 },
  grid: { stroke: palette.grid },
};
export const vxLabel = { fill: '#111827', fontSize: 11, fontWeight: '600' };

const styles = StyleSheet.create({
  /* ---------- Layout general ---------- */
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: palette.bg,
  },

  /* ---------- Header ---------- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: { color: palette.textPrimary, fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnTxt: { color: palette.textPrimary, fontSize: 16, fontWeight: '700' },

  /* ---------- KPIs ---------- */
  kpisRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  kpiCard: {
    flex: 1,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',

    // sombra ligera
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  kpiLabel: { color: palette.textMuted, fontSize: 12, fontWeight: '600' },
  kpiValue: { color: palette.textPrimary, fontWeight: '900', marginTop: 2, letterSpacing: 0.3 },

  /* ---------- Loading ---------- */
  busy: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  /* ---------- Tarjetas / Secciones ---------- */
  card: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 12,
    marginTop: 10,

    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  cardTitle: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  emptyText: {
    color: palette.textMuted,
    textAlign: 'center',
    marginVertical: 14,
    fontSize: 13,
  },

  /* ---------- Leyendas/auxiliares (por si las usas) ---------- */
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.pieNeutral,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  legendTxt: { color: palette.textMuted, fontSize: 12, fontWeight: '600' },
});

export default styles;
