import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { Spot } from '../types/models';
import { extractApiError } from '../utils/errors';
import { getSpotStatus } from '../utils/formatters';

interface SpotMapCardProps {
  onSpotSelected?: (spotId: number | null) => void;
  spotsOverride?: Spot[];
}

const PORTO_REGION: Region = {
  latitude: 41.1579,
  longitude: -8.6291,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
};

export function SpotMapCard({ onSpotSelected, spotsOverride }: SpotMapCardProps) {
  const { palette } = useTheme();
  const mapRef = useRef<MapView | null>(null);
  const [spots, setSpots] = useState<Spot[]>(spotsOverride ?? []);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [loading, setLoading] = useState(!spotsOverride);
  const [error, setError] = useState('');

  useEffect(() => {
    if (spotsOverride) {
      setSpots(spotsOverride);
      setLoading(false);
      return;
    }

    let mounted = true;
    async function loadSpots() {
      try {
        setLoading(true);
        setError('');
        const response = await api.get<{ data: Spot[] }>('/spots');
        if (mounted) {
          setSpots(response.data?.data ?? []);
        }
      } catch (err) {
        if (mounted) {
          setError(extractApiError(err, 'Não foi possível carregar os spots.'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    void loadSpots();
    return () => {
      mounted = false;
    };
  }, [spotsOverride]);

  const validSpots = spots.filter(
    (s) => Number.isFinite(Number(s.latitude)) && Number.isFinite(Number(s.longitude)),
  );

  const handleSelectSpot = (spot: Spot) => {
    setSelectedSpot(spot);
    onSpotSelected?.(spot.id_spot);
    mapRef.current?.animateToRegion(
      {
        latitude: Number(spot.latitude),
        longitude: Number(spot.longitude),
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      },
      350,
    );
  };

  const handleClearSelection = () => {
    setSelectedSpot(null);
    onSpotSelected?.(null);
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
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={palette.primary} />
            <Text style={[styles.helperText, { color: palette.textMuted }]}>
              A carregar mapa de spots...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Ionicons name="alert-circle-outline" size={28} color={palette.danger} />
            <Text style={[styles.helperText, { color: palette.danger }]}>{error}</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={
              validSpots.length > 0
                ? {
                    latitude: Number(validSpots[0].latitude),
                    longitude: Number(validSpots[0].longitude),
                    latitudeDelta: 0.045,
                    longitudeDelta: 0.045,
                  }
                : PORTO_REGION
            }
          >
            {validSpots.map((spot) => {
              const isSelected = selectedSpot?.id_spot === spot.id_spot;
              return (
                <Marker
                  key={spot.id_spot}
                  coordinate={{
                    latitude: Number(spot.latitude),
                    longitude: Number(spot.longitude),
                  }}
                  title={`Spot #${spot.id_spot}`}
                  description={spot.localizacao}
                  pinColor={isSelected ? '#0B2027' : '#40798C'}
                  onPress={() => handleSelectSpot(spot)}
                />
              );
            })}
          </MapView>
        )}
      </View>

      {validSpots.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          {validSpots.map((spot) => {
            const isSelected = selectedSpot?.id_spot === spot.id_spot;
            return (
              <Pressable
                key={spot.id_spot}
                onPress={() => handleSelectSpot(spot)}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isSelected ? palette.primary : palette.surfaceMuted,
                    borderColor: isSelected ? palette.primary : palette.border,
                  },
                ]}
              >
                <Ionicons
                  name="location"
                  size={14}
                  color={isSelected ? '#FFFFFF' : palette.primary}
                />
                <Text
                  style={{
                    color: isSelected ? '#FFFFFF' : palette.text,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  Spot #{spot.id_spot} · {spot.localizacao}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {selectedSpot ? (
        <View
          style={[
            styles.detailBox,
            {
              backgroundColor: palette.surfaceMuted,
              borderColor: palette.border,
            },
          ]}
        >
          <View style={styles.detailHeader}>
            <Text style={[styles.detailTitle, { color: palette.text }]}>
              Spot #{selectedSpot.id_spot}
            </Text>
            <Pressable
              onPress={handleClearSelection}
              style={[styles.closeBtn, { backgroundColor: palette.card }]}
            >
              <Ionicons name="close" size={16} color={palette.textMuted} />
            </Pressable>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={18} color={palette.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailPrimary, { color: palette.text }]}>
                {selectedSpot.localizacao}
              </Text>
              <Text style={[styles.detailSub, { color: palette.textMuted }]}>
                {selectedSpot.latitude}, {selectedSpot.longitude}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons
              name="time-outline"
              size={18}
              color={getSpotStatus(selectedSpot) === 'open' ? palette.success : palette.danger}
            />
            <Text style={[styles.detailPrimary, { color: palette.text }]}>
              {getSpotStatus(selectedSpot) === 'open' ? 'Aberto' : 'Fechado'}:{' '}
              {selectedSpot.abertura.slice(0, 5)} - {selectedSpot.fecho.slice(0, 5)}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mapContainer: {
    height: 290,
    width: '100%',
  },
  map: {
    flex: 1,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  helperText: {
    fontSize: 13,
    textAlign: 'center',
  },
  pillsRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  detailBox: {
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailPrimary: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailSub: {
    fontSize: 11,
  },
});
