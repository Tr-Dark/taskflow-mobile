import { useMemo } from 'react';
import { useApp } from './context/AppContext';
import { FontSizePreference, ThemePreference } from './types';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  mutedText: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  warningSoft: string;
  warningText: string;
  successSoft: string;
  successText: string;
  dangerSoft: string;
  dangerText: string;
  cardShadow: string;
  overlay: string;
  tabInactive: string;
}

export const palettes: Record<ThemePreference, ThemeColors> = {
  light: {
    background: '#F8F8FB',
    surface: '#FFFFFF',
    surfaceMuted: '#F1F2F8',
    border: '#E9E9F2',
    text: '#1F1F2E',
    mutedText: '#6D6D85',
    primary: '#5B3DF5',
    primaryDark: '#492DDB',
    primarySoft: '#EEF0FF',
    warningSoft: '#FFF7D8',
    warningText: '#8A6700',
    successSoft: '#E9FAEF',
    successText: '#198754',
    dangerSoft: '#FFE7EA',
    dangerText: '#B3261E',
    cardShadow: 'rgba(19, 17, 54, 0.06)',
    overlay: 'rgba(14, 15, 38, 0.35)',
    tabInactive: '#8B8D9C',
  },
  dark: {
    background: '#11111A',
    surface: '#1A1B28',
    surfaceMuted: '#242638',
    border: '#2E3146',
    text: '#F6F7FB',
    mutedText: '#A0A5C1',
    primary: '#8E7BFF',
    primaryDark: '#7862FF',
    primarySoft: '#2A2452',
    warningSoft: '#3B3114',
    warningText: '#FFD771',
    successSoft: '#183427',
    successText: '#70D59E',
    dangerSoft: '#412129',
    dangerText: '#FF8C98',
    cardShadow: 'rgba(0, 0, 0, 0.28)',
    overlay: 'rgba(0, 0, 0, 0.55)',
    tabInactive: '#8187A2',
  },
};

export const colors = palettes.light;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const radius = {
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

const fontScaleMap: Record<FontSizePreference, number> = {
  small: 0.92,
  medium: 1,
  large: 1.14,
};

export function useThemeColors() {
  const { state } = useApp();
  return useMemo(() => palettes[state.settings.theme], [state.settings.theme]);
}

export function useTypography() {
  const { state } = useApp();
  return useMemo(() => {
    const scale = fontScaleMap[state.settings.fontSize] ?? 1;
    return {
      scale,
      fontSize: (value: number) => Math.round(value * scale),
      lineHeight: (value: number) => Math.round(value * scale),
    };
  }, [state.settings.fontSize]);
}
