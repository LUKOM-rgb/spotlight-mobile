import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import api from '../api/client';
import { AppHeader } from '../components/AppHeader';
import { DateTimeField } from '../components/DateTimeField';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { SelectModal, SelectOption } from '../components/SelectModal';
import { getDefaultApiUrl } from '../config/apiConfig';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import {
  Categoria,
  getArtistIdFromUser,
  getArtistProfile,
  Utilizador,
} from '../types/models';
import { extractApiError } from '../utils/errors';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function ProfileScreen({ navigation }: Props) {
  const { user, fetchUser, setToken, logout, apiUrl, updateApiUrl } = useAuth();
  const { palette, isDark, setDarkMode } = useTheme();

  const [nomeUtilizador, setNomeUtilizador] = useState('');
  const [email, setEmail] = useState('');
  const [numeroTelemovel, setNumeroTelemovel] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileIsError, setProfileIsError] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [numeroLicenca, setNumeroLicenca] = useState('');
  const [validadeLicenca, setValidadeLicenca] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [artistMsg, setArtistMsg] = useState('');
  const [artistIsError, setArtistIsError] = useState(false);
  const [savingArtist, setSavingArtist] = useState(false);

  const [categories, setCategories] = useState<Categoria[]>([]);
  const [followedArtists, setFollowedArtists] = useState<Utilizador[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [serverDraft, setServerDraft] = useState(apiUrl);
  const [serverSavedMsg, setServerSavedMsg] = useState('');

  useEffect(() => {
    if (user) {
      setNomeUtilizador(user.nome_utilizador || '');
      setEmail(user.email || '');
      setNumeroTelemovel(user.numero_telemovel || '');
    }
  }, [user]);

  const loadExtraData = useCallback(async () => {
    try {
      const [resCat, resFollowed] = await Promise.all([
        api.get<{ data: Categoria[] }>('/categorias'),
        api.get<{ data: Utilizador[] }>('/seguidores'),
      ]);
      setCategories(resCat.data?.data ?? []);
      setFollowedArtists(resFollowed.data?.data ?? []);
    } catch {
      // Silenciar erro secundário
    }
  }, []);

  useEffect(() => {
    if (user) {
      void loadExtraData();
    }
  }, [user, loadExtraData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUser(), loadExtraData()]);
    setRefreshing(false);
  };

  const categoryOptions = useMemo<SelectOption<number>[]>(
    () =>
      categories.map((c) => ({
        label: c.nome_categoria,
        value: c.categoria_id,
      })),
    [categories],
  );

  const getCategoryName = (catId?: number) => {
    if (!catId) return 'N/A';
    const found = categories.find((c) => c.categoria_id === catId);
    return found ? found.nome_categoria : 'N/A';
  };

  const handleSaveProfile = async () => {
    try {
      setProfileMsg('');
      setProfileIsError(false);
      setSavingProfile(true);
      await api.patch('/utilizadores/me', {
        nome_utilizador: nomeUtilizador.trim(),
        email: email.trim(),
        numero_telemovel: numeroTelemovel.trim(),
      });
      await fetchUser();
      setProfileMsg('Perfil atualizado com sucesso!');
    } catch (err) {
      setProfileIsError(true);
      setProfileMsg(extractApiError(err, 'Erro ao atualizar perfil.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpgradeArtist = async () => {
    if (!numeroLicenca.trim() || !validadeLicenca || !categoriaId) {
      setArtistIsError(true);
      setArtistMsg('Preenche o número da licença, validade e categoria.');
      return;
    }

    try {
      setArtistMsg('');
      setArtistIsError(false);
      setSavingArtist(true);
      const response = await api.post<{ bearerToken?: string }>('/artistas', {
        numero_licenca: numeroLicenca.trim(),
        validade_licenca: validadeLicenca,
        categoria_id: categoriaId,
      });

      if (response.data?.bearerToken) {
        await setToken(response.data.bearerToken);
      }
      await fetchUser();
      setArtistMsg('Parabéns! Foste promovido a Artista!');
    } catch (err) {
      setArtistIsError(true);
      setArtistMsg(extractApiError(err, 'Erro ao submeter pedido.'));
    } finally {
      setSavingArtist(false);
    }
  };

  const handleUnfollow = async (artistId: number | null) => {
    if (!artistId) return;
    try {
      await api.delete(`/seguidores/${artistId}`);
      setFollowedArtists((prev) =>
        prev.filter((a) => getArtistIdFromUser(a) !== artistId),
      );
    } catch (err) {
      Alert.alert('Erro', extractApiError(err, 'Não foi possível deixar de seguir.'));
    }
  };

  const handleLogout = () => {
    Alert.alert('Terminar Sessão', 'Queres mesmo sair da tua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  const handleSaveServer = async () => {
    const saved = await updateApiUrl(serverDraft);
    setServerDraft(saved);
    setServerSavedMsg(`Guardado: ${saved}`);
    setTimeout(() => setServerSavedMsg(''), 3000);
  };

  return (
    <ScreenWrapper refreshing={refreshing} onRefresh={onRefresh} keyboardAware>
      <AppHeader
        title="O Meu Perfil"
        subtitle={user?.tipo ? `Cargo: ${user.tipo.toUpperCase()}` : undefined}
        rightAction={
          <Pressable
            onPress={handleLogout}
            style={[styles.logoutPill, { backgroundColor: palette.dangerSoft }]}
          >
            <Ionicons name="log-out-outline" size={16} color={palette.danger} />
            <Text style={{ color: palette.danger, fontWeight: '700', fontSize: 12 }}>Sair</Text>
          </Pressable>
        }
      />

      {/* Acesso rápido ao Painel Admin */}
      {user?.tipo === 'admin' ? (
        <Pressable
          onPress={() => navigation.navigate('AdminPanel')}
          style={[styles.adminBanner, { backgroundColor: palette.primaryDark }]}
        >
          <View style={styles.adminBannerLeft}>
            <Ionicons name="shield-checkmark" size={24} color="#7DD3C0" />
            <View style={{ flex: 1 }}>
              <Text style={styles.adminBannerTitle}>Painel de Administração</Text>
              <Text style={styles.adminBannerSub}>
                Gerir ocorrências, reservas, artistas, utilizadores e spots
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </Pressable>
      ) : null}

      {/* Dados Pessoais */}
      <View
        style={[
          styles.card,
          { backgroundColor: palette.card, borderColor: palette.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: palette.text }]}>Dados Pessoais</Text>

        {profileMsg ? (
          <View
            style={[
              styles.alert,
              {
                backgroundColor: profileIsError ? palette.dangerSoft : palette.successSoft,
                borderColor: profileIsError ? palette.danger : palette.success,
              },
            ]}
          >
            <Text
              style={{
                color: profileIsError ? palette.danger : palette.success,
                fontSize: 13,
              }}
            >
              {profileMsg}
            </Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.textSecondary }]}>
            Nome de Utilizador:
          </Text>
          <TextInput
            value={nomeUtilizador}
            onChangeText={setNomeUtilizador}
            style={[
              styles.input,
              {
                backgroundColor: palette.inputBg,
                borderColor: palette.border,
                color: palette.text,
              },
            ]}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.textSecondary }]}>E-mail:</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[
              styles.input,
              {
                backgroundColor: palette.inputBg,
                borderColor: palette.border,
                color: palette.text,
              },
            ]}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: palette.textSecondary }]}>Telemóvel:</Text>
          <TextInput
            value={numeroTelemovel}
            onChangeText={setNumeroTelemovel}
            keyboardType="phone-pad"
            maxLength={9}
            style={[
              styles.input,
              {
                backgroundColor: palette.inputBg,
                borderColor: palette.border,
                color: palette.text,
              },
            ]}
          />
        </View>

        <Pressable
          onPress={handleSaveProfile}
          disabled={savingProfile}
          style={[
            styles.primaryBtn,
            { backgroundColor: palette.primary, opacity: savingProfile ? 0.6 : 1 },
          ]}
        >
          {savingProfile ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.primaryBtnText}>Guardar Alterações</Text>
          )}
        </Pressable>
      </View>

      {/* Promover a Artista */}
      {user?.tipo === 'utilizador' ? (
        <View
          style={[
            styles.card,
            { backgroundColor: palette.card, borderColor: palette.primary },
          ]}
        >
          <Text style={[styles.upgradeTitle, { color: palette.tealText }]}>
            Queres atuar nas ruas?
          </Text>
          <Text style={[styles.upgradeSub, { color: palette.textMuted }]}>
            Regista a tua licença para te tornares um Artista Oficial Spotlight.
          </Text>

          {artistMsg ? (
            <View
              style={[
                styles.alert,
                {
                  backgroundColor: artistIsError ? palette.dangerSoft : palette.successSoft,
                  borderColor: artistIsError ? palette.danger : palette.success,
                },
              ]}
            >
              <Text
                style={{
                  color: artistIsError ? palette.danger : palette.success,
                  fontSize: 13,
                }}
              >
                {artistMsg}
              </Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={[styles.label, { color: palette.textSecondary }]}>
              Número da Licença:
            </Text>
            <TextInput
              value={numeroLicenca}
              onChangeText={setNumeroLicenca}
              placeholder="Ex: LIC-12345"
              placeholderTextColor={palette.textMuted}
              autoCapitalize="characters"
              style={[
                styles.input,
                {
                  backgroundColor: palette.inputBg,
                  borderColor: palette.border,
                  color: palette.text,
                },
              ]}
            />
            <Text style={[styles.helper, { color: palette.textMuted }]}>
              A licença deve começar obrigatoriamente por &apos;LIC-&apos;
            </Text>
          </View>

          <DateTimeField
            label="Validade da Licença:"
            mode="date"
            value={validadeLicenca}
            onChange={setValidadeLicenca}
          />

          <SelectModal
            label="Categoria de Atuação:"
            placeholder="Seleciona uma categoria..."
            options={categoryOptions}
            selectedValue={categoriaId}
            onSelect={setCategoriaId}
          />

          <Pressable
            onPress={handleUpgradeArtist}
            disabled={savingArtist}
            style={[
              styles.primaryBtn,
              { backgroundColor: palette.primary, opacity: savingArtist ? 0.6 : 1 },
            ]}
          >
            {savingArtist ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>Tornar-me Artista</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      {/* Artistas Seguidos */}
      <View
        style={[
          styles.card,
          { backgroundColor: palette.card, borderColor: palette.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: palette.text }]}>Artistas que Segues</Text>

        {followedArtists.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: palette.surfaceMuted }]}>
            <Text style={{ color: palette.textMuted, fontSize: 13 }}>
              Ainda não segues nenhum artista. Explora a lista de artistas para acompanhares os
              teus favoritos!
            </Text>
          </View>
        ) : (
          <View style={styles.followedList}>
            {followedArtists.map((artist) => {
              const artObj = getArtistProfile(artist);
              const artistId = getArtistIdFromUser(artist);
              return (
                <View
                  key={artist.id_utilizador}
                  style={[
                    styles.followedItem,
                    { backgroundColor: palette.surfaceMuted, borderColor: palette.border },
                  ]}
                >
                  <View style={styles.followedLeft}>
                    <View style={[styles.followedAvatar, { backgroundColor: palette.accentSoft }]}>
                      <Ionicons name="musical-notes" size={18} color={palette.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: palette.text, fontWeight: '700', fontSize: 14 }}>
                        {artist.nome_utilizador}
                      </Text>
                      <Text style={{ color: palette.tealText, fontSize: 12, fontWeight: '600' }}>
                        {getCategoryName(artObj?.categoria_id)}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => handleUnfollow(artistId)}
                    style={[styles.unfollowBtn, { backgroundColor: palette.dangerSoft }]}
                  >
                    <Ionicons name="person-remove-outline" size={18} color={palette.danger} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Preferências e Ligação */}
      <View
        style={[
          styles.card,
          { backgroundColor: palette.card, borderColor: palette.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: palette.text }]}>Definições da App</Text>

        <View style={styles.switchRow}>
          <View>
            <Text style={{ color: palette.text, fontWeight: '600', fontSize: 14 }}>
              Modo Escuro
            </Text>
            <Text style={{ color: palette.textMuted, fontSize: 12 }}>
              Alternar aparência clara / escura
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={setDarkMode}
            trackColor={{ false: '#CBD5E1', true: palette.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.serverSection}>
          <Text style={[styles.label, { color: palette.textSecondary }]}>
            URL da API Backend:
          </Text>
          <TextInput
            value={serverDraft}
            onChangeText={setServerDraft}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={getDefaultApiUrl()}
            placeholderTextColor={palette.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: palette.inputBg,
                borderColor: palette.border,
                color: palette.text,
              },
            ]}
          />
          {serverSavedMsg ? (
            <Text style={{ color: palette.success, fontSize: 12, marginTop: 4 }}>
              {serverSavedMsg}
            </Text>
          ) : null}
          <Pressable
            onPress={handleSaveServer}
            style={[styles.secondaryBtn, { borderColor: palette.primary }]}
          >
            <Text style={{ color: palette.primary, fontWeight: '700', fontSize: 13 }}>
              Atualizar URL da API
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  logoutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  adminBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  adminBannerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  adminBannerSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  upgradeSub: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
  },
  alert: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  helper: {
    fontSize: 11,
    marginTop: 4,
  },
  primaryBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyBox: {
    padding: 14,
    borderRadius: 10,
  },
  followedList: {
    gap: 10,
  },
  followedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  followedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  followedAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unfollowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  serverSection: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148,163,184,0.35)',
  },
  secondaryBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
});
