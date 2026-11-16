import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import api from '../api/client';
import { DateTimeField } from '../components/DateTimeField';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { SelectModal, SelectOption } from '../components/SelectModal';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../navigation/types';
import {
  Categoria,
  getArtistIdFromUser,
  getArtistProfile,
  Ocorrencia,
  OcorrenciaEstado,
  Reserva,
  Spot,
  UserRole,
  Utilizador,
} from '../types/models';
import { extractApiError } from '../utils/errors';
import { formatDatePt } from '../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminPanel'>;
type AdminSection = 'ocorrencias' | 'reservas' | 'artistas' | 'utilizadores' | 'spots';
type ArtistSort = 'followersDesc' | 'followersAsc' | 'nameAsc';
type UserSort = 'dateDesc' | 'dateAsc' | 'nameAsc';

const ESTADO_OPTIONS: SelectOption<OcorrenciaEstado>[] = [
  { label: 'Pendente', value: 'pendente' },
  { label: 'Em Progresso', value: 'em progresso' },
  { label: 'Resolvida', value: 'resolvida' },
];

export function AdminPanelScreen(_props: Props) {
  const { palette } = useTheme();
  const [section, setSection] = useState<AdminSection>('ocorrencias');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [artists, setArtists] = useState<Utilizador[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [users, setUsers] = useState<Utilizador[]>([]);

  // Paginação e filtros
  const [reservasPage, setReservasPage] = useState(1);
  const [ocorrenciasPage, setOcorrenciasPage] = useState(1);
  const [artistsPage, setArtistsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);

  const [artistCategoryFilter, setArtistCategoryFilter] = useState<number | ''>('');
  const [artistSortBy, setArtistSortBy] = useState<ArtistSort>('followersDesc');
  const [userRoleFilter, setUserRoleFilter] = useState<UserRole | ''>('');
  const [userSortBy, setUserSortBy] = useState<UserSort>('dateDesc');

  // Edição de ocorrência
  const [editingOcorrencia, setEditingOcorrencia] = useState<Ocorrencia | null>(null);
  const [editingEstado, setEditingEstado] = useState<OcorrenciaEstado>('pendente');
  const [ocorrenciaFeedback, setOcorrenciaFeedback] = useState('');
  const [ocorrenciaError, setOcorrenciaError] = useState('');

  // Novo Spot Modal
  const [spotModalOpen, setSpotModalOpen] = useState(false);
  const [spotLocalizacao, setSpotLocalizacao] = useState('');
  const [spotLatitude, setSpotLatitude] = useState('');
  const [spotLongitude, setSpotLongitude] = useState('');
  const [spotAbertura, setSpotAbertura] = useState('09:00');
  const [spotFecho, setSpotFecho] = useState('22:00');
  const [spotError, setSpotError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [resOc, resRes, resArt, resSpots, resCat, resUsers] = await Promise.all([
        api.get<{ data: Ocorrencia[] }>('/ocorrencias').catch(() => ({ data: { data: [] } })),
        api.get<{ data: Reserva[] }>('/reservas').catch(() => ({ data: { data: [] } })),
        api.get<{ data: Utilizador[] }>('/artistas').catch(() => ({ data: { data: [] } })),
        api.get<{ data: Spot[] }>('/spots').catch(() => ({ data: { data: [] } })),
        api.get<{ data: Categoria[] }>('/categorias').catch(() => ({ data: { data: [] } })),
        api.get<{ data: Utilizador[] }>('/utilizadores').catch(() => ({ data: { data: [] } })),
      ]);
      setOcorrencias(resOc.data?.data ?? []);
      setReservas(resRes.data?.data ?? []);
      setArtists(resArt.data?.data ?? []);
      setSpots(resSpots.data?.data ?? []);
      setCategories(resCat.data?.data ?? []);
      setUsers(resUsers.data?.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  useEffect(() => {
    setArtistsPage(1);
  }, [artistCategoryFilter, artistSortBy]);

  useEffect(() => {
    setUsersPage(1);
  }, [userRoleFilter, userSortBy]);

  const getSpotLocation = (spotId: number) =>
    spots.find((s) => s.id_spot === spotId)?.localizacao ?? `Spot #${spotId}`;

  const getArtistName = (artistaId: number) =>
    artists.find((a) => getArtistIdFromUser(a) === artistaId)?.nome_utilizador ??
    `Artista #${artistaId}`;

  const getCategoryName = (catId?: number) =>
    categories.find((c) => c.categoria_id === catId)?.nome_categoria ?? `ID: ${catId ?? 'N/A'}`;

  const handleSaveOcorrenciaEstado = async () => {
    if (!editingOcorrencia) return;
    try {
      setSubmitting(true);
      setOcorrenciaError('');
      await api.patch(`/ocorrencias/${editingOcorrencia.id_ocorrencia}`, {
        estado_ocorrencia: editingEstado,
      });
      setOcorrencias((prev) =>
        prev.map((o) =>
          o.id_ocorrencia === editingOcorrencia.id_ocorrencia
            ? { ...o, estado_ocorrencia: editingEstado }
            : o,
        ),
      );
      setEditingOcorrencia(null);
      setOcorrenciaFeedback('Estado atualizado com sucesso!');
      setTimeout(() => setOcorrenciaFeedback(''), 3000);
    } catch (err) {
      setOcorrenciaError(extractApiError(err, 'Erro ao atualizar estado.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteArtist = (artist: Utilizador) => {
    const artistId = getArtistIdFromUser(artist);
    if (!artistId) return;

    Alert.alert(
      'Remover Artista',
      `Tem a certeza que deseja remover ${artist.nome_utilizador} da plataforma?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/artistas/${artistId}`);
              setArtists((prev) => prev.filter((a) => getArtistIdFromUser(a) !== artistId));
            } catch (err) {
              Alert.alert('Erro', extractApiError(err, 'Não foi possível remover o artista.'));
            }
          },
        },
      ],
    );
  };

  const handleDeleteUser = (target: Utilizador) => {
    Alert.alert(
      'Remover Utilizador',
      `Tem a certeza que deseja remover ${target.nome_utilizador}? Esta ação é irreversível.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/utilizadores/${target.id_utilizador}`);
              setUsers((prev) => prev.filter((u) => u.id_utilizador !== target.id_utilizador));
            } catch (err) {
              Alert.alert('Erro', extractApiError(err, 'Não foi possível remover o utilizador.'));
            }
          },
        },
      ],
    );
  };

  const handleCreateSpot = async () => {
    setSpotError('');
    if (!spotLocalizacao.trim() || !spotLatitude.trim() || !spotLongitude.trim()) {
      setSpotError('Localização, latitude e longitude são obrigatórios.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post<{ data: Spot }>('/spots', {
        localizacao: spotLocalizacao.trim(),
        latitude: Number(spotLatitude.replace(',', '.')),
        longitude: Number(spotLongitude.replace(',', '.')),
        abertura: spotAbertura,
        fecho: spotFecho,
      });
      if (res.data?.data) {
        setSpots((prev) => [...prev, res.data.data]);
      }
      setSpotModalOpen(false);
      setSpotLocalizacao('');
      setSpotLatitude('');
      setSpotLongitude('');
    } catch (err) {
      setSpotError(extractApiError(err, 'Erro ao criar spot.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSpot = (spot: Spot) => {
    Alert.alert('Remover Spot', `Apagar "${spot.localizacao}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/spots/${spot.id_spot}`);
            setSpots((prev) => prev.filter((s) => s.id_spot !== spot.id_spot));
          } catch (err) {
            Alert.alert('Erro', extractApiError(err, 'Erro ao remover spot.'));
          }
        },
      },
    ]);
  };

  // Dados processados + paginação
  const processedArtists = useMemo(() => {
    let list = [...artists];
    if (artistCategoryFilter !== '') {
      list = list.filter((a) => getArtistProfile(a)?.categoria_id === artistCategoryFilter);
    }
    list.sort((a, b) => {
      const fA = getArtistProfile(a)?.Seguidors?.length ?? 0;
      const fB = getArtistProfile(b)?.Seguidors?.length ?? 0;
      if (artistSortBy === 'followersDesc') return fB - fA;
      if (artistSortBy === 'followersAsc') return fA - fB;
      return a.nome_utilizador.localeCompare(b.nome_utilizador);
    });
    return list;
  }, [artists, artistCategoryFilter, artistSortBy]);

  const processedUsers = useMemo(() => {
    let list = [...users];
    if (userRoleFilter !== '') {
      list = list.filter((u) => u.tipo === userRoleFilter);
    }
    list.sort((a, b) => {
      if (userSortBy === 'nameAsc') return a.nome_utilizador.localeCompare(b.nome_utilizador);
      const tA = new Date(a.data_registo).getTime();
      const tB = new Date(b.data_registo).getTime();
      return userSortBy === 'dateDesc' ? tB - tA : tA - tB;
    });
    return list;
  }, [users, userRoleFilter, userSortBy]);

  const paginatedOcorrencias = ocorrencias.slice((ocorrenciasPage - 1) * 5, ocorrenciasPage * 5);
  const ocorrenciasTotalPages = Math.max(1, Math.ceil(ocorrencias.length / 5));

  const paginatedReservas = reservas.slice((reservasPage - 1) * 9, reservasPage * 9);
  const reservasTotalPages = Math.max(1, Math.ceil(reservas.length / 9));

  const paginatedArtists = processedArtists.slice((artistsPage - 1) * 5, artistsPage * 5);
  const artistsTotalPages = Math.max(1, Math.ceil(processedArtists.length / 5));

  const paginatedUsers = processedUsers.slice((usersPage - 1) * 5, usersPage * 5);
  const usersTotalPages = Math.max(1, Math.ceil(processedUsers.length / 5));

  const sections: { key: AdminSection; label: string; count: number }[] = [
    { key: 'ocorrencias', label: 'Ocorrências', count: ocorrencias.length },
    { key: 'reservas', label: 'Reservas', count: reservas.length },
    { key: 'artistas', label: 'Artistas', count: artists.length },
    { key: 'utilizadores', label: 'Utilizadores', count: users.length },
    { key: 'spots', label: 'Spots', count: spots.length },
  ];

  const renderPagination = (page: number, total: number, onChange: (next: number) => void) =>
    total > 1 ? (
      <View style={styles.pagination}>
        <Pressable
          onPress={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          style={[
            styles.pageBtn,
            { backgroundColor: palette.card, borderColor: palette.border, opacity: page === 1 ? 0.4 : 1 },
          ]}
        >
          <Ionicons name="chevron-back" size={18} color={palette.text} />
        </Pressable>
        <Text style={{ color: palette.textSecondary, fontWeight: '600', fontSize: 13 }}>
          {page} / {total}
        </Text>
        <Pressable
          onPress={() => onChange(Math.min(total, page + 1))}
          disabled={page === total}
          style={[
            styles.pageBtn,
            {
              backgroundColor: palette.card,
              borderColor: palette.border,
              opacity: page === total ? 0.4 : 1,
            },
          ]}
        >
          <Ionicons name="chevron-forward" size={18} color={palette.text} />
        </Pressable>
      </View>
    ) : null;

  return (
    <ScreenWrapper refreshing={refreshing} onRefresh={onRefresh}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {sections.map((s) => {
          const active = section === s.key;
          return (
            <Pressable
              key={s.key}
              onPress={() => setSection(s.key)}
              style={[
                styles.sectionTab,
                {
                  backgroundColor: active ? palette.primary : palette.card,
                  borderColor: active ? palette.primary : palette.border,
                },
              ]}
            >
              <Text
                style={{
                  color: active ? '#FFFFFF' : palette.text,
                  fontWeight: '700',
                  fontSize: 13,
                }}
              >
                {s.label} ({s.count})
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color={palette.primary} style={{ marginTop: 32 }} />
      ) : null}

      {/* OCORRÊNCIAS */}
      {!loading && section === 'ocorrencias' ? (
        <View style={styles.sectionBody}>
          {ocorrenciaFeedback ? (
            <View
              style={[
                styles.alert,
                { backgroundColor: palette.successSoft, borderColor: palette.success },
              ]}
            >
              <Text style={{ color: palette.success, fontSize: 13 }}>{ocorrenciaFeedback}</Text>
            </View>
          ) : null}

          {paginatedOcorrencias.length === 0 ? (
            <Text style={[styles.empty, { color: palette.textMuted }]}>
              Nenhuma ocorrência registada.
            </Text>
          ) : (
            paginatedOcorrencias.map((oc) => {
              const badgeColor =
                oc.estado_ocorrencia === 'resolvida'
                  ? palette.success
                  : oc.estado_ocorrencia === 'em progresso'
                    ? palette.warning
                    : palette.danger;
              const badgeBg =
                oc.estado_ocorrencia === 'resolvida'
                  ? palette.successSoft
                  : oc.estado_ocorrencia === 'em progresso'
                    ? palette.warningSoft
                    : palette.dangerSoft;

              return (
                <View
                  key={oc.id_ocorrencia}
                  style={[
                    styles.itemCard,
                    { backgroundColor: palette.card, borderColor: palette.border },
                  ]}
                >
                  <View style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, { color: palette.text }]}>
                        {oc.descricao_ocorrencia || 'Sem descrição'}
                      </Text>
                      <Text style={[styles.itemAccent, { color: palette.tealText }]}>
                        Local: {oc.local_ocorrencia}
                      </Text>
                      <Text style={[styles.itemSub, { color: palette.textMuted }]}>
                        {oc.data_ocorrencia} @ {oc.hora_ocorrencia}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        setOcorrenciaError('');
                        setEditingOcorrencia(oc);
                        setEditingEstado(oc.estado_ocorrencia);
                      }}
                      style={[styles.iconBtn, { backgroundColor: palette.surfaceMuted }]}
                    >
                      <Ionicons name="pencil-outline" size={16} color={palette.primary} />
                    </Pressable>
                  </View>

                  <View style={styles.badgeRow}>
                    <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                      <Text style={{ color: badgeColor, fontSize: 11, fontWeight: '700' }}>
                        {oc.estado_ocorrencia.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
          {renderPagination(ocorrenciasPage, ocorrenciasTotalPages, setOcorrenciasPage)}
        </View>
      ) : null}

      {/* RESERVAS */}
      {!loading && section === 'reservas' ? (
        <View style={styles.sectionBody}>
          {paginatedReservas.length === 0 ? (
            <Text style={[styles.empty, { color: palette.textMuted }]}>
              Nenhuma reserva encontrada de momento.
            </Text>
          ) : (
            paginatedReservas.map((r) => (
              <View
                key={r.id_reserva}
                style={[styles.reservaCard, { backgroundColor: palette.primary }]}
              >
                <Text style={styles.reservaArtist}>{getArtistName(r.id_artista)}</Text>
                <Text style={styles.reservaMeta}>
                  {getSpotLocation(r.id_spot)} · {formatDatePt(r.data_evento)} (
                  {r.hora_inicio.slice(0, 5)} - {r.hora_fim.slice(0, 5)})
                </Text>
              </View>
            ))
          )}
          {renderPagination(reservasPage, reservasTotalPages, setReservasPage)}
        </View>
      ) : null}

      {/* ARTISTAS */}
      {!loading && section === 'artistas' ? (
        <View style={styles.sectionBody}>
          <View
            style={[
              styles.filterCard,
              { backgroundColor: palette.card, borderColor: palette.border },
            ]}
          >
            <SelectModal
              label="Categoria"
              options={[
                { label: 'Todas as Categorias', value: '' as const },
                ...categories.map((c) => ({
                  label: c.nome_categoria,
                  value: c.categoria_id,
                })),
              ]}
              selectedValue={artistCategoryFilter}
              onSelect={setArtistCategoryFilter}
            />
            <SelectModal
              label="Ordenação"
              options={[
                { label: 'Mais Seguidores', value: 'followersDesc' as const },
                { label: 'Menos Seguidores', value: 'followersAsc' as const },
                { label: 'Nome (A-Z)', value: 'nameAsc' as const },
              ]}
              selectedValue={artistSortBy}
              onSelect={setArtistSortBy}
            />
          </View>

          {paginatedArtists.length === 0 ? (
            <Text style={[styles.empty, { color: palette.textMuted }]}>
              Nenhum artista registado.
            </Text>
          ) : (
            paginatedArtists.map((artist) => {
              const artObj = getArtistProfile(artist);
              return (
                <View
                  key={artist.id_utilizador}
                  style={[
                    styles.itemCard,
                    { backgroundColor: palette.card, borderColor: palette.border },
                  ]}
                >
                  <View style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, { color: palette.text }]}>
                        {artist.nome_utilizador}
                      </Text>
                      <Text style={[styles.itemAccent, { color: palette.tealText }]}>
                        Licença: {artObj?.numero_licenca ?? 'N/A'} ·{' '}
                        {getCategoryName(artObj?.categoria_id)}
                      </Text>
                      <Text style={[styles.itemSub, { color: palette.textMuted }]}>
                        Validade: {formatDatePt(artObj?.validade_licenca)} · Seguidores:{' '}
                        {artObj?.Seguidors?.length ?? 0}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleDeleteArtist(artist)}
                      style={[styles.iconBtn, { backgroundColor: palette.dangerSoft }]}
                    >
                      <Ionicons name="trash-outline" size={16} color={palette.danger} />
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
          {renderPagination(artistsPage, artistsTotalPages, setArtistsPage)}
        </View>
      ) : null}

      {/* UTILIZADORES */}
      {!loading && section === 'utilizadores' ? (
        <View style={styles.sectionBody}>
          <View
            style={[
              styles.filterCard,
              { backgroundColor: palette.card, borderColor: palette.border },
            ]}
          >
            <SelectModal
              label="Cargo"
              options={[
                { label: 'Todos os Cargos', value: '' as const },
                { label: 'Admin', value: 'admin' as const },
                { label: 'Artista', value: 'artista' as const },
                { label: 'Utilizador', value: 'utilizador' as const },
              ]}
              selectedValue={userRoleFilter}
              onSelect={setUserRoleFilter}
            />
            <SelectModal
              label="Ordenação"
              options={[
                { label: 'Mais Recentes', value: 'dateDesc' as const },
                { label: 'Mais Antigos', value: 'dateAsc' as const },
                { label: 'Nome (A-Z)', value: 'nameAsc' as const },
              ]}
              selectedValue={userSortBy}
              onSelect={setUserSortBy}
            />
          </View>

          {paginatedUsers.length === 0 ? (
            <Text style={[styles.empty, { color: palette.textMuted }]}>
              Nenhum utilizador registado.
            </Text>
          ) : (
            paginatedUsers.map((u) => (
              <View
                key={u.id_utilizador}
                style={[
                  styles.itemCard,
                  { backgroundColor: palette.card, borderColor: palette.border },
                ]}
              >
                <View style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: palette.text }]}>
                      {u.nome_utilizador}
                    </Text>
                    <Text style={[styles.itemSub, { color: palette.textSecondary }]}>
                      {u.email}
                    </Text>
                    <Text style={[styles.itemSub, { color: palette.textMuted }]}>
                      Tel: {u.numero_telemovel || 'N/A'} · Registo: {formatDatePt(u.data_registo)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleDeleteUser(u)}
                    style={[styles.iconBtn, { backgroundColor: palette.dangerSoft }]}
                  >
                    <Ionicons name="trash-outline" size={16} color={palette.danger} />
                  </Pressable>
                </View>

                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          u.tipo === 'admin'
                            ? palette.dangerSoft
                            : u.tipo === 'artista'
                              ? palette.warningSoft
                              : palette.surfaceMuted,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          u.tipo === 'admin'
                            ? palette.danger
                            : u.tipo === 'artista'
                              ? palette.warning
                              : palette.textSecondary,
                        fontSize: 11,
                        fontWeight: '700',
                      }}
                    >
                      {u.tipo.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
          {renderPagination(usersPage, usersTotalPages, setUsersPage)}
        </View>
      ) : null}

      {/* SPOTS */}
      {!loading && section === 'spots' ? (
        <View style={styles.sectionBody}>
          <Pressable
            onPress={() => {
              setSpotError('');
              setSpotModalOpen(true);
            }}
            style={[styles.addSpotBtn, { backgroundColor: palette.primary }]}
          >
            <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>
              Adicionar Novo Spot
            </Text>
          </Pressable>

          {spots.map((s) => (
            <View
              key={s.id_spot}
              style={[
                styles.itemCard,
                { backgroundColor: palette.card, borderColor: palette.border },
              ]}
            >
              <View style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: palette.text }]}>
                    Spot #{s.id_spot} — {s.localizacao}
                  </Text>
                  <Text style={[styles.itemSub, { color: palette.textMuted }]}>
                    Coords: {s.latitude}, {s.longitude}
                  </Text>
                  <Text style={[styles.itemAccent, { color: palette.tealText }]}>
                    Horário: {s.abertura.slice(0, 5)} - {s.fecho.slice(0, 5)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleDeleteSpot(s)}
                  style={[styles.iconBtn, { backgroundColor: palette.dangerSoft }]}
                >
                  <Ionicons name="trash-outline" size={16} color={palette.danger} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* Modal Editar Estado de Ocorrência */}
      <Modal
        visible={Boolean(editingOcorrencia)}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingOcorrencia(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setEditingOcorrencia(null)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: palette.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: palette.tealText }]}>
              ESTADO DA OCORRÊNCIA #{editingOcorrencia?.id_ocorrencia}
            </Text>

            {ocorrenciaError ? (
              <Text style={{ color: palette.danger, fontSize: 13, marginBottom: 10 }}>
                {ocorrenciaError}
              </Text>
            ) : null}

            <SelectModal
              label="Novo Estado"
              options={ESTADO_OPTIONS}
              selectedValue={editingEstado}
              onSelect={setEditingEstado}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setEditingOcorrencia(null)}
                style={[styles.modalBtn, { borderColor: palette.border, borderWidth: 1 }]}
              >
                <Text style={{ color: palette.textSecondary, fontWeight: '600' }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveOcorrenciaEstado}
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

      {/* Modal Novo Spot */}
      <Modal
        visible={spotModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSpotModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSpotModalOpen(false)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: palette.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: palette.tealText }]}>NOVO SPOT</Text>

            {spotError ? (
              <Text style={{ color: palette.danger, fontSize: 13, marginBottom: 10 }}>
                {spotError}
              </Text>
            ) : null}

            <TextInput
              value={spotLocalizacao}
              onChangeText={setSpotLocalizacao}
              placeholder="Localização (ex: Avenida dos Aliados)"
              placeholderTextColor={palette.textMuted}
              style={[
                styles.input,
                { backgroundColor: palette.inputBg, borderColor: palette.border, color: palette.text },
              ]}
            />
            <View style={styles.row}>
              <TextInput
                value={spotLatitude}
                onChangeText={setSpotLatitude}
                placeholder="Latitude (ex: 41.1496)"
                placeholderTextColor={palette.textMuted}
                keyboardType="numeric"
                style={[
                  styles.input,
                  styles.halfInput,
                  { backgroundColor: palette.inputBg, borderColor: palette.border, color: palette.text },
                ]}
              />
              <TextInput
                value={spotLongitude}
                onChangeText={setSpotLongitude}
                placeholder="Longitude (ex: -8.6109)"
                placeholderTextColor={palette.textMuted}
                keyboardType="numeric"
                style={[
                  styles.input,
                  styles.halfInput,
                  { backgroundColor: palette.inputBg, borderColor: palette.border, color: palette.text },
                ]}
              />
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <DateTimeField
                  label="Abertura"
                  mode="time"
                  value={spotAbertura}
                  onChange={setSpotAbertura}
                />
              </View>
              <View style={{ flex: 1 }}>
                <DateTimeField
                  label="Fecho"
                  mode="time"
                  value={spotFecho}
                  onChange={setSpotFecho}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setSpotModalOpen(false)}
                style={[styles.modalBtn, { borderColor: palette.border, borderWidth: 1 }]}
              >
                <Text style={{ color: palette.textSecondary, fontWeight: '600' }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateSpot}
                disabled={submitting}
                style={[styles.modalBtn, { backgroundColor: palette.primary }]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Criar Spot</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  tabsRow: {
    gap: 8,
    paddingBottom: 14,
  },
  sectionTab: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  sectionBody: {
    gap: 10,
  },
  alert: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  empty: {
    textAlign: 'center',
    padding: 24,
    fontSize: 14,
  },
  filterCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    paddingBottom: 0,
  },
  itemCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemAccent: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  itemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  reservaCard: {
    borderRadius: 14,
    padding: 14,
  },
  reservaArtist: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  reservaMeta: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 4,
  },
  addSpotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
