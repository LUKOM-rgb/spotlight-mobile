import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { Reserva, Spot } from '../types/models';
import { extractApiError } from '../utils/errors';
import { formatIsoDate, hoursToLabel, timeToHours } from '../utils/formatters';
import { DateTimeField } from './DateTimeField';

interface OccupancyChartProps {
  selectedSpotId: number | null;
  onReservationCreated?: () => void;
}

export function OccupancyChart({ selectedSpotId, onReservationCreated }: OccupancyChartProps) {
  const { palette } = useTheme();
  const [date, setDate] = useState<string>(() => formatIsoDate(new Date()));
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [openHour, setOpenHour] = useState<number>(8);
  const [closeHour, setCloseHour] = useState<number>(22);
  const [dayReservations, setDayReservations] = useState<Reserva[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadSpotAndReservations = useCallback(async () => {
    if (!selectedSpotId || !date) return;
    try {
      setLoadingChart(true);
      const [spotRes, reservasRes] = await Promise.all([
        api.get<{ data: Spot }>(`/spots/${selectedSpotId}`),
        api.get<{ data: Reserva[] }>(`/reservas/spot/${selectedSpotId}/?date=${date}`),
      ]);

      const spot = spotRes.data?.data;
      if (spot) {
        setOpenHour(Math.max(0, Math.floor(timeToHours(spot.abertura))));
        setCloseHour(Math.min(24, Math.ceil(timeToHours(spot.fecho))));
      }
      setDayReservations(reservasRes.data?.data ?? []);
    } catch {
      setDayReservations([]);
    } finally {
      setLoadingChart(false);
    }
  }, [selectedSpotId, date]);

  useEffect(() => {
    void loadSpotAndReservations();
  }, [loadSpotAndReservations]);

  if (!selectedSpotId) {
    return null;
  }

  const minHour = Math.max(0, openHour - 1);
  const maxHour = Math.min(24, closeHour + 1);
  const totalSpan = Math.max(1, maxHour - minHour);

  const handleSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!date || !startTime || !endTime) {
      setErrorMsg('Por favor preenche todos os campos.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/reservas/${selectedSpotId}/`, {
        data_evento: date,
        hora_inicio: startTime,
        hora_fim: endTime,
      });
      setSuccessMsg('Reserva criada com sucesso!');
      setStartTime('');
      setEndTime('');
      await loadSpotAndReservations();
      onReservationCreated?.();
    } catch (err) {
      setErrorMsg(extractApiError(err, 'Erro ao criar reserva.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.card,
          borderColor: palette.border,
        },
      ]}
    >
      <Text style={[styles.heading, { color: palette.tealText }]}>
        RESERVAR SPOT #{selectedSpotId}
      </Text>

      <DateTimeField label="Data do Evento" mode="date" value={date} onChange={setDate} />

      <View style={styles.row}>
        <View style={styles.half}>
          <DateTimeField
            label="Hora de Início"
            mode="time"
            value={startTime}
            onChange={setStartTime}
          />
        </View>
        <View style={styles.half}>
          <DateTimeField label="Hora de Fim" mode="time" value={endTime} onChange={setEndTime} />
        </View>
      </View>

      {errorMsg ? (
        <View style={[styles.alert, { backgroundColor: palette.dangerSoft, borderColor: palette.danger }]}>
          <Text style={{ color: palette.danger, fontSize: 13 }}>{errorMsg}</Text>
        </View>
      ) : null}

      {successMsg ? (
        <View style={[styles.alert, { backgroundColor: palette.successSoft, borderColor: palette.success }]}>
          <Text style={{ color: palette.success, fontSize: 13 }}>{successMsg}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={handleSubmit}
        disabled={submitting}
        style={[
          styles.submitBtn,
          { backgroundColor: palette.primary, opacity: submitting ? 0.65 : 1 },
        ]}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.submitBtnText}>Confirmar Reserva</Text>
        )}
      </Pressable>

      <View style={styles.chartSection}>
        <Text style={[styles.chartLabel, { color: palette.textMuted }]}>
          OCUPAÇÃO DO DIA SELECIONADO
        </Text>

        {loadingChart ? (
          <ActivityIndicator color={palette.primary} style={{ marginVertical: 12 }} />
        ) : (
          <>
            <View
              style={[
                styles.timelineTrack,
                { backgroundColor: palette.surfaceMuted, borderColor: palette.border },
              ]}
            >
              {dayReservations.map((res) => {
                const startH = timeToHours(res.hora_inicio);
                const endH = timeToHours(res.hora_fim);
                const clampedStart = Math.max(minHour, Math.min(maxHour, startH));
                const clampedEnd = Math.max(clampedStart, Math.min(maxHour, endH));
                const leftPct = ((clampedStart - minHour) / totalSpan) * 100;
                const widthPct = Math.max(2, ((clampedEnd - clampedStart) / totalSpan) * 100);
                return (
                  <View
                    key={res.id_reserva}
                    style={[
                      styles.timelineBlock,
                      {
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        backgroundColor: palette.primary,
                      },
                    ]}
                  />
                );
              })}
            </View>

            <View style={styles.axisRow}>
              <Text style={[styles.axisText, { color: palette.textMuted }]}>
                {hoursToLabel(minHour)}
              </Text>
              <Text style={[styles.axisText, { color: palette.textMuted }]}>
                {hoursToLabel((minHour + maxHour) / 2)}
              </Text>
              <Text style={[styles.axisText, { color: palette.textMuted }]}>
                {hoursToLabel(maxHour)}
              </Text>
            </View>

            {dayReservations.length === 0 ? (
              <Text style={[styles.emptyText, { color: palette.textMuted }]}>
                Sem reservas para este dia.
              </Text>
            ) : (
              <View style={styles.slotsWrap}>
                {dayReservations.map((r) => (
                  <View
                    key={r.id_reserva}
                    style={[styles.slotChip, { backgroundColor: palette.accentSoft }]}
                  >
                    <Text style={{ color: palette.tealText, fontSize: 12, fontWeight: '600' }}>
                      {r.hora_inicio.slice(0, 5)} — {r.hora_fim.slice(0, 5)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  heading: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  half: {
    flex: 1,
  },
  alert: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  submitBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  chartSection: {
    gap: 8,
  },
  chartLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  timelineTrack: {
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  timelineBlock: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 5,
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisText: {
    fontSize: 11,
  },
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  slotsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  slotChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
});
