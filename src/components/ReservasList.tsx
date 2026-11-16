import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { Reserva } from '../types/models';
import { extractApiError } from '../utils/errors';
import { formatDatePt, isPastReservation } from '../utils/formatters';
import { DateTimeField } from './DateTimeField';

interface ReservasListProps {
  reservations: Reserva[];
  canManage?: boolean;
  onUpdated?: () => void;
}

export function ReservasList({
  reservations,
  canManage = false,
  onUpdated,
}: ReservasListProps) {
  const { palette } = useTheme();
  const [editTarget, setEditTarget] = useState<Reserva | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Reserva | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editError, setEditError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openEdit = (reserva: Reserva) => {
    setEditError('');
    setEditTarget(reserva);
    setEditDate(reserva.data_evento);
    setEditStart(reserva.hora_inicio.slice(0, 5));
    setEditEnd(reserva.hora_fim.slice(0, 5));
  };

  const openDelete = (reserva: Reserva) => {
    setDeleteError('');
    setDeleteTarget(reserva);
  };

  const confirmEdit = async () => {
    if (!editTarget) return;
    try {
      setSubmitting(true);
      setEditError('');
      await api.patch(`/reservas/${editTarget.id_reserva}`, {
        data_evento: editDate,
        hora_inicio: editStart,
        hora_fim: editEnd,
      });
      setEditTarget(null);
      onUpdated?.();
    } catch (err) {
      setEditError(extractApiError(err, 'Erro ao atualizar reserva.'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      setDeleteError('');
      await api.delete(`/reservas/${deleteTarget.id_reserva}`);
      setDeleteTarget(null);
      onUpdated?.();
    } catch (err) {
      setDeleteError(extractApiError(err, 'Erro ao apagar reserva.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <View style={styles.countRow}>
        <View style={[styles.countPill, { backgroundColor: palette.accentSoft }]}>
          <Text style={{ color: palette.tealText, fontWeight: '700', fontSize: 13 }}>
            {reservations.length} {reservations.length === 1 ? 'reserva' : 'reservas'}
          </Text>
        </View>
      </View>

      {reservations.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
        >
          <Text style={{ color: palette.textMuted, fontStyle: 'italic', fontSize: 14 }}>
            Nenhuma reserva encontrada de momento.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {reservations.map((item) => {
            const past = isPastReservation(item.data_evento, item.hora_fim);
            return (
              <View
                key={item.id_reserva}
                style={[
                  styles.card,
                  { backgroundColor: palette.card, borderColor: palette.border },
                ]}
              >
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.spotTitle, { color: palette.text }]}>
                      Spot {item.id_spot}
                      {item.spot_local ? ` — ${item.spot_local}` : ''}
                    </Text>
                    <Text style={[styles.metaText, { color: palette.textSecondary }]}>
                      {formatDatePt(item.data_evento)} · {item.hora_inicio.slice(0, 5)} -{' '}
                      {item.hora_fim.slice(0, 5)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: past ? palette.dangerSoft : palette.successSoft },
                    ]}
                  >
                    <Text
                      style={{
                        color: past ? palette.danger : palette.success,
                        fontSize: 11,
                        fontWeight: '700',
                      }}
                    >
                      {past ? 'Passada' : 'Agendada'}
                    </Text>
                  </View>
                </View>

                {canManage ? (
                  <View style={[styles.actionsRow, { borderTopColor: palette.border }]}>
                    <Pressable
                      onPress={() => openEdit(item)}
                      style={[styles.actionBtn, { backgroundColor: palette.surfaceMuted }]}
                    >
                      <Ionicons name="pencil-outline" size={16} color={palette.primary} />
                      <Text style={{ color: palette.primary, fontWeight: '600', fontSize: 12 }}>
                        Editar
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => openDelete(item)}
                      style={[styles.actionBtn, { backgroundColor: palette.dangerSoft }]}
                    >
                      <Ionicons name="trash-outline" size={16} color={palette.danger} />
                      <Text style={{ color: palette.danger, fontWeight: '600', fontSize: 12 }}>
                        Apagar
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      {/* Modal Editar */}
      <Modal
        visible={Boolean(editTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setEditTarget(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setEditTarget(null)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: palette.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: palette.tealText }]}>EDITAR RESERVA</Text>

            {editError ? (
              <View
                style={[
                  styles.errorBox,
                  { backgroundColor: palette.dangerSoft, borderColor: palette.danger },
                ]}
              >
                <Text style={{ color: palette.danger, fontSize: 13 }}>{editError}</Text>
              </View>
            ) : null}

            <DateTimeField label="Data" mode="date" value={editDate} onChange={setEditDate} />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <DateTimeField label="Início" mode="time" value={editStart} onChange={setEditStart} />
              </View>
              <View style={{ flex: 1 }}>
                <DateTimeField label="Fim" mode="time" value={editEnd} onChange={setEditEnd} />
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setEditTarget(null)}
                style={[styles.modalBtn, { borderColor: palette.border, borderWidth: 1 }]}
              >
                <Text style={{ color: palette.textSecondary, fontWeight: '600' }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={confirmEdit}
                disabled={submitting}
                style={[styles.modalBtn, { backgroundColor: palette.primary }]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Guardar</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Apagar */}
      <Modal
        visible={Boolean(deleteTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setDeleteTarget(null)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: palette.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: palette.tealText }]}>APAGAR RESERVA</Text>
            <Text style={[styles.confirmBody, { color: palette.textSecondary }]}>
              Tens a certeza que queres apagar a reserva do Spot {deleteTarget?.id_spot} em{' '}
              {formatDatePt(deleteTarget?.data_evento)}? Esta ação não pode ser desfeita.
            </Text>

            {deleteError ? (
              <View
                style={[
                  styles.errorBox,
                  { backgroundColor: palette.dangerSoft, borderColor: palette.danger },
                ]}
              >
                <Text style={{ color: palette.danger, fontSize: 13 }}>{deleteError}</Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setDeleteTarget(null)}
                style={[styles.modalBtn, { borderColor: palette.border, borderWidth: 1 }]}
              >
                <Text style={{ color: palette.textSecondary, fontWeight: '600' }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={confirmDelete}
                disabled={submitting}
                style={[styles.modalBtn, { backgroundColor: palette.danger }]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Apagar</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  countRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  countPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
  },
  list: {
    gap: 10,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  spotTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  metaText: {
    fontSize: 13,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
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
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  confirmBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 90,
    alignItems: 'center',
  },
});
