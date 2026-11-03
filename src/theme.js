import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ---------- fixed brand values (same in both modes) ---------- */
export const colors = {
  primary: '#F59E0B', apricot: '#FBBF24', peach: '#FED7AA', white: '#FFFDF8',
  terracotta: '#D95D39', obsidian: '#1C1420', espresso: '#2A1D27', lavender: '#4C3F78',
};
export const fonts = { head: 'SpaceGrotesk_500Medium', headBold: 'SpaceGrotesk_600SemiBold', body: 'PlusJakartaSans_400Regular' };
export const type = {
  display:    { fontFamily: fonts.headBold, fontSize: 64, lineHeight: 72, letterSpacing: -1.92 },
  headlineLg: { fontFamily: fonts.head, fontSize: 36, lineHeight: 44, letterSpacing: -0.72 },
  headlineMd: { fontFamily: fonts.head, fontSize: 24, lineHeight: 32, letterSpacing: -0.24 },
  headlineSm: { fontFamily: fonts.head, fontSize: 20, lineHeight: 28 },
  bodyLg:     { fontFamily: fonts.body, fontSize: 18, lineHeight: 28 },
  bodyMd:     { fontFamily: fonts.body, fontSize: 15, lineHeight: 24 },
  bodySm:     { fontFamily: fonts.body, fontSize: 13, lineHeight: 20 },
  labelLg:    { fontFamily: fonts.headBold, fontSize: 14, lineHeight: 20, letterSpacing: 0.28 },
  labelMd:    { fontFamily: fonts.head, fontSize: 12, lineHeight: 16, letterSpacing: 0.48 },
  labelSm:    { fontFamily: fonts.headBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.8, textTransform: 'uppercase' },
};
export const radius = { sm: 4, base: 8, md: 12, lg: 16, xl: 24, full: 9999 };
export const MOOD_LABEL = { day: 'Daylight', golden: 'Golden hour', night: 'After dark' };

/* ---------- DARK: the design file exactly ---------- */
const dark = {
  mode: 'dark', blurTint: 'dark', statusBar: 'light',
  bg: {
    day: ['#1C1420', '#35203B', '#241829'],
    golden: ['#1C1420', '#5A2A3A', '#8A3A24'],
    night: ['#120B17', '#1C1530', '#241829'],
  },
  text: '#FFFDF8', soft: '#FED7AA', mute: 'rgba(254,215,170,0.7)',
  accent: '#F59E0B', accentText: '#FBBF24', value: '#F59E0B', onAccent: '#1C1420', err: '#FFB4AB',
  dot: { day: '#FBBF24', golden: '#F59E0B', night: '#CDBDFF' },
  glass: {
    1: { blur: 30, fill: ['rgba(42,29,39,0.45)', 'rgba(42,29,39,0.45)'], border: 'rgba(254,215,170,0.12)', sheen: 'rgba(255,253,248,0.08)', shadow: null },
    2: { blur: 45, fill: ['rgba(60,35,55,0.65)', 'rgba(30,20,35,0.75)'], border: 'rgba(245,158,11,0.25)', sheen: 'rgba(255,253,248,0.08)',
         shadow: { color: '#120A18', opacity: 0.6, radius: 16, y: 12 } },
    glow: { blur: 60, fill: ['rgba(217,93,57,0.4)', 'rgba(245,158,11,0.2)'], border: 'rgba(245,158,11,0.6)', sheen: 'rgba(255,253,248,0.12)',
            shadow: { color: '#F59E0B', opacity: 0.45, radius: 20, y: 0 } },
  },
  chip: { bg: 'rgba(76,63,120,0.3)', border: 'rgba(254,215,170,0.2)', text: '#FFFDF8' },
  mood: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(251,191,36,0.4)', text: '#FBBF24' },
  input: { bg: 'rgba(28,20,32,0.6)', border: 'rgba(254,215,170,0.15)', focus: '#F59E0B', halo: 'rgba(245,158,11,0.2)', ph: 'rgba(211,196,255,0.45)' },
  rail: { bg: 'rgba(42,29,39,0.7)', border: 'rgba(254,215,170,0.15)' },
  arcLine: 'rgba(254,215,170,0.18)', switchOff: '#4C3F78',
  icon: { sun: '#F4BE3F', moon: '#8FAEF5', cloud: '#B9B9BE', rain: '#7FB2FF', snow: '#DCE8FF', bolt: '#FBBF24' },
  pop: '#8FB7FF',
};

/* ---------- LIGHT: warm cream sky, same amber and terracotta accents ---------- */
const light = {
  mode: 'light', blurTint: 'light', statusBar: 'dark',
  bg: {
    day: ['#FFF6E8', '#FFE7CC', '#FFD9B8'],
    golden: ['#FFEACB', '#FFC98F', '#F7A074'],
    night: ['#E9E3F6', '#D6CCEE', '#C2B6E0'],
  },
  text: '#2A1D27', soft: '#8A3A12', mute: 'rgba(42,29,39,0.62)',
  accent: '#D97706', accentText: '#B45309', value: '#B45309', onAccent: '#1C1420', err: '#B3261E',
  dot: { day: '#D97706', golden: '#D95D39', night: '#4C3F78' },
  glass: {
    1: { blur: 30, fill: ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.55)'], border: 'rgba(217,93,57,0.18)', sheen: 'rgba(255,255,255,0.8)', shadow: null },
    2: { blur: 45, fill: ['rgba(255,255,255,0.82)', 'rgba(255,240,225,0.7)'], border: 'rgba(245,158,11,0.35)', sheen: 'rgba(255,255,255,0.9)',
         shadow: { color: '#8A3A24', opacity: 0.18, radius: 16, y: 10 } },
    glow: { blur: 60, fill: ['rgba(217,93,57,0.3)', 'rgba(245,158,11,0.28)'], border: 'rgba(217,93,57,0.6)', sheen: 'rgba(255,255,255,0.5)',
            shadow: { color: '#F59E0B', opacity: 0.4, radius: 20, y: 0 } },
  },
  chip: { bg: 'rgba(76,63,120,0.1)', border: 'rgba(76,63,120,0.25)', text: '#2A1D27' },
  mood: { bg: 'rgba(245,158,11,0.2)', border: 'rgba(217,119,6,0.5)', text: '#8A3A12' },
  input: { bg: 'rgba(255,255,255,0.7)', border: 'rgba(138,58,18,0.2)', focus: '#D97706', halo: 'rgba(245,158,11,0.25)', ph: 'rgba(74,50,70,0.5)' },
  rail: { bg: 'rgba(42,29,39,0.12)', border: 'rgba(138,58,18,0.2)' },
  arcLine: 'rgba(138,58,18,0.25)', switchOff: '#BFB2DE',
  icon: { sun: '#F0A91F', moon: '#6F8EE8', cloud: '#7A7480', rain: '#4F86E8', snow: '#9DB4D8', bolt: '#D97706' },
  pop: '#3B6FD4',
};
export const themes = { dark, light };

/* ---------- provider: remembers the choice on the phone ---------- */
const KEY = 'bonsai-theme';
const Ctx = createContext({ t: dark, mode: 'dark', toggle: () => {} });
export const useTheme = () => useContext(Ctx);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('dark'); // dark by default, as in the design file
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => { if (v === 'light' || v === 'dark') setMode(v); }).catch(() => {});
  }, []);
  const toggle = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    AsyncStorage.setItem(KEY, next).catch(() => {});
  };
  return <Ctx.Provider value={{ t: themes[mode], mode, toggle }}>{children}</Ctx.Provider>;
}