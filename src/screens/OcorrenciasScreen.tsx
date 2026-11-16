import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import api from '../api/client';
import { AppHeader } from '../components/AppHeader';
import { DateTimeField } from '../components/DateTimeField';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { SelectModal, SelectOption } from '../components/SelectModal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MainTabParamList } from '../navigation/types';
import { Spot } from '../types/models';
import { extractApiError } from '../utils/errors';

type Props = BottomTabScreenProps<MainTabParamList, 'Ocorrencias'>;

export function OcorrenciasScreen(_props: Props) {
  const { palette } = useTheme();
  const { user } = useAuth();

  const [spotsList, setSpotsList] = useState<Spot[]>([]);
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);
  const [dataOcorrencia, setDataOcorrencia] = useState('');
  const [horaOcorrencia, setHoraOcorrencia] = useState('');
  const [descricao, setDescricao] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadSpots = useCallback(async () => {
    try {
      const response = await api.get<{ data: Spot[] }>('/spots');
      setSpotsList(response.data?.data ?? []);
    } catch {
      setSpotsList([]);
    }
  }, []);

  useEffect(() => {
    void loadSpots();
  }, [loadSpots]);

  const spotOptions = useMemo<SelectOption<number>[]>(
    () =>
      spotsList.map((s) => ({
        value: s.id_spot,
        label: `Spot #${s.id_spot} — ${s.localizacao}`,
        subtitle: `Horário: ${s.abertura.slice(0, 5)} - ${s.fecho.slice(0, 5)}`,
      })),
    [spotsList],
  );

  const resetForm = () => {
    setSelectedSpotId(null);
    setDataOcorrencia('');
    setHoraOcorrencia('');
    setDescricao('');
    setErrorMessage('');
  };

  const handleSubmit = async () => {
    setSuccessMessage('');
    setErrorMessage('');

    if (!selectedSpotId) {
      setErrorMessage('Por favor, selecione o local da ocorrência (Spot).');
      return;
    }
    if (!dataOcorrencia) {
      setErrorMessage('A data da ocorrência é obrigatória.');
      return;
    }
    if (!horaOcorrencia) {
      setErrorMessage('A hora da ocorrência é obrigatória.');
      return;
    }

    const hora = horaOcorrencia.length === 5 ? `${horaOcorrencia}:00` : horaOcorrencia;
    const spotObj = spotsList.find((s) => s.id_spot === selectedSpotId);
    const localOcorrencia = spotObj ? spotObj.localizacao : `Spot ID: ${selectedSpotId}`;

    try {
      setSubmitting(true);
      await api.post('/ocorrencias', {
        data_ocorrencia: dataOcorrencia,
        hora_ocorrencia: hora,
        local_ocorrencia: localOcorrencia,
        descricao_ocorrencia: descricao.trim() || 'Sem descrição',
        estado: 'pendente',
        id_utilizador: user?.id_utilizador ?? 1,
        id_spot: selectedSpotId,
      });

      setSuccessMessage('Ocorrência registada com sucesso!');
      setSelectedSpotId(null);
      setDataOcorrencia('');
      setHoraOcorrencia('');
      setDescricao('');
    } catch (err) {
      setErrorMessage(
        extractApiError(err, 'Erro de rede: não foi possível ligar ao servidor.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenWrapper keyboardAware>
      <AppHeader title="Ocorrências" />

      <Text style={[styles.heading, { color: palette.primary }]}>REGISTO DE OCORRÊNCIA</Text>

      {successMessage ? (
        <View
          style={[
            styles.alert,
            { backgroundColor: palette.successSoft, borderColor: palette.success },
          ]}
        >
          <Text style={{ color: palette.success, fontSize: 13, fontWeight: '600' }}>
            {successMessage}
          </Text>
        </View>
      ) : null}

      {errorMessage ? (
        <View
          style={[
            styles.alert,
            { backgroundColor: palette.dangerSoft, borderColor: palette.danger },
          ]}
        >
          <Text style={{ color: palette.danger, fontSize: 13, fontWeight: '600' }}>
            {errorMessage}
          </Text>
        </View>
      ) : null}

      <View
        style={[
          styles.card,
          { backgroundColor: palette.card, borderColor: palette.border },
        ]}
      >
        <View
          style={[
            styles.sessionBanner,
            {
              backgroundColor: user ? palette.surfaceMuted : palette.warningSoft,
              borderColor: user ? palette.border : palette.warning,
            },
          ]}
        >
          <Ionicons
            name="person-circle-outline"
            size={18}
            color={user ? palette.primary : palette.warning}
          />
          <Text style={{ color: palette.text, fontSize: 12, flex: 1 }}>
            {user
              ? `Sessão ativa como: ${user.email} (ID: ${user.id_utilizador})`
              : 'Nenhum utilizador autenticado detetado.'}
          </Text>
        </View>

        <SelectModal
          label="Spot da Ocorrência"
          placeholder="Selecione o spot"
          options={spotOptions}
          selectedValue={selectedSpotId}
          onSelect={setSelectedSpotId}
          iconName="location-outline"
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <DateTimeField
              label="Data da Ocorrência"
              mode="date"
              value={dataOcorrencia}
              onChange={setDataOcorrencia}
            />
          </View>
          <View style={{ flex: 1 }}>
            <DateTimeField
              label="Hora da Ocorrência"
              mode="time"
              value={horaOcorrencia}
              onChange={setHoraOcorrencia}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.textSecondary }]}>
            Descrição da Ocorrência
          </Text>
          <TextInput
            value={descricao}
            onChangeText={setDescricao}
            multiline
            numberOfLines={4}
            maxLength={255}
            placeholder="Ex: O artista excedeu os limites de ruído estabelecidos após o fecho..."
            placeholderTextColor={palette.textMuted}
            textAlignVertical="top"
            style={[
              styles.textarea,
              {
                backgroundColor: palette.inputBg,
                borderColor: palette.border,
                color: palette.text,
              },
            ]}
          />
          <Text style={[styles.helper, { color: palette.textMuted }]}>
            Descreva detalhadamente o sucedido. Máx. 255 caracteres.
          </Text>
        </View>

        <View style={styles.btnRow}>
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={[
              styles.submitBtn,
              { backgroundColor: palette.primary, opacity: submitting ? 0.6 : 1 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitText}>Registar Ocorrência</Text>
            )}
          </Pressable>

          <Pressable
            onPress={resetForm}
            style={[styles.resetBtn, { borderColor: palette.border }]}
          >
            <Text style={{ color: palette.textSecondary, fontWeight: '600', fontSize: 14 }}>
              Limpar
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 14,
  },
  alert: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 100,
    fontSize: 14,
  },
  helper: {
    fontSize: 11,
    marginTop: 4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  submitBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  resetBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
});
