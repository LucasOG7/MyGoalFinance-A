import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2f3b52',
    paddingHorizontal: 14,
    paddingTop: 12,
  },

  centerFill: { alignItems: 'center', justifyContent: 'center' },
  hint: { color: '#cfd6e6', marginTop: 8 },

  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },

  rateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  rateCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  rateLabel: { color: '#e9eefc', opacity: 0.9, fontSize: 12, marginBottom: 4 },
  rateValue: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  rateSub: { color: '#cfd6e6', fontSize: 11, marginTop: 4 },

  errorText: {
    color: '#ffb4b4',
    marginBottom: 10,
    fontSize: 12,
  },

  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 8,
  },

  listContent: {
    paddingBottom: 24,
  },

  newsCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  newsTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  newsMetaRow: { flexDirection: 'row', flexWrap: 'wrap' },
  newsMeta: { color: '#cfd6e6', fontSize: 12, opacity: 0.9 },

  newsLink: {
    color: '#a7d1ff',
    marginTop: 8,
    fontWeight: '700',
    fontSize: 13,
  },

  emptyText: {
    color: '#cfd6e6',
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 24,
  },
});

export default styles;
