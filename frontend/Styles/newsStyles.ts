import { StyleSheet } from 'react-native';

// Paleta de colores consistente con la aplicación
const palette = {
  bg: '#2f3b52',
  card: 'rgba(255,255,255,0.08)',
  cardAlt: 'rgba(255,255,255,0.12)',
  border: 'rgba(255,255,255,0.14)',
  textPrimary: '#F8FAFC',
  textMuted: '#CBD5E1',
  brand: '#f59e0b', // Color de acento principal
  brandSoft: 'rgba(245, 158, 11, 0.15)',
  success: '#16a34a',
  warning: '#f59e0b',
  error: '#ef4444',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
    paddingHorizontal: 14,
    paddingTop: 12,
  },

  centerFill: { alignItems: 'center', justifyContent: 'center' },
  hint: { color: palette.textMuted, marginTop: 8 },

  headerTitle: {
    color: palette.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  rateRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  rateCard: {
    flex: 1,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  rateLabel: { 
    color: palette.brand, 
    fontSize: 13, 
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  rateValue: { 
    color: palette.textPrimary, 
    fontSize: 17, 
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  rateSub: { 
    color: palette.textMuted, 
    fontSize: 11, 
    marginTop: 6,
    fontWeight: '500',
  },

  errorText: {
    color: palette.error,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  sectionTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 12,
    letterSpacing: 0.3,
  },

  listContent: {
    paddingBottom: 60,
  },

  newsCard: {
    backgroundColor: palette.cardAlt,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  newsTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 22,
  },
  newsMetaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  newsMeta: { 
    color: palette.textMuted, 
    fontSize: 12, 
    fontWeight: '500',
  },

  newsLink: {
    color: palette.brand,
    marginTop: 10,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },

  emptyText: {
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: 32,
    fontSize: 15,
    fontWeight: '500',
  },
});

export default styles;
