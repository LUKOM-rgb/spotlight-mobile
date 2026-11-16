import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import api from '../api/client';
import { ReservasList } from '../components/ReservasList';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../navigation/types';
import { Reserva, Spot, Utilizador } from '../types/models';

type Props = NativeStackScreenProps<RootStackParamList, 'ArtistReservations'>;

export function ArtistReservationsScreen({ route }: Props) {
  const { id_artista, artistName } = route.params;
  const { palette } = useTheme();

  const [reservations, setReservations] = useState<Reserva[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [resolvedName, setResolvedName] = useState<string>(artistName ?? '');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [resReservas, resSpots, resArtist] = await Promise.all([
        api.get<{ data: Reserva[] }>(`/reservas/artista/${id_artista}`),
        api.get<{ data: Spot[] }>('/spots').catch(() => ({ data: { data: [] as Spot[] } })),
        api
          .get<{ data: Utilizador }>(`/artistas/${id_artista}`)
          .catch(() => ({ data: { data: null } })),
      ]);

      setReservations(resReservas.data?.data ?? []);
      setSpots(resSpots.data?.data ?? []);
      if (resArtist.data?.data?.nome_utilizador) {
        setResolvedName(resArtist.data.data.nome_utilizador);
      }
    } finally {
      setLoading(false);
    }
  }, [id_artista]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const reservationsWithLocal = useMemo(() => {
    return reservations.map((reserva) => {
      const spot = spots.find((s) => s.id_spot === reserva.id_spot);
      return {
        ...reserva,
        spot_local: spot?.localizacao ?? 'Desconhecido',
      };
    });
  }, [reservations, spots]);

  return (
    <ScreenWrapper refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={[styles.heading, { color: palette.tealText }]}>
        Reservas de {resolvedName || `Artista #${id_artista}`}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={palette.primary} style={{ marginTop: 28 }} />
      ) : (
        <ReservasList reservations={reservationsWithLocal} />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
  },
});
