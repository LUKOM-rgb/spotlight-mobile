export interface ThemePalette {
  isDark: boolean;
  background: string;
  surface: string;
  surfaceMuted: string;
  card: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryDark: string;
  accent: string;
  accentSoft: string;
  tealText: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  tabBar: string;
  inputBg: string;
}

export const lightPalette: ThemePalette = {
  isDark: false,
  background: '#F5F0E6',
  surface: '#E8E0D0',
  surfaceMuted: '#F3F4F6',
  card: '#FFFFFF',
  border: '#E5E7EB',
  text: '#1F2937',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  primary: '#40798C',
  primaryDark: '#0B2027',
  accent: '#5B9A8B',
  accentSoft: 'rgba(125, 211, 192, 0.25)',
  tealText: '#0D9488',
  danger: '#DC2626',
  dangerSoft: 'rgba(239, 68, 68, 0.12)',
  success: '#059669',
  successSoft: 'rgba(16, 185, 129, 0.14)',
  warning: '#D97706',
  warningSoft: 'rgba(245, 158, 11, 0.15)',
  tabBar: '#FFFFFF',
  inputBg: '#FFFFFF',
};

export const darkPalette: ThemePalette = {
  isDark: true,
  background: '#0F172A',
  surface: '#1E293B',
  surfaceMuted: '#334155',
  card: '#1E293B',
  border: '#334155',
  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  primary: '#14B8A6',
  primaryDark: '#0F766E',
  accent: '#2DD4BF',
  accentSoft: 'rgba(20, 184, 166, 0.18)',
  tealText: '#5EEAD4',
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.16)',
  success: '#34D399',
  successSoft: 'rgba(52, 211, 153, 0.16)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251, 191, 36, 0.16)',
  tabBar: '#0F172A',
  inputBg: '#334155',
};
