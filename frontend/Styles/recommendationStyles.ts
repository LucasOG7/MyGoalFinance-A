import { StyleSheet } from "react-native";

const recommendationStyles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  headerWrap: { marginTop: -4, zIndex: 2 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: { fontSize: 14, color: "#cbd5e1", marginBottom: 16, textAlign: "center" },

  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    alignSelf: 'center',
    flexWrap: 'wrap',
  },
  levelChip: {
    backgroundColor: '#2a3441',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
  },
  levelChipTxt: { color: '#cbd5e1', fontWeight: '700', fontSize: 12 },

  listContent: { paddingTop: 22, paddingBottom: 24 },

  card: {
    backgroundColor: '#1f2738',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  cardIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2a3441', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: '#e8edf7', fontWeight: '800' },
  cardDesc: { color: '#9aa7bf', lineHeight: 20 },

  infoCard: {
    backgroundColor: '#1f2738',
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
  },
  infoText: { color: '#cbd5e1' },

  errorCard: { backgroundColor: '#fee2e2', borderRadius: 8, padding: 10, marginBottom: 10 },
  errorText: { color: '#b91c1c' },

  ctaBtn: {
    marginTop: 12,
    backgroundColor: '#f59e0b',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaTxt: { color: '#1f2738', fontWeight: '800' },
});

export default recommendationStyles;
