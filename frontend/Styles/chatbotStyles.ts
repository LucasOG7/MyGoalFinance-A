// Styles/chatbotStyles.ts
import { StyleSheet } from 'react-native';

const palette = {
  bg: '#1f2738',
  card: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.18)',
  text: '#E5E7EB',
  textMuted: '#95a0b5',
  brand: '#f59e0b',
  user: '#3b82f6',
};

const styles = StyleSheet.create({
  /* ---------- Layout ---------- */
  container: { flex: 1 },
  content: { flex: 1 },

  /* ---------- Header ---------- */
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  backButton: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: palette.border,
  },
  backButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },

  /* ---------- Lista de mensajes ---------- */
  chatBox: { flex: 1, paddingHorizontal: 12 },
  // Recuerda: el FlatList usa contentContainerStyle={styles.chatContent}
  // y el paddingBottom dinámico lo agrega el SafeKeyboardScreen + estado de input
  chatContent: { paddingTop: 8, gap: 6 },

  bubbleRow: {
    width: '100%',
    marginVertical: 2,
    flexDirection: 'row',
  },
  alignStart: { justifyContent: 'flex-start' },
  alignEnd: { justifyContent: 'flex-end' },

  bubble: {
    maxWidth: '82%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  userBubble: {
    backgroundColor: palette.user,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  botBubble: {
    backgroundColor: palette.card,
    borderColor: palette.border,
  },

  bubbleText: { fontSize: 15, lineHeight: 20 },
  userText: { color: '#fff' },
  botText: { color: palette.text },

  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hint: { marginTop: 8, color: palette.textMuted },

  /* ---------- Barra de entrada (sin absolute) ---------- */
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    color: '#fff',
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  sendButton: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.brand,
  },
  sendButtonDisabled: { opacity: 0.6 },
  sendButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default styles;
