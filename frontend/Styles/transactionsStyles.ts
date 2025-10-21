// app/Screen/(tabs)/transactions.styles.ts
import { Platform, StyleSheet } from 'react-native';

export const C = {
  // Base clara y suave
  bg1: '#F5F7FA',
  bg2: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E2E8F0',

  // Texto
  text: '#0F172A',
  textDim: '#475569',
  muted: '#64748B',

  // Marca
  primary: '#2563EB',
  primarySoft: '#EAF2FF',

  // KPIs
  kpiLabel: '#64748B',
  kpiValue: '#0F172A',

  // Ingresos / Gastos
  income: '#16A34A',
  incomeBg: 'rgba(22,163,74,0.12)',
  expense: '#DC2626',
  expenseBg: 'rgba(220,38,38,0.12)',

  // Botón guardar
  action: '#F59E0B',
  actionText: '#FFFFFF',

  // Inputs
  inputBg: '#F1F5F9',
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 14, paddingTop: 12 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: { color: C.text, fontSize: 18, fontWeight: '700' },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnTxt: { color: C.text, fontSize: 16, fontWeight: '700' },

  kpisRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  kpiCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  kpiLabel: { color: C.kpiLabel, fontSize: 12 },
  kpiValue: { color: C.kpiValue, fontWeight: '800', marginTop: 2 },

  list: { flex: 1, marginTop: 6 },
  emptyText: {
    textAlign: 'center',
    color: C.muted,
    opacity: 0.9,
    marginTop: 24,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  itemDesc: { color: C.text, fontSize: 14, fontWeight: '600' },
  itemDate: { color: C.muted, fontSize: 12, marginTop: 2 },
  itemAmount: { fontSize: 15, fontWeight: '800', marginLeft: 10 },

  busy: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  formCard: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: C.border,
  },

  // Selector Ingreso / Gasto
  typeRow: {
    flexDirection: 'row',
    backgroundColor: C.inputBg,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  typeBtnActiveIncome: { backgroundColor: C.incomeBg },
  typeBtnActiveExpense: { backgroundColor: C.expenseBg },
  typeBtnTxt: { color: C.textDim, fontWeight: '700' },
  typeBtnTxtActive: { color: C.text, fontWeight: '800' }, // 👈 añadido

  // Inputs
  input: {
    backgroundColor: C.inputBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, android: 10 }),
    marginBottom: 10,
    color: C.text,
  },

  // Guardar
  saveBtn: {
    backgroundColor: C.action,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  saveBtnTxt: { color: C.actionText, fontWeight: '800' },
});

export default styles;
