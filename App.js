import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk';
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans';

import BonsaiView from './src/BonsaiView';
import GlassCard, { Button, FilterChip, MoodChip, SearchBar, ThemeToggle } from './src/GlassCard';
import HourlyStrip from './src/HourlyStrip';
import SolarArc from './src/SolarArc';
import WeatherIcon from './src/WeatherIcon';
import { locateMe, searchPlace, fetchWeather, getPreset, MODES, CONDITION_LABEL } from './src/weather';
import { type, ThemeProvider, useTheme } from './src/theme';

const TOP = 150; // space above the tree for the search bar and chip
const uvLevel = (u) => (u < 3 ? 'Low' : u < 6 ? 'Moderate' : u < 8 ? 'High' : u < 11 ? 'Very high' : 'Extreme');

export default function App() {
  return (
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  );
}

function Root() {
  const { t, mode } = useTheme();
  const [loaded] = useFonts({ SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, PlusJakartaSans_400Regular });
  const { height } = useWindowDimensions();
  const treeH = Math.round(height * 0.36);

  const [phase, setPhase] = useState('intro');       // 'intro' -> 'hero'
  const [liveOn, setLiveOn] = useState(true);        // live weather or simulation
  const [presetKey, setPresetKey] = useState('golden');
  const [live, setLive] = useState(null);
  const [sel, setSel] = useState(null);              // chosen hour (null = now)
  const [err, setErr] = useState('');
  const progress = useRef(new Animated.Value(0)).current; // 0 = intro, 1 = hero
  const pulse = useRef(new Animated.Value(0.4)).current;
  const started = useRef(false);

  const load = async (placePromise) => {
    setErr('');
    try { setLive(await fetchWeather(await placePromise)); setLiveOn(true); }
    catch (e) { setErr(e.message === 'Place not found' ? 'Place not found' : 'Could not load weather'); console.log('Weather error:', e); }
  };
  useEffect(() => { load(locateMe()); }, []);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true }),
    ])).start();
  }, [pulse]);

  const goHero = () => {
    if (started.current) return;
    started.current = true;
    setPhase('hero');
    Animated.timing(progress, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start();
  };
  useEffect(() => { const timer = setTimeout(goHero, 9000); return () => clearTimeout(timer); }, []); // safety net

  const data = useMemo(() => (liveOn && live ? live : getPreset(liveOn ? 'clear' : presetKey)), [liveOn, live, presetKey]);
  useEffect(() => { setSel(null); }, [data]);

  // the hour chosen on the slider overrides "now" (the tree reacts to it too)
  const hour = sel == null ? null : data.hourly[sel];
  const climate = hour ? { ...data, temp: hour.temp, condition: hour.condition, wind: hour.wind, mood: hour.mood } : data;
  const arcMin = hour ? hour.min : data.nowMin;

  if (!loaded) return null;

  const treeY = progress.interpolate({ inputRange: [0, 1], outputRange: [height / 2 - (TOP + treeH / 2), 0] });
  const treeScale = progress.interpolate({ inputRange: [0, 1], outputRange: [1.25, 1] });
  const heroOpacity = progress.interpolate({ inputRange: [0.4, 1], outputRange: [0, 1] });
  const heroShift = progress.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
  const introOpacity = progress.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0] });

  return (
    <View style={[styles.root, { backgroundColor: t.bg.day[0] }]}>
      <StatusBar style={t.statusBar} />
      <LinearGradient colors={t.bg[climate.mood] || t.bg.day} style={StyleSheet.absoluteFill} />

      {/* The 3D bonsai stays mounted and only moves and scales */}
      <Animated.View style={[styles.tree, { height: treeH, transform: [{ translateY: treeY }, { scale: treeScale }] }]}>
        <BonsaiView
          climate={{ condition: climate.condition, temp: climate.temp, wind: climate.wind, mood: climate.mood, light: mode === 'light' }}
          onDone={goHero}
        />
      </Animated.View>

      <Animated.View pointerEvents="none" style={[styles.intro, { opacity: introOpacity }]}>
        <Text style={[type.labelSm, { color: t.accent, letterSpacing: 2 }]}>Golden hour</Text>
        <Text style={[type.headlineLg, { color: t.text, marginTop: 6 }]}>Growing your forecast</Text>
      </Animated.View>

      {/* Hero page */}
      <Animated.View
        pointerEvents={phase === 'hero' ? 'box-none' : 'none'}
        style={[StyleSheet.absoluteFill, { opacity: heroOpacity, transform: [{ translateY: heroShift }] }]}
      >
        <View style={styles.header}>
          <View style={{ flexDirection: 'row' }}>
            <SearchBar placeholder="Search a city" onSubmit={(q) => load(searchPlace(q))} />
            <ThemeToggle />
          </View>
          <View style={styles.headerRow}>
            <Text style={[type.labelMd, { color: t.soft }]}>{(climate.label || '').toUpperCase()}</Text>
            <MoodChip mood={climate.mood} pulse={pulse} />
          </View>
          {!!err && <Text style={[type.bodySm, { color: t.err, marginTop: 4 }]}>{err}</Text>}
        </View>

        <ScrollView style={{ marginTop: TOP + treeH }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[type.display, { color: t.text }]}>{Math.round(climate.temp)}°</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <WeatherIcon condition={climate.condition} night={climate.mood === 'night'} size={30} />
            <Text style={[type.bodyLg, { color: t.soft, marginLeft: 8 }]}>
              {CONDITION_LABEL[climate.condition]}{hour ? '  ·  ' + hour.label : ''}
            </Text>
          </View>
          <Text style={[type.bodySm, { color: t.mute }]}>H {Math.round(data.hi)}°   L {Math.round(data.lo)}°</Text>

          {/* Golden hour alert (glowing tier) */}
          <GlassCard level="glow" style={{ marginTop: 20 }}>
            <Text style={[type.labelSm, { color: t.accentText }]}>Golden hour window</Text>
            <Text style={[type.headlineMd, { color: t.text, marginTop: 6 }]}>{data.goldenStart} to {data.goldenEnd}</Text>
            <Text style={[type.bodyMd, { color: t.soft, marginTop: 2 }]}>{data.goldenText}</Text>
            <Button title="Use my location" onPress={() => load(locateMe())} style={{ marginTop: 14 }} />
          </GlassCard>

          <Text style={[type.labelSm, styles.section, { color: t.soft }]}>Hourly</Text>
          <HourlyStrip hours={data.hourly} sel={sel} onSelect={setSel} srMin={data.srMin} ssMin={data.ssMin} />

          <Text style={[type.labelSm, styles.section, { color: t.soft }]}>Sun path</Text>
          <GlassCard level="1">
            <SolarArc sunrise={data.sunrise} sunset={data.sunset} srMin={data.srMin} ssMin={data.ssMin} min={arcMin} />
          </GlassCard>

          <Text style={[type.labelSm, styles.section, { color: t.soft }]}>Conditions</Text>
          <View style={styles.grid}>
            <Metric label="UV index" value={String(data.uv)} sub={uvLevel(data.uv)} />
            <Metric label="Humidity" value={Math.round(data.humidity) + '%'} />
            <Metric label="Wind" value={String(Math.round(climate.wind))} sub="km/h" />
            <Metric label="Feels like" value={Math.round(data.feels) + '°'} />
          </View>

          {/* Live / simulation (toggle + filter chips) */}
          <GlassCard level="1" style={{ marginTop: 8 }}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[type.headlineSm, { color: t.text }]}>Live weather</Text>
                <Text style={[type.bodySm, { color: t.mute }]}>Turn off to test how the bonsai reacts</Text>
              </View>
              <Switch
                value={liveOn} onValueChange={setLiveOn}
                trackColor={{ false: t.switchOff, true: t.accent }} thumbColor="#FFFDF8" ios_backgroundColor={t.switchOff}
              />
            </View>
            {!liveOn && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }}>
                {MODES.map(([key, label]) => (
                  <FilterChip key={key} label={label} on={presetKey === key} onPress={() => setPresetKey(key)} />
                ))}
              </ScrollView>
            )}
          </GlassCard>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function Metric({ label, value, sub }) {
  const { t } = useTheme();
  return (
    <GlassCard level={2} style={styles.metric} pad={16}>
      <View style={{ minHeight: 100, justifyContent: 'space-between' }}>
        <Text style={[type.labelMd, { color: t.soft }]}>{label.toUpperCase()}</Text>
        <View>
          <Text style={[type.headlineLg, { color: t.value }]}>{value}</Text>
          {!!sub && <Text style={[type.bodySm, { color: t.soft }]}>{sub}</Text>}
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tree: { position: 'absolute', top: TOP, left: 0, right: 0 },
  intro: { position: 'absolute', left: 0, right: 0, bottom: '12%', alignItems: 'center' },
  header: { position: 'absolute', top: 52, left: 16, right: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  content: { paddingHorizontal: 16, paddingBottom: 48 },
  section: { marginTop: 28, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  metric: { width: '48%', marginBottom: 16 },
  toggleRow: { flexDirection: 'row', alignItems: 'center' },
});