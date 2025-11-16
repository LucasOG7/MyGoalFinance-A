import { StyleSheet } from 'react-native';

// Paleta de colores consistente con la aplicación
const palette = {
  bg: '#0f172a',
  card: '#1f2738',
  cardAlt: '#1f2738',
  border: 'rgba(148,163,184,0.24)',
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
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  centerFill: { alignItems: 'center', justifyContent: 'center' },
  hint: { color: palette.textMuted, marginTop: 8 },

  headerTitle: {
    color: palette.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'left',
    letterSpacing: 0.5,
    paddingTop: 14,
  },

  headerSubtitle: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 22,
    textAlign: 'left',
    letterSpacing: 0.2,
  },

  rateRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
    paddingHorizontal: 6,
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

  columnWrapper: {
    gap: 12,
  },

  newsCard: {
    backgroundColor: palette.cardAlt,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    marginHorizontal: 6,
    flex: 1,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  newsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  newsThumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  newsThumbPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: palette.border,
  },
  newsContent: { flex: 1, marginLeft: 12 },
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

  // Estados de error / vacío con CTA
  retryCard: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  retryText: {
    color: palette.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryBtn: {
    backgroundColor: palette.brand,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryBtnText: { color: '#fff', fontWeight: '800' },

  // Skeleton loaders
  skeletonCard: {
    backgroundColor: palette.cardAlt,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  skeletonRow: { flexDirection: 'row', alignItems: 'center' },
  skeletonThumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)' },
  skeletonLine: { height: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)' },

  emptyText: {
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: 32,
    fontSize: 15,
    fontWeight: '500',
  },
});

export default styles;
