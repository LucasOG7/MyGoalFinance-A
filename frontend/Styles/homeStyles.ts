import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a', paddingTop: 0 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  headerContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { color: '#e8edf7', fontWeight: '700', fontSize: 18, marginBottom: 6 },
  h1: { color: 'white', fontSize: 28, fontWeight: '800', marginTop: 0 },
  subtitle: { color: '#c8d0e3', marginTop: 4 },

  // Logo provisorio e íconos del header
  logoBox: {
    // Eliminado el contorno: sin fondo ni borde
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIcon: { marginRight: 4 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a3441',
    borderWidth: 1,
    borderColor: '#3a4553',
  },

  // Estilos foto de perfil
  profileButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },

  // Dashboard Card Styles (similar to reference image)
  dashboardCard: {
    backgroundColor: '#1f2738',
    borderRadius: 16,
    padding: 20,
    position: 'relative',
  },
  dashboardLabel: {
    color: '#aab4c6',
    fontSize: 16,
    marginBottom: 8,
  },
  dashboardValue: {
    color: 'white',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 20,
  },
  dashboardIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a3441',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Period Selector Styles
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#2a3441',
    borderRadius: 20,
    padding: 4,
    alignSelf: 'flex-end',
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 50,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#3a4553',
  },
  periodButtonText: {
    color: '#aab4c6',
    fontSize: 14,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: 'white',
  },

  scroll: { flex: 1 },
  content: { padding: 16, paddingTop: 8, gap: 16 },

  row: { flexDirection: 'row', gap: 12 },
  kpi: {
    flex: 1,
    backgroundColor: '#1f2738',
    borderRadius: 16,
    padding: 12,
  },
  kpiIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  kpiLabel: { color: '#aab4c6' },
  kpiValue: { fontSize: 18, fontWeight: '800', marginTop: 2 },

  rate: { flex: 1, backgroundColor: '#1f2738', borderRadius: 16, padding: 12 },
  rateTitle: { color: '#c8d0e3', fontWeight: '600' },
  rateValue: { color: 'white', fontWeight: '800', fontSize: 18, marginTop: 4 },
  rateHint: { color: '#92a0ba', marginTop: 2 },

  quickRow: { flexDirection: 'row', gap: 12 },
  quickBtn: {
    flex: 1,
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  quickTxt: { 
    color: '#1f2738', 
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
  },

  section: { gap: 10 },
  sectionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: '800' },
  sectionAction: { color: '#f3b34c', fontWeight: '700' },

  tile: { backgroundColor: '#1f2738', borderRadius: 14, padding: 14, marginBottom: 10 },
  tileTitle: { color: '#e8edf7', fontWeight: '700' },
  tileSubtitle: { color: '#9aa7bf', marginTop: 2 },

  newsItem: { backgroundColor: '#1f2738', borderRadius: 14, padding: 14, marginBottom: 10 },
  newsTitle: { color: '#e8edf7', fontWeight: '700' },
  newsMeta: { color: '#9aa7bf', marginTop: 4 },
  newsLink: { color: '#f3b34c', marginTop: 6, fontWeight: '700' },

  loader: { paddingVertical: 14, alignItems: 'center' },
  empty: { backgroundColor: '#1f2738', borderRadius: 14, padding: 14 },
  emptyTxt: { color: '#9aa7bf' },

  // Dropdowns anclados en el header
  dropdownWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 0,
    zIndex: 1000,
  },
  dropdownCard: {
    backgroundColor: '#1f2738',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a3441',
    padding: 12,
  },
  dropdownTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dropdownTitle: { color: '#e2e8f0', fontWeight: '700' },
  dropdownEmpty: { paddingVertical: 12, alignItems: 'center' },
  dropdownEmptyTxt: { color: '#94a3b8' },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  dropdownIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a3441',
  },
  dropdownItemTitle: { color: '#e2e8f0', fontWeight: '700' },
  dropdownItemDesc: { color: '#94a3b8', marginTop: 2 },
  dropdownItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dropdownChevronBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submenu: { marginLeft: 28, gap: 8, marginTop: 6 },
  submenuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  submenuText: { color: '#cbd5e1', fontWeight: '600' },

  // Estilos gráficos de barra
  barChartWrap: { marginTop: 8 },
  barScroll: { marginTop: 6 },
  barChartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingVertical: 8 },
  barItem: { alignItems: 'center', minWidth: 56 },
  bar: { width: 28, backgroundColor: '#f59e0b', borderRadius: 8 },
  barLabel: { color: '#aab4c6', marginTop: 6, fontSize: 12 },
  barValue: { color: '#94a3b8', fontSize: 10, marginBottom: 4 },

  // Year selector styles
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  yearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#2a3441',
  },
  yearBtnActive: {
    backgroundColor: '#3a4553',
  },
  yearBtnTxt: {
    color: '#c8d0e3',
    fontWeight: '700',
  },
  yearArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a3441',
  },
  yearArrowTxt: { color: '#c8d0e3', fontWeight: '700' },
});

export default styles;
