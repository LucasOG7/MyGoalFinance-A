// app/Screen/login.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import SafeKeyboardScreen from '../../components/ui/SafeKeyboardScreen';
import { useAuth } from '../../store/auth';
import styles from '../../Styles/loginStyles';
import LanguageSelector from '../../components/LanguageSelector';

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert(t('login.alertAttention'), t('login.alertEnterCredentials'));
      return;
    }
    try {
      setBusy(true);
      await login(email.trim(), password);
      router.replace('/Screen/(tabs)/home');
    } catch (e: any) {
      Alert.alert(t('login.alertError'), e?.message ?? t('login.alertLoginFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeKeyboardScreen scroll={false} bg="#0f172a" paddingH={0} paddingTop={0}>
      {/* Selector de idioma */}
      <LanguageSelector />
      
      {/* Degradado superior a ANCHO COMPLETO */}
      <LinearGradient
        colors={['#1a2644', '#0f172a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.95,
        }}
      />

      {/* Contenedor que centra el modal en toda la pantalla */}
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingHorizontal: 20,
        paddingVertical: 40
      }}>
        <View style={[styles.box, { width: '100%', maxWidth: 380 }]}>
          {/* Overlay con textura sutil */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 20,
            backgroundColor: 'rgba(248, 250, 252, 0.8)',
            opacity: 0.6,
          }} />
          
          {/* Patrón de textura con puntos */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 20,
            backgroundColor: 'transparent',
          }}>
            {/* Simulación de textura con elementos decorativos */}
            <View style={{
              position: 'absolute',
              top: 15,
              right: 15,
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: 'rgba(245, 166, 35, 0.1)',
            }} />
            <View style={{
              position: 'absolute',
              top: 25,
              left: 20,
              width: 3,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: 'rgba(245, 166, 35, 0.08)',
            }} />
            <View style={{
              position: 'absolute',
              bottom: 30,
              right: 25,
              width: 5,
              height: 5,
              borderRadius: 2.5,
              backgroundColor: 'rgba(245, 166, 35, 0.06)',
            }} />
            <View style={{
              position: 'absolute',
              bottom: 45,
              left: 15,
              width: 2,
              height: 2,
              borderRadius: 1,
              backgroundColor: 'rgba(245, 166, 35, 0.1)',
            }} />
          </View>

          {/* Contenido del modal con z-index superior */}
          <View style={{ position: 'relative', zIndex: 10 }}>
            {/* Icono de wallet centrado */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Ionicons name="wallet" size={60} color="#f5a623" />
            </View>
            
            <Text style={styles.title}>{t('MyGoalFinance')}</Text>
            <Text style={styles.subtitle}>{t('Tu futuro financiero comienza aquí')}</Text>

            <TextInput
              style={styles.input}
              placeholder={t('Correo electrónico')}
              placeholderTextColor="#9aa3b2"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
            />

            {/* Contraseña con mostrar/ocutar */}
            <View style={{ position: 'relative' }}>
              <TextInput
                style={[styles.input, { paddingRight: 44 }]}
                placeholder={t('Contraseña')}
                placeholderTextColor="#9aa3b2"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
                onSubmitEditing={onSubmit}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={{ position: 'absolute', right: 10, top: 12, padding: 6 }}
                hitSlop={10}
              >
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, busy && { opacity: 0.7 }]}
              onPress={onSubmit}
              disabled={busy}
            >
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>{t('Iniciar sesión')}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.registerButton} onPress={() => router.push('/Screen/register')} disabled={busy}>
              <Text style={styles.registerButtonText}>{t('¿No tienes cuenta? Regístrate aquí')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeKeyboardScreen>
  );
}
