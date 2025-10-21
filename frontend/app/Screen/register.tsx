// app/Screen/register.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeKeyboardScreen from '../../components/ui/SafeKeyboardScreen';
import { useAuth } from '../../store/auth';
import styles from '../../Styles/registerStyles';

export default function Register() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { register: registerUser, login, setPendingCreds } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  // refs para mover el foco
  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Debe ingresar su nombre';
    if (!email.trim()) e.email = 'Debe ingresar su correo';
    else if (!emailRegex.test(email)) e.email = 'Correo inválido';
    if (!password.trim()) e.password = 'Debe ingresar una contraseña';
    else if (!passwordRegex.test(password))
      e.password = 'Mín 8, 1 mayúscula y 1 carácter especial';
    if (!confirmPassword.trim()) e.confirmPassword = 'Debe confirmar la contraseña';
    else if (password !== confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      setBusy(true);
      const res = await registerUser(name.trim(), email.trim(), password);

      if (res?.requires_confirmation) {
        setPendingCreds({ email: email.trim(), password });
        router.replace('../Screen/confirm-email');
        return;
      }

      await login(email.trim(), password);
      router.replace('/Screen/questionnaire/step1');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo registrar');
    } finally {
      setBusy(false);
    }
  };

  return (
    // 👇 Safe wrapper que permite scroll y evita que el teclado tape los campos
    <SafeKeyboardScreen
      scroll={false}
      bg="#0f172a"
      paddingH={0}
      paddingTop={0}
      extraBottomPad={16}
      withTabBarPadding={false}
    >
      {/* Degradado como en Home: ocupa TODO el ancho */}
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

      {/* Centrado del card + padding lateral */}
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 40,
        }}
      >
        <View style={[styles.box, { width: '100%', maxWidth: 380, alignSelf: 'center' }]}>
          {/* Ícono financiero centrado */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Ionicons name="wallet" size={60} color="#f5a623" />
          </View>
          
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Únete a MyGoalFinance</Text>

          {/* Nombre */}
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Usuario"
            placeholderTextColor="#9aa3b2"
            value={name}
            onChangeText={setName}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => emailRef.current?.focus()}
          />
          {!!errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          {/* Correo */}
          <TextInput
            ref={emailRef}
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="Correo electrónico"
            placeholderTextColor="#9aa3b2"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => passRef.current?.focus()}
          />
          {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          {/* Contraseña (con ojo) */}
          <View style={{ position: 'relative' }}>
            <TextInput
              ref={passRef}
              style={[styles.input, errors.password && styles.inputError, { paddingRight: 44 }]}
              placeholder="Contraseña (Ej: MiClave!2024)"
              placeholderTextColor="#9aa3b2"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => confirmRef.current?.focus()}
            />
            <TouchableOpacity
              onPress={() => setShowPass((v) => !v)}
              style={{ position: 'absolute', right: 10, top: 12, padding: 6 }}
              hitSlop={10}
            >
              <Ionicons name={showPass ? 'eye-off' : 'eye'} size={22} color="#64748b" />
            </TouchableOpacity>
          </View>
          {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          {/* Confirmar contraseña (con ojo) */}
          <View style={{ position: 'relative' }}>
            <TextInput
              ref={confirmRef}
              style={[styles.input, errors.confirmPassword && styles.inputError, { paddingRight: 44 }]}
              placeholder="Repite la contraseña"
              placeholderTextColor="#9aa3b2"
              secureTextEntry={!showPass2}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
            <TouchableOpacity
              onPress={() => setShowPass2((v) => !v)}
              style={{ position: 'absolute', right: 10, top: 12, padding: 6 }}
              hitSlop={10}
            >
              <Ionicons name={showPass2 ? 'eye-off' : 'eye'} size={22} color="#64748b" />
            </TouchableOpacity>
          </View>
          {!!errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}

          {/* Botón Registrar */}
          <TouchableOpacity
            style={[styles.registerButton, busy && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={busy}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerButtonText}>Registrarse</Text>}
          </TouchableOpacity>

          {/* Volver al login */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.replace('/Screen/login')}
            disabled={busy}
          >
            <Text style={styles.loginButtonText}>¿Ya tienes cuenta? Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeKeyboardScreen>
  );
}
