import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import api from '../api/client';
import { AppHeader } from '../components/AppHeader';
import { OccupancyChart } from '../components/OccupancyChart';
import { ReservasList } from '../components/ReservasList';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { SpotMapCard } from '../components/SpotMapCard';
import { useTheme } from '../context/ThemeContext';
import { MainTabParamList } from '../navigation/types';
import { Reserva, Spot } from '../types/models';

type Props = BottomTabScreenProps<MainTabParamList, 'Spots'>;

export function SpotsScreen(_props: Props) {
  const { palette } = useTheme();
  const [selectedTab, setSelectedTab] = useState<'map' | 'reservations'>('map');
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);
  const [reservations, setReservations] = useState<Reserva[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loadingReservas, setLoadingReservas] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadReservations = useCallback(async () => {
    try {
      setLoadingReservas(true);
      const res = await api.get<{ data?: Reserva[] }>('/reservas/artista/me');
      setReservations(res.status === 204 ? [] : res.data?.data ?? []);
    } catch {
      setReservations([]);
    } finally {
      setLoadingReservas(false);
    }
  }, []);

  const loadSpots = useCallback(async () => {
    try {
      const res = await api.get<{ data: Spot[] }>('/spots');
      setSpots(res.data?.data ?? []);
    } catch {
      setSpots([]);
    }
  }, []);

  useEffect(() => {
    void Promise.all([loadReservations(), loadSpots()]);
  }, [loadReservations, loadSpots]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadReservations(), loadSpots()]);
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
      <AppHeader title="Spots & Reservas" />

      {/* Sub-tabs */}
      <View style={[styles.tabBar, { borderBottomColor: palette.border }]}>
        <Pressable
          onPress={() => setSelectedTab('map')}
          style={[
            styles.tabBtn,
            selectedTab === 'map' && { borderBottomColor: palette.primary, borderBottomWidth: 2 },
          ]}
        >
          <Text
            style={[
              styles.tabLabel,
              { color: selectedTab === 'map' ? palette.tealText : palette.textMuted },
            ]}
          >
            Spot Map
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setSelectedTab('reservations');
            void loadReservations();
          }}
          style={[
            styles.tabBtn,
            selectedTab === 'reservations' && {
              borderBottomColor: palette.primary,
              borderBottomWidth: 2,
            },
          ]}
        >
          <Text
            style={[
              styles.tabLabel,
              { color: selectedTab === 'reservations' ? palette.tealText : palette.textMuted },
            ]}
          >
            My Reservations
          </Text>
        </Pressable>
      </View>

      {selectedTab === 'map' ? (
        <View>
          <SpotMapCard spotsOverride={spots} onSpotSelected={setSelectedSpotId} />
          <OccupancyChart
            selectedSpotId={selectedSpotId}
            onReservationCreated={loadReservations}
          />
        </View>
      ) : loadingReservas ? (
        <ActivityIndicator size="large" color={palette.primary} style={{ marginTop: 28 }} />
      ) : (
        <ReservasList
          reservations={reservationsWithLocal}
          canManage
          onUpdated={loadReservations}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: -1,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
});
