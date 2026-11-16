import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { getDefaultApiUrl } from '../config/apiConfig';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AuthStackParamList } from '../navigation/types';
import { extractApiError } from '../utils/errors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login, apiUrl, updateApiUrl } = useAuth();
  const { palette } = useTheme();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [serverModalOpen, setServerModalOpen] = useState(false);
  const [serverUrlDraft, setServerUrlDraft] = useState(apiUrl);

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      setErrorMessage('Preenche o email (ou nome de utilizador) e a password.');
      return;
    }

    try {
      setErrorMessage('');
      setIsLoading(true);
      await login(identifier, password);
    } catch (err) {
      setErrorMessage(
        extractApiError(err, 'Erro ao efetuar login. Verifique as suas credenciais.'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveServerUrl = async () => {
    await updateApiUrl(serverUrlDraft);
    setServerModalOpen(false);
  };

  return (
    <ScreenWrapper keyboardAware contentStyle={styles.container}>
      <View
        style={[
          styles.card,
          { backgroundColor: palette.card, borderColor: palette.border },
        ]}
      >
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: palette.tealText }]}>SPOTLIGHT LOGIN</Text>
        </View>

        {errorMessage ? (
          <View
            style={[
              styles.errorBox,
              { backgroundColor: palette.dangerSoft, borderColor: palette.danger },
            ]}
          >
            <Text style={[styles.errorText, { color: palette.danger }]}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.tealText }]}>
            Email ou Nome de Utilizador:
          </Text>
          <TextInput
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="Email ou username"
            placeholderTextColor={palette.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.input,
              {
                backgroundColor: palette.inputBg,
                borderColor: palette.primary,
                color: palette.text,
              },
            ]}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.tealText }]}>Password:</Text>
          <View
            style={[
              styles.passwordRow,
              {
                backgroundColor: palette.inputBg,
                borderColor: palette.primary,
              },
            ]}
          >
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={palette.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              style={[styles.passwordInput, { color: palette.text }]}
            />
            <Pressable onPress={() => setShowPassword((prev) => !prev)} style={styles.eyeBtn}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={palette.primary}
              />
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={handleLogin}
          disabled={isLoading}
          style={[
            styles.submitBtn,
            { backgroundColor: palette.primary, opacity: isLoading ? 0.6 : 1 },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>Entrar</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Register')} style={styles.linkBtn}>
          <Text style={[styles.linkText, { color: palette.tealText }]}>
            Não tem conta? Registe-se aqui.
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setServerUrlDraft(apiUrl);
            setServerModalOpen(true);
          }}
          style={styles.serverBtn}
        >
          <Ionicons name="server-outline" size={14} color={palette.textMuted} />
          <Text style={[styles.serverText, { color: palette.textMuted }]} numberOfLines={1}>
            API: {apiUrl}
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={serverModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setServerModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setServerModalOpen(false)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: palette.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: palette.tealText }]}>
              ENDEREÇO DO BACKEND
            </Text>
            <Text style={[styles.modalHint, { color: palette.textMuted }]}>
              No Expo Go em telemóvel físico, usa o IP local do teu PC (ex:
              http://192.168.1.50:3000/api). Padrão detetado: {getDefaultApiUrl()}
            </Text>
            <TextInput
              value={serverUrlDraft}
              onChangeText={setServerUrlDraft}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://192.168.1.50:3000/api"
              placeholderTextColor={palette.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: palette.inputBg,
                  borderColor: palette.border,
                  color: palette.text,
                  marginBottom: 14,
                },
              ]}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  const fallback = getDefaultApiUrl();
                  setServerUrlDraft(fallback);
                }}
                style={[styles.modalBtn, { borderColor: palette.border, borderWidth: 1 }]}
              >
                <Text style={{ color: palette.textSecondary, fontWeight: '600', fontSize: 13 }}>
                  Padrão
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSaveServerUrl}
                style={[styles.modalBtn, { backgroundColor: palette.primary }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>Guardar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  logo: {
    width: 64,
    height: 64,
  },
  title: {
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 3,
    textAlign: 'center',
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  submitBtn: {
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  linkBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '500',
  },
  serverBtn: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148,163,184,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  serverText: {
    fontSize: 11,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  modalHint: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
