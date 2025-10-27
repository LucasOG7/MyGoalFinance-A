import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#141a26', paddingTop: 0 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  headerContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start'
  },
  brand: { color: '#e8edf7', fontWeight: '700', fontSize: 18, marginBottom: 6 },
  h1: { color: 'white', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#c8d0e3', marginTop: 4 },

  // Profile Picture Styles
  profileButton: {
    marginTop: 8,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#f3b34c',
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
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  quickTxt: { 
    color: '#1f2738', 
    fontWeight: '800',
    fontSize: 14,
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
});

export default styles;
