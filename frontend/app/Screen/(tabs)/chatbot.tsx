// app/Screen/chatbot.tsx
import styles from '@/Styles/chatbotStyles';
import { getToken as getSecureToken } from '../../../utils/secureStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import EventSource from 'react-native-event-source';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../constants/api';
import { API_PREFIX, API_URL } from '../../../constants/config';

type MsgUI = { id: string; from: 'user' | 'bot'; text: string; ts?: string };

export default function Chatbot() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<MsgUI>>(null);
  const esRef = useRef<EventSource | null>(null);

  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(44);
  const [messages, setMessages] = useState<MsgUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  // Altura del teclado en Android para evitar solapamiento del input
  const [androidKeyboardH, setAndroidKeyboardH] = useState(0);

  // Cargar historial
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        const hist = await api.chatHistory();
        if (cancel) return;
        const mapped: MsgUI[] = (hist ?? []).map((m) => ({
          id: String(m.id),
          from: m.sender,
          text: m.message,
          ts: m.timestamp,
        }));
        setMessages(mapped);
        requestAnimationFrame(() =>
          listRef.current?.scrollToEnd({ animated: false })
        );
      } catch (e) {
        console.error('chat history error', e);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
      if (esRef.current) {
        try {
          esRef.current.close();
        } catch (error) {
          // Silently handle any errors during cleanup
        }
        esRef.current = null;
      }
    };
  }, []);

  // Ajuste dinámico en Android: cuando aparece el teclado, levantamos la barra de input
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      const h = e?.endCoordinates?.height ?? 0;
      setAndroidKeyboardH(h);
      requestAnimationFrame(() =>
        listRef.current?.scrollToEnd({ animated: true })
      );
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setAndroidKeyboardH(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const canSend = useMemo(
    () => input.trim().length > 0 && !sending,
    [input, sending]
  );

  const handleSend = async () => {
    if (!canSend) return;
    const text = input.trim();
    setInput('');

    // pinta optimista
    const tempId = `local-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, from: 'user', text }]);
    requestAnimationFrame(() =>
      listRef.current?.scrollToEnd({ animated: true })
    );

    // cierra stream previo si hubiese
    if (esRef.current) {
      try {
        esRef.current.close();
      } catch (error) {
        // Silently handle any errors during cleanup
      }
      esRef.current = null;
    }

    // ————— Fallback REST por si el stream no existe o falla —————
    const sendViaRestFallback = async () => {
      try {
        const res = await api.chatSend(text); // POST /api/chat/message
        setMessages((prev) => [
          ...prev,
          {
            id: String(res.bot?.id ?? Date.now()),
            from: 'bot',
            text: res.bot?.message ?? '…',
          },
        ]);
        requestAnimationFrame(() =>
          listRef.current?.scrollToEnd({ animated: true })
        );
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            from: 'bot',
            text: err?.message || 'No pude enviar el mensaje.',
          },
        ]);
      } finally {
        setTyping(false);
        setStreamingText('');
        setSending(false);
      }
    };

    try {
      setSending(true);
      setTyping(true);
      setStreamingText('');

      const token = await getSecureToken();
      const url = `${API_URL}${API_PREFIX}/chat/stream?q=${encodeURIComponent(
        text
      )}`;

      // ----- INTENTO SSE -----
      const es = new EventSource(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      esRef.current = es;

      let acc = '';
      let gotAnyDelta = false;
      let finished = false;

      // si en 4s no llegó nada, cancelar y usar REST
      const startupTimeout = setTimeout(() => {
        if (!gotAnyDelta && !finished) {
          try {
            es.close();
          } catch (error) {
            // Silently handle any errors during cleanup
          }
          sendViaRestFallback();
        }
      }, 4000);

      es.onmessage = (evt: any) => {
        try {
          const payload = JSON.parse(evt.data);
          if (payload?.delta) {
            gotAnyDelta = true;
            acc += payload.delta;
            setStreamingText(acc);
            requestAnimationFrame(() =>
              listRef.current?.scrollToEnd({ animated: true })
            );
          }
        } catch {
          /* keep-alive u otras líneas no JSON */
        }
      };

      es.addEventListener('done', () => {
        finished = true;
        clearTimeout(startupTimeout);
        setTyping(false);
        setStreamingText('');
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            from: 'bot',
            text: acc.length ? acc : '…',
          },
        ]);
        requestAnimationFrame(() =>
          listRef.current?.scrollToEnd({ animated: true })
        );
        try {
          es.close();
        } catch (error) {
          // Silently handle any errors during cleanup
        }
        esRef.current = null;
        setSending(false);
      });

      es.onerror = () => {
        if (finished) return;
        finished = true;
        clearTimeout(startupTimeout);
        try {
          es.close();
        } catch (error) {
          // Silently handle any errors during cleanup
        }
        // Si no llegó nada del stream -> REST
        if (!gotAnyDelta) {
          sendViaRestFallback();
        } else {
          // Si alcanzamos a recibir algo, cerramos con lo acumulado
          setTyping(false);
          setStreamingText('');
          setMessages((prev) => [
            ...prev,
            { id: `bot-${Date.now()}`, from: 'bot', text: acc || '…' },
          ]);
          setSending(false);
        }
      };
    } catch (e: any) {
      console.error('stream send error', e?.message || e);
      // Cualquier excepción: REST
      await sendViaRestFallback();
    }
  };

  const renderItem = ({ item }: { item: MsgUI }) => {
    const isUser = item.from === 'user';
    return (
      <View
        style={[styles.bubbleRow, isUser ? styles.alignEnd : styles.alignStart]}
      >
        <View
          style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}
        >
          <Text
            style={[styles.bubbleText, isUser ? styles.userText : styles.botText]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={[]}
      style={{ flex: 1, backgroundColor: '#0f172a', paddingTop: 0 }}
    >
      {/* Header */}
      <LinearGradient colors={['#0f172a', '#0f172a']} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/Screen/(tabs)/home')}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Asistente Financiero</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Contenido + teclado */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Chat */}
          <View style={styles.chatBox}>
            {loading ? (
              <View style={styles.centerFill}>
                <ActivityIndicator />
                <Text style={styles.hint}>Cargando conversación…</Text>
              </View>
            ) : messages.length === 0 ? (
              // Mostrar texto flotante cuando no hay mensajes
              <View style={styles.centerFill}>
                <Text style={styles.welcomeText}>¿Qué quieres aprender hoy?</Text>
              </View>
            ) : (
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(m) => m.id}
                renderItem={renderItem}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() =>
                  listRef.current?.scrollToEnd({ animated: true })
                }
                onLayout={() =>
                  listRef.current?.scrollToEnd({ animated: false })
                }
                contentContainerStyle={[
                  styles.chatContent,
                  {
                    // deja sitio para la barra de input
                    paddingBottom:
                      Platform.OS === 'ios' 
                        ? insets.bottom + Math.min(120, Math.max(48, inputHeight)) + 20
                        : Platform.OS === 'android'
                          ? Math.min(120, Math.max(48, inputHeight)) + 80 + androidKeyboardH
                          : Math.min(120, Math.max(48, inputHeight)) + 80,
                  },
                ]}
                ListFooterComponent={
                  typing ? (
                    <View style={[styles.bubbleRow, styles.alignStart]}>
                      <View style={[styles.bubble, styles.botBubble]}>
                        {streamingText ? (
                          <Text style={styles.botText}>{streamingText}</Text>
                        ) : (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <ActivityIndicator size="small" />
                            <Text style={styles.botText}>Escribiendo…</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ) : null
                }
              />
            )}
          </View>

          {/* Barra de entrada/input */}
          <View style={[
            styles.inputBar, 
            { 
              paddingBottom: Platform.OS === 'ios' 
                ? insets.bottom + 70
                : Platform.OS === 'android' 
                  ? 16 
                  : 12,
              // En Android, levantamos la barra según la altura del teclado
              marginBottom:
                Platform.OS === 'android'
                  ? androidKeyboardH
                  : Platform.OS === 'web'
                    ? 60
                    : 0,
            }
          ]}>
            <TextInput
              style={[
                styles.input,
                { height: Math.min(120, Math.max(48, inputHeight)) },
              ]}
              placeholder="Escribe tu consulta…"
              placeholderTextColor="#95a0b5"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={1000}
              autoCorrect
              blurOnSubmit={false}
              onContentSizeChange={(e) => {
                const h = e.nativeEvent.contentSize?.height ?? 44;
                setInputHeight(h);
              }}
            />
            <TouchableOpacity
              style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!canSend}
            >
              <Text style={styles.sendButtonText}>
                {sending ? '…' : 'Enviar'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}
