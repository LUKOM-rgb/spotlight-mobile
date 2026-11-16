# SpotLight Mobile (Expo Go + TypeScript)

Versão mobile da aplicação **SpotLight** desenvolvida em **React Native**, **Expo Go (SDK 58)** e **TypeScript**.

## Estrutura Principal

- `App.tsx` — Entrypoint com `SafeAreaProvider`, `ThemeProvider` e `AuthProvider`
- `src/api/client.ts` — Cliente Axios com injeção automática de JWT (`AsyncStorage`)
- `src/config/apiConfig.ts` — Deteção automática do IP do servidor Expo em rede local + URL configurável
- `src/context/AuthContext.tsx` e `src/context/ThemeContext.tsx` — Gestão de autenticação e modo claro/escuro
- `src/navigation/AppNavigator.tsx` — Navegação por Stack + Bottom Tabs por cargo (`utilizador`, `artista`, `admin`)
- `src/screens/`:
  - `LoginScreen.tsx` / `RegisterScreen.tsx`
  - `HomeScreen.tsx`
  - `ArtistasScreen.tsx` / `ArtistReservationsScreen.tsx`
  - `SpotsScreen.tsx`
  - `OcorrenciasScreen.tsx`
  - `ProfileScreen.tsx`
  - `AdminPanelScreen.tsx`

## Como Executar com Expo Go

1. Garante que o backend em `../project-spotlight/backend` está a correr:
   - Se fores testar num **telemóvel físico com Expo Go**, define `HOST=0.0.0.0` no `.env` do backend para aceitar ligações na rede local (além de estar ligado à VPN/rede necessária para a base de dados MySQL).
2. Entra na pasta mobile e inicia o servidor Expo:
   ```bash
   cd spotlight-mobile
   npx expo start
   ```
3. Lê o QR Code com a app **Expo Go** (Android ou iOS).
4. Caso o URL automático da API não coincida com o IP do teu computador, podes ajustá-lo diretamente no botão **API** no ecrã de Login ou nas **Definições da App** no Perfil (ou via `EXPO_PUBLIC_API_URL` num ficheiro `.env`).
