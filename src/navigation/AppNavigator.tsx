import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AdminPanelScreen } from '../screens/AdminPanelScreen';
import { ArtistReservationsScreen } from '../screens/ArtistReservationsScreen';
import { ArtistasScreen } from '../screens/ArtistasScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { OcorrenciasScreen } from '../screens/OcorrenciasScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { SpotsScreen } from '../screens/SpotsScreen';
import { AuthStackParamList, MainTabParamList, RootStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  const { palette } = useTheme();
  const { user } = useAuth();
  const canAccessSpots = user?.tipo === 'artista' || user?.tipo === 'admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: {
          backgroundColor: palette.tabBar,
          borderTopColor: palette.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Artistas') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Spots')
            iconName = focused ? 'musical-notes' : 'musical-notes-outline';
          else if (route.name === 'Ocorrencias')
            iconName = focused ? 'document-text' : 'document-text-outline';
          else if (route.name === 'Profile')
            iconName = focused ? 'person-circle' : 'person-circle-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="Artistas" component={ArtistasScreen} options={{ title: 'Artistas' }} />
      {canAccessSpots ? (
        <Tab.Screen name="Spots" component={SpotsScreen} options={{ title: 'Spots' }} />
      ) : null}
      <Tab.Screen
        name="Ocorrencias"
        component={OcorrenciasScreen}
        options={{ title: 'Ocorrências' }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { palette, isDark } = useTheme();

  const navTheme: Theme = {
    ...DefaultTheme,
    dark: isDark,
    colors: {
      ...DefaultTheme.colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.card,
      text: palette.text,
      border: palette.border,
      notification: palette.accent,
    },
  };

  if (isLoading) {
    return (
      <View style={[styles.splash, { backgroundColor: palette.background }]}>
        <Image source={require('../../assets/logo.png')} style={styles.splashLogo} />
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={[styles.splashText, { color: palette.textMuted }]}>
          A carregar SpotLight...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated ? (
        <RootStack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: palette.card },
            headerTintColor: palette.text,
            headerShadowVisible: false,
          }}
        >
          <RootStack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="ArtistReservations"
            component={ArtistReservationsScreen}
            options={{ title: 'Reservas do Artista' }}
          />
          <RootStack.Screen
            name="AdminPanel"
            component={AdminPanelScreen}
            options={{ title: 'Administração' }}
          />
        </RootStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  splashLogo: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
  },
  splashText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
