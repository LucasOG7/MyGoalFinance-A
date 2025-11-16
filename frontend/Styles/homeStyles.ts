import { StyleSheet, Platform } from "react-native";

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
    backgroundColor: '#0f172a99',
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
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 12,
    overflow: 'hidden', // el gradiente respeta los bordes redondeados
  },
  kpiIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  kpiLabel: { color: '#aab4c6' },
  kpiValue: { fontSize: 18, fontWeight: '800', marginTop: 2 },

  rate: { flex: 1, backgroundColor: '#1f2738', borderRadius: 16, padding: 12 },
  rateTitle: { color: '#f59e0b', fontWeight: '700' },
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
  // Variante para teléfonos: ancho auto según texto (en scroll horizontal)
  quickBtnWide: {
    flex: 0,
    paddingHorizontal: 18,
    minWidth: 140,
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
  dropdownTitle: { color: '#e2e8f0', fontWeight: '700', fontSize: 18 },
  dropdownEmpty: { paddingVertical: 12, alignItems: 'center' },
  dropdownEmptyTxt: { color: '#94a3b8' },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  dropdownIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a3441',
  },
  dropdownItemTitle: { color: '#e2e8f0', fontWeight: '700', fontSize: 16 },
  dropdownItemDesc: { color: '#94a3b8', marginTop: 2 },
  dropdownItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dropdownChevronBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Overlay de menú a pantalla completa
  overlayWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2000,
    elevation: 2000,
  },
  overlayCard: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  overlayTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 8,
    paddingBottom: Platform.OS === 'ios' ? 2 : 12,
    marginTop: Platform.OS === 'ios' ? -28 : 0,
  },
  overlayTopTitle: {
    flex: 1,
    textAlign: 'center',
  },
  overlayContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  submenu: { marginLeft: 32, gap: 10, marginTop: 6 },
  submenuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  submenuText: { color: '#cbd5e1', fontWeight: '600', fontSize: 15 },

  // Estilos gráficos de barra
  barChartWrap: { marginTop: 8 },
  barScroll: { marginTop: 6 },
  barChartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingVertical: 8 },
  barItem: { alignItems: 'center', minWidth: 56, position: 'relative' },
  bar: { width: 28, backgroundColor: 'transparent', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#243044' },
  barLabel: { color: '#aab4c6', marginTop: 6, fontSize: 12 },
  barValue: { color: '#94a3b8', fontSize: 10, marginBottom: 4 },
  barTooltip: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#243044',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  barTooltipTxt: { color: '#e5e7eb', fontWeight: '700', fontSize: 12 },
  barTooltipSub: { color: '#94a3b8', fontWeight: '600', fontSize: 11 },

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
    borderWidth: 1,
    borderColor: '#243044',
  },
  yearBtnActive: {
    backgroundColor: '#3a4553',
    borderColor: '#4b5563',
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
    borderWidth: 1,
    borderColor: '#243044',
  },
  yearArrowTxt: { color: '#c8d0e3', fontWeight: '700' },
});

export default styles;
