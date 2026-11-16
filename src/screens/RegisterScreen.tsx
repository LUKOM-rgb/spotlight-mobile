import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AuthStackParamList } from '../navigation/types';
import { extractApiError } from '../utils/errors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const { palette } = useTheme();

  const [nomeUtilizador, setNomeUtilizador] = useState('');
  const [email, setEmail] = useState('');
  const [numeroTelemovel, setNumeroTelemovel] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!nomeUtilizador.trim() || !email.trim() || !password) {
      setErrorMessage('Preenche o nome de utilizador, email e password.');
      return;
    }

    try {
      setErrorMessage('');
      setSuccessMessage('');
      setIsLoading(true);
      await register({
        nome_utilizador: nomeUtilizador,
        email,
        numero_telemovel: numeroTelemovel,
        password,
      });
      setSuccessMessage('Conta criada com sucesso! A redirecionar para o login...');
      setTimeout(() => {
        navigation.replace('Login');
      }, 1500);
    } catch (err) {
      setErrorMessage(
        extractApiError(err, 'Erro ao criar conta. Verifique os dados introduzidos.'),
      );
    } finally {
      setIsLoading(false);
    }
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
          <Text style={[styles.title, { color: palette.tealText }]}>SPOTLIGHT REGISTO</Text>
        </View>

        {errorMessage ? (
          <View
            style={[
              styles.alertBox,
              { backgroundColor: palette.dangerSoft, borderColor: palette.danger },
            ]}
          >
            <Text style={[styles.alertText, { color: palette.danger }]}>{errorMessage}</Text>
          </View>
        ) : null}

        {successMessage ? (
          <View
            style={[
              styles.alertBox,
              { backgroundColor: palette.successSoft, borderColor: palette.success },
            ]}
          >
            <Text style={[styles.alertText, { color: palette.success }]}>{successMessage}</Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.tealText }]}>Nome de Utilizador:</Text>
          <TextInput
            value={nomeUtilizador}
            onChangeText={setNomeUtilizador}
            placeholder="Ex: MariaSilva"
            placeholderTextColor={palette.textMuted}
            autoCapitalize="none"
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
          <Text style={[styles.label, { color: palette.tealText }]}>Email:</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="email@exemplo.com"
            placeholderTextColor={palette.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
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
          <Text style={[styles.label, { color: palette.tealText }]}>Telemóvel (opcional):</Text>
          <TextInput
            value={numeroTelemovel}
            onChangeText={setNumeroTelemovel}
            placeholder="912345678"
            placeholderTextColor={palette.textMuted}
            keyboardType="phone-pad"
            maxLength={9}
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
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={palette.textMuted}
            secureTextEntry
            autoCapitalize="none"
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

        <Pressable
          onPress={handleRegister}
          disabled={isLoading}
          style={[
            styles.submitBtn,
            { backgroundColor: palette.primary, opacity: isLoading ? 0.6 : 1 },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>Criar Conta</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Login')} style={styles.linkBtn}>
          <Text style={[styles.linkText, { color: palette.tealText }]}>
            Já tem conta? Faça login aqui.
          </Text>
        </Pressable>
      </View>
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
    marginBottom: 22,
    gap: 10,
  },
  logo: {
    width: 56,
    height: 56,
  },
  title: {
    fontSize: 21,
    fontWeight: '300',
    letterSpacing: 3,
    textAlign: 'center',
  },
  alertBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  alertText: {
    fontSize: 13,
    textAlign: 'center',
  },
  field: {
    marginBottom: 13,
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
});
