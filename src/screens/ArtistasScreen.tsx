import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import api from '../api/client';
import { AppHeader } from '../components/AppHeader';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { SelectModal, SelectOption } from '../components/SelectModal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import {
  Categoria,
  getArtistIdFromUser,
  getArtistProfile,
  Reserva,
  Utilizador,
} from '../types/models';
import { extractApiError } from '../utils/errors';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Artistas'>,
  NativeStackScreenProps<RootStackParamList>
>;

type ArtistSort = 'followersDesc' | 'followersAsc' | 'nameAsc';

const ITEMS_PER_PAGE = 8;

export function ArtistasScreen({ navigation }: Props) {
  const { palette } = useTheme();
  const { user } = useAuth();

  const [artistsList, setArtistsList] = useState<Utilizador[]>([]);
  const [categoriesList, setCategoriesList] = useState<Categoria[]>([]);
  const [reservationsList, setReservationsList] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<ArtistSort>('followersDesc');
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    try {
      const [resArtists, resCategories, resReservas] = await Promise.all([
        api.get<{ data: Utilizador[] }>('/artistas'),
        api.get<{ data: Categoria[] }>('/categorias'),
        api.get<{ data: Reserva[] }>('/reservas'),
      ]);
      setArtistsList(resArtists.data?.data ?? []);
      setCategoriesList(resCategories.data?.data ?? []);
      setReservationsList(resReservas.data?.data ?? []);
    } catch (err) {
      Alert.alert('Erro', extractApiError(err, 'Não foi possível carregar os artistas.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, sortBy]);

  const categoryOptions = useMemo<SelectOption<number | ''>[]>(
    () => [
      { label: 'Todas as Categorias', value: '' },
      ...categoriesList.map((c) => ({
        label: c.nome_categoria,
        value: c.categoria_id,
      })),
    ],
    [categoriesList],
  );

  const sortOptions: SelectOption<ArtistSort>[] = [
    { label: 'Mais Seguidores', value: 'followersDesc' },
    { label: 'Menos Seguidores', value: 'followersAsc' },
    { label: 'Nome (A-Z)', value: 'nameAsc' },
  ];

  const getCategoryName = (catId?: number) => {
    if (!catId) return 'N/A';
    const cat = categoriesList.find((c) => c.categoria_id === catId);
    return cat ? cat.nome_categoria : 'N/A';
  };

  const getReservationsCount = (artistaId?: number) => {
    if (!artistaId) return 0;
    return reservationsList.filter((r) => r.id_artista === artistaId).length;
  };

  const processedArtists = useMemo(() => {
    let result = [...artistsList];

    if (selectedCategory !== '') {
      result = result.filter((artist) => {
        const artObj = getArtistProfile(artist);
        return artObj && artObj.categoria_id === selectedCategory;
      });
    }

    result.sort((a, b) => {
      const artA = getArtistProfile(a);
      const artB = getArtistProfile(b);
      const followersA = artA?.Seguidors?.length ?? 0;
      const followersB = artB?.Seguidors?.length ?? 0;

      if (sortBy === 'followersDesc') return followersB - followersA;
      if (sortBy === 'followersAsc') return followersA - followersB;
      return a.nome_utilizador.localeCompare(b.nome_utilizador);
    });

    return result;
  }, [artistsList, selectedCategory, sortBy]);

  const totalPages = Math.max(1, Math.ceil(processedArtists.length / ITEMS_PER_PAGE));

  const paginatedArtists = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedArtists.slice(start, start + ITEMS_PER_PAGE);
  }, [processedArtists, currentPage]);

  const isFollowing = (artist: Utilizador): boolean => {
    if (!user) return false;
    const artObj = getArtistProfile(artist);
    return Boolean(artObj?.Seguidors?.some((s) => s.id_utilizador === user.id_utilizador));
  };

  const handleToggleFollow = async (artist: Utilizador) => {
    if (!user) {
      Alert.alert('Sessão necessária', 'Inicia sessão para seguires artistas.');
      return;
    }

    const artObj = getArtistProfile(artist);
    if (!artObj) return;

    const currentlyFollowing = isFollowing(artist);

    try {
      if (currentlyFollowing) {
        await api.delete(`/seguidores/${artObj.id_artista}`);
        setArtistsList((prev) =>
          prev.map((item) => {
            if (item.id_utilizador !== artist.id_utilizador) return item;
            const profile = getArtistProfile(item);
            if (!profile) return item;
            const updatedSeguidors = (profile.Seguidors ?? []).filter(
              (s) => s.id_utilizador !== user.id_utilizador,
            );
            return {
              ...item,
              Artistum: item.Artistum
                ? { ...item.Artistum, Seguidors: updatedSeguidors }
                : item.Artistum,
              Artista: item.Artista
                ? { ...item.Artista, Seguidors: updatedSeguidors }
                : item.Artista,
            };
          }),
        );
      } else {
        await api.post('/seguidores', {
          id_utilizador: user.id_utilizador,
          id_artista: artObj.id_artista,
        });
        setArtistsList((prev) =>
          prev.map((item) => {
            if (item.id_utilizador !== artist.id_utilizador) return item;
            const profile = getArtistProfile(item);
            if (!profile) return item;
            const updatedSeguidors = [
              ...(profile.Seguidors ?? []),
              { id_utilizador: user.id_utilizador },
            ];
            return {
              ...item,
              Artistum: item.Artistum
                ? { ...item.Artistum, Seguidors: updatedSeguidors }
                : item.Artistum,
              Artista: item.Artista
                ? { ...item.Artista, Seguidors: updatedSeguidors }
                : item.Artista,
            };
          }),
        );
      }
    } catch (err) {
      Alert.alert('Erro', extractApiError(err, 'Erro ao tentar seguir o artista.'));
    }
  };

  const myArtistId = user ? getArtistIdFromUser(user) : null;

  return (
    <ScreenWrapper refreshing={refreshing} onRefresh={onRefresh}>
      <AppHeader title="Artistas" subtitle={`${processedArtists.length} registados`} />

      <Text style={[styles.pageHeading, { color: palette.tealText }]}>ARTISTAS</Text>

      <View
        style={[
          styles.filterCard,
          { backgroundColor: palette.card, borderColor: palette.border },
        ]}
      >
        <View style={styles.filterRow}>
          <View style={styles.filterCol}>
            <SelectModal
              label="Categoria"
              options={categoryOptions}
              selectedValue={selectedCategory}
              onSelect={setSelectedCategory}
              iconName="filter-outline"
            />
          </View>
          <View style={styles.filterCol}>
            <SelectModal
              label="Ordenar por"
              options={sortOptions}
              selectedValue={sortBy}
              onSelect={setSortBy}
              iconName="swap-vertical-outline"
            />
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={palette.primary} style={{ marginTop: 32 }} />
      ) : paginatedArtists.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
        >
          <Text style={{ color: palette.textMuted, fontSize: 14 }}>
            Nenhum artista encontrado.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {paginatedArtists.map((artist) => {
            const artObj = getArtistProfile(artist);
            const artistId = artObj?.id_artista;
            const followersCount = artObj?.Seguidors?.length ?? 0;
            const reservasCount = getReservationsCount(artistId);
            const following = isFollowing(artist);
            const isSelf = artistId !== undefined && artistId === myArtistId;

            return (
              <View
                key={artist.id_utilizador}
                style={[
                  styles.artistCard,
                  { backgroundColor: palette.card, borderColor: palette.border },
                ]}
              >
                <View style={styles.artistLeft}>
                  <View style={[styles.avatar, { backgroundColor: palette.accentSoft }]}>
                    <Ionicons name="person" size={20} color={palette.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.artistName, { color: palette.text }]} numberOfLines={1}>
                      {artist.nome_utilizador}
                    </Text>
                    <Text style={[styles.artistCat, { color: palette.textMuted }]} numberOfLines={1}>
                      {getCategoryName(artObj?.categoria_id)} · {followersCount}{' '}
                      {followersCount === 1 ? 'seguidor' : 'seguidores'}
                    </Text>
                  </View>
                </View>

                <View style={styles.artistActions}>
                  <Pressable
                    onPress={() => {
                      if (artistId) {
                        navigation.navigate('ArtistReservations', {
                          id_artista: artistId,
                          artistName: artist.nome_utilizador,
                        });
                      }
                    }}
                    style={[styles.reservasBadge, { backgroundColor: palette.accentSoft }]}
                  >
                    <Ionicons name="calendar-outline" size={14} color={palette.tealText} />
                    <Text style={{ color: palette.tealText, fontWeight: '700', fontSize: 12 }}>
                      {reservasCount}
                    </Text>
                  </Pressable>

                  {!isSelf ? (
                    <Pressable
                      onPress={() => handleToggleFollow(artist)}
                      style={[
                        styles.followBtn,
                        {
                          backgroundColor: following ? palette.dangerSoft : palette.successSoft,
                        },
                      ]}
                    >
                      <Ionicons
                        name={following ? 'person-remove-outline' : 'person-add-outline'}
                        size={17}
                        color={following ? palette.danger : palette.success}
                      />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {totalPages > 1 ? (
        <View style={styles.pagination}>
          <Pressable
            onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={[
              styles.pageBtn,
              {
                backgroundColor: palette.card,
                borderColor: palette.border,
                opacity: currentPage === 1 ? 0.45 : 1,
              },
            ]}
          >
            <Ionicons name="chevron-back" size={18} color={palette.text} />
          </Pressable>

          <Text style={[styles.pageLabel, { color: palette.textSecondary }]}>
            Página {currentPage} de {totalPages}
          </Text>

          <Pressable
            onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={[
              styles.pageBtn,
              {
                backgroundColor: palette.card,
                borderColor: palette.border,
                opacity: currentPage === totalPages ? 0.45 : 1,
              },
            ]}
          >
            <Ionicons name="chevron-forward" size={18} color={palette.text} />
          </Pressable>
        </View>
      ) : null}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  pageHeading: {
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 14,
  },
  filterCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    paddingBottom: 0,
    marginBottom: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterCol: {
    flex: 1,
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
  artistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  artistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistName: {
    fontSize: 15,
    fontWeight: '700',
  },
  artistCat: {
    fontSize: 12,
    marginTop: 2,
  },
  artistActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reservasBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  followBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 18,
  },
  pageBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
