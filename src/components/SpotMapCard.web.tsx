import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { Spot } from '../types/models';
import { extractApiError } from '../utils/errors';
import { getSpotStatus } from '../utils/formatters';

interface SpotMapCardProps {
  onSpotSelected?: (spotId: number | null) => void;
  spotsOverride?: Spot[];
}

export function SpotMapCard({ onSpotSelected, spotsOverride }: SpotMapCardProps) {
  const { palette } = useTheme();
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

  const handleSelect = (spot: Spot) => {
    setSelectedSpot(spot);
    onSpotSelected?.(spot.id_spot);
  };

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <Text style={[styles.notice, { color: palette.textMuted }]}>
        Mapa nativo disponível no Expo Go (iOS / Android). Seleciona um Spot abaixo:
      </Text>
      {loading ? (
        <ActivityIndicator color={palette.primary} style={{ padding: 20 }} />
      ) : error ? (
        <Text style={{ color: palette.danger, padding: 12 }}>{error}</Text>
      ) : (
        <View style={styles.list}>
          {spots.map((spot) => {
            const active = selectedSpot?.id_spot === spot.id_spot;
            return (
              <Pressable
                key={spot.id_spot}
                onPress={() => handleSelect(spot)}
                style={[
                  styles.item,
                  {
                    borderColor: active ? palette.primary : palette.border,
                    backgroundColor: active ? palette.accentSoft : palette.surfaceMuted,
                  },
                ]}
              >
                <Ionicons name="location" size={18} color={palette.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: palette.text, fontWeight: '700', fontSize: 14 }}>
                    Spot #{spot.id_spot} · {spot.localizacao}
                  </Text>
                  <Text style={{ color: palette.textMuted, fontSize: 12 }}>
                    {getSpotStatus(spot) === 'open' ? 'Aberto' : 'Fechado'} ({spot.abertura.slice(0, 5)} - {spot.fecho.slice(0, 5)})
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  notice: {
    fontSize: 12,
    marginBottom: 10,
  },
  list: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
});
