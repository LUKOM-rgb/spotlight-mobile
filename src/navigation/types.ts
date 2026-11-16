import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Artistas: undefined;
  Spots: undefined;
  Ocorrencias: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  ArtistReservations: {
    id_artista: number;
    artistName?: string;
  };
  AdminPanel: undefined;
};
