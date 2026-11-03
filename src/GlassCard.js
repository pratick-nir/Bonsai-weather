import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, type, radius, MOOD_LABEL, useTheme } from './theme';

// Glass tiers: 1 = shelves, 2 = interactive cards, 'glow' = hero highlights and alerts.
// Colors come from the active theme (dark or light).
export default function GlassCard({ level = 1, children, style, pad = 16 }) {
  const { t } = useTheme();
  const g = t.glass[level];
  const shadow = g.shadow && {
    shadowColor: g.shadow.color, shadowOpacity: g.shadow.opacity,
    shadowRadius: g.shadow.radius, shadowOffset: { width: 0, height: g.shadow.y },
  };
  return (
    <View style={[{ borderRadius: radius.lg }, shadow, style]}>
      <View style={{ borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: g.border }}>
        <BlurView intensity={g.blur} tint={t.blurTint} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={g.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={[styles.sheen, { backgroundColor: g.sheen }]} />
        <View style={{ padding: pad }}>{children}</View>
      </View>
    </View>
  );
}

// Primary button: terracotta to amber gradient, dark label (same in both themes)
export function Button({ title, onPress, style }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[{ borderRadius: radius.md, overflow: 'hidden' }, style]}>
      <LinearGradient colors={['#D95D39', '#F59E0B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
        <View style={styles.btnSheen} />
        <Text style={[type.labelLg, { color: colors.obsidian }]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// Frosted pill, solid amber when selected
export function FilterChip({ label, on, onPress }) {
  const { t } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, { backgroundColor: t.chip.bg, borderColor: t.chip.border }, on && { backgroundColor: t.accent, borderColor: t.accent }]}
    >
      <Text style={[type.labelLg, { color: on ? t.onAccent : t.chip.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// Dark / light switch, shown as a pill next to the search bar
export function ThemeToggle() {
  const { t, mode, toggle } = useTheme();
  return (
    <TouchableOpacity onPress={toggle} style={[styles.toggle, { backgroundColor: t.chip.bg, borderColor: t.chip.border }]}>
      <Text style={[type.labelLg, { color: t.chip.text }]}>{mode === 'dark' ? 'Light' : 'Dark'}</Text>
    </TouchableOpacity>
  );
}

// Golden hour indicator chip with a pulsing amber dot
export function MoodChip({ mood, pulse }) {
  const { t } = useTheme();
  return (
    <View style={[styles.mood, { backgroundColor: t.mood.bg, borderColor: t.mood.border }]}>
      <Animated.View style={[styles.dot, { opacity: pulse }]} />
      <Text style={[type.labelSm, { color: t.mood.text }]}>{MOOD_LABEL[mood]}</Text>
    </View>
  );
}

// Search bar: amber border and 3px halo when focused
export function SearchBar({ onSubmit, placeholder }) {
  const { t } = useTheme();
  const [focus, setFocus] = useState(false);
  const [text, setText] = useState('');
  return (
    <View style={[styles.halo, focus && { borderColor: t.input.halo }]}>
      <View style={[styles.search, { backgroundColor: t.input.bg, borderColor: focus ? t.input.focus : t.input.border }]}>
        <BlurView intensity={20} tint={t.blurTint} style={StyleSheet.absoluteFill} />
        <TextInput
          value={text}
          onChangeText={setText}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onSubmitEditing={() => text.trim() && onSubmit(text.trim())}
          placeholder={placeholder}
          placeholderTextColor={t.input.ph}
          returnKeyType="search"
          style={[type.bodyMd, { color: t.text, paddingHorizontal: 14, paddingVertical: 10 }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheen: { position: 'absolute', top: 0, left: 0, right: 0, height: 1 },
  btn: { paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center' },
  btnSheen: { position: 'absolute', top: 0, left: 12, right: 12, height: 1, backgroundColor: 'rgba(255,253,248,0.4)' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full, marginRight: 8, borderWidth: 1 },
  toggle: { paddingHorizontal: 16, justifyContent: 'center', borderRadius: radius.base, borderWidth: 1, marginLeft: 8 },
  mood: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
  dot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginRight: 8,
    shadowColor: colors.primary, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
  },
  halo: { borderRadius: radius.base + 3, borderWidth: 3, borderColor: 'transparent', flex: 1 },
  search: { borderRadius: radius.base, overflow: 'hidden', borderWidth: 1 },
});