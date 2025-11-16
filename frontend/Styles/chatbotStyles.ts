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
    paddingTop: 8,
  },
  backButton: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0, borderColor: 'transparent',
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
  welcomeText: { 
    fontSize: 24, 
    fontWeight: '600', 
    color: '#fff', 
    textAlign: 'center',
    opacity: 0.9,
    letterSpacing: 0.5,
  },

  /* ---------- Barra de entrada (sin absolute) ---------- */
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#0f172a',
    borderTopWidth: 0,
    borderTopColor: 'transparent',
    position: 'relative',
    zIndex: 1000,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    color: '#fff',
    fontSize: 16,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  sendButton: {
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.brand,
  },
  sendButtonDisabled: { opacity: 0.6 },
  sendButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default styles;
