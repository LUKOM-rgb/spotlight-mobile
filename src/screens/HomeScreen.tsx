import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React, { useCallback, useEffect, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import api from '../api/client';
import { AppHeader } from '../components/AppHeader';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { SpotMapCard } from '../components/SpotMapCard';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MainTabParamList } from '../navigation/types';
import { TopArtist } from '../types/models';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

const PROBLEM_CARDS = [
  {
    icon: 'musical-notes-outline' as const,
    title: "Artists don't know",
    description:
      'where to perform. You find a spot, start playing... and hope no one tells you to stop.',
  },
  {
    icon: 'business-outline' as const,
    title: 'Cities lack control,',
    description: "you approach an artist... and have no idea if they're allowed to be there.",
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: "There's no clear system to",
    description: "manage who's allowed where, officials have difficulty verifying permits.",
  },
];

export function HomeScreen({ navigation }: Props) {
  const { palette } = useTheme();
  const { user } = useAuth();
  const [popularArtists, setPopularArtists] = useState<TopArtist[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadTopArtists = useCallback(async () => {
    try {
      const response = await api.get<{ data: TopArtist[] }>('/artistas/top');
      setPopularArtists(response.data?.data ?? []);
    } catch {
      setPopularArtists([]);
    }
  }, []);

  useEffect(() => {
    void loadTopArtists();
  }, [loadTopArtists]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTopArtists();
    setRefreshing(false);
  };

  const canBookSpots = user?.tipo === 'artista' || user?.tipo === 'admin';

  return (
    <ScreenWrapper refreshing={refreshing} onRefresh={onRefresh}>
      <AppHeader
        title="SpotLight"
        subtitle={user ? `Olá, ${user.nome_utilizador}` : undefined}
      />

      {/* Hero Banner */}
      <View style={styles.heroWrap}>
        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&auto=format&fit=crop&q=60',
          }}
          style={styles.heroImage}
          imageStyle={styles.heroImageRadius}
        >
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>
              A fair way to{'\n'}manage urban{'\n'}performance{'\n'}spaces
            </Text>
            <Text style={styles.heroSubtitle}>
              Connecting cities, artists, and people in one platform.
            </Text>
            <Pressable
              onPress={() => navigation.navigate(canBookSpots ? 'Spots' : 'Artistas')}
              style={styles.heroBtn}
            >
              <Text style={styles.heroBtnText}>
                {canBookSpots ? 'Pick a spot!' : 'Explorar Artistas'}
              </Text>
            </Pressable>
          </View>
        </ImageBackground>
      </View>

      {/* Problem Cards */}
      <Text style={[styles.sectionTitle, { color: palette.accent }]}>
        Everyone shares the city. No one shares the system.
      </Text>

      <View style={styles.problemList}>
        {PROBLEM_CARDS.map((card, index) => (
          <View
            key={index}
            style={[
              styles.problemCard,
              { backgroundColor: palette.card, borderColor: palette.border },
            ]}
          >
            <View style={[styles.problemIconCircle, { backgroundColor: palette.surface }]}>
              <Ionicons name={card.icon} size={22} color={palette.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.problemTitle, { color: palette.text }]}>{card.title}</Text>
              <Text style={[styles.problemDesc, { color: palette.textMuted }]}>
                {card.description}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Spots Map */}
      <Text style={[styles.sectionTitle, { color: palette.accent }]}>Spots Map</Text>
      <SpotMapCard />

      {/* Popular Artists */}
      <Text style={[styles.sectionTitle, { color: palette.accent, marginTop: 22 }]}>
        Most Popular Artists
      </Text>
      {popularArtists.length === 0 ? (
        <Text style={[styles.emptyText, { color: palette.textMuted }]}>
          Ainda não há artistas com seguidores na plataforma.
        </Text>
      ) : (
        <View style={styles.artistList}>
          {popularArtists.map((artist, index) => (
            <View
              key={`${artist.name}-${index}`}
              style={[
                styles.artistCard,
                {
                  backgroundColor: palette.accentSoft,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={[styles.artistName, { color: palette.text }]}>{artist.name}</Text>
              <Text style={[styles.artistFollowers, { color: palette.textSecondary }]}>
                {artist.followers.toLocaleString()} followers
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Call to Action -> Ocorrências */}
      <View
        style={[
          styles.ctaCard,
          { backgroundColor: palette.primaryDark, borderColor: palette.border },
        ]}
      >
        <Text style={styles.ctaTitle}>Need to contact us or submit a request?</Text>
        <Text style={styles.ctaDesc}>
          Whether you want to suggest a new performance space, report an issue, or apply for an
          urban permit, our forms are ready to help you get in touch with the administration team.
        </Text>
        <Pressable
          onPress={() => navigation.navigate('Ocorrencias')}
          style={styles.ctaBtn}
        >
          <Text style={[styles.ctaBtnText, { color: palette.primaryDark }]}>Go to Forms</Text>
        </Pressable>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 22,
  },
  heroImage: {
    height: 260,
    justifyContent: 'center',
  },
  heroImageRadius: {
    borderRadius: 16,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    padding: 20,
    justifyContent: 'center',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: 8,
  },
  heroSubtitle: {
    color: '#7DD3C0',
    fontSize: 14,
    marginBottom: 14,
  },
  heroBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#40798C',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  heroBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  problemList: {
    gap: 10,
    marginBottom: 22,
  },
  problemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  problemIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  problemTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  problemDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  artistList: {
    gap: 8,
  },
  artistCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  artistName: {
    fontSize: 15,
    fontWeight: '600',
  },
  artistFollowers: {
    fontSize: 13,
    fontWeight: '500',
  },
  ctaCard: {
    marginTop: 24,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
  },
  ctaTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 8,
  },
  ctaDesc: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  ctaBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  ctaBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
