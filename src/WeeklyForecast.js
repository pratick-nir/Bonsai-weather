import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GlassCard from './GlassCard';
import WeatherIcon from './WeatherIcon';
import { type, useTheme } from './theme';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDayLabel(dateStr, index) {
  if (index === 0) return 'Today';
  const d = new Date(dateStr + 'T12:00:00');
  return DAY_NAMES[d.getDay()];
}

export default function WeeklyForecast({ days }) {
  const { t } = useTheme();
  if (!days || days.length === 0) return null;

  const hiMax = Math.max(...days.map((d) => d.hi));
  const loMin = Math.min(...days.map((d) => d.lo));
  const range = hiMax - loMin || 1;

  return (
    <GlassCard level="1" pad={0}>
      {days.map((day, i) => {
        // Normalised bar: position and width within the full week temp range
        const barLeft = (day.lo - loMin) / range;
        const barWidth = (day.hi - day.lo) / range;

        return (
          <View
            key={day.date}
            style={[
              styles.row,
              i < days.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.glass[1].border },
            ]}
          >
            {/* Day label */}
            <Text style={[type.labelLg, styles.dayLabel, { color: i === 0 ? t.accentText : t.text }]}>
              {getDayLabel(day.date, i)}
            </Text>

            {/* Weather icon */}
            <WeatherIcon condition={day.condition} night={false} size={22} />

            {/* Precip probability */}
            {day.pop != null && day.pop > 10 ? (
              <Text style={[type.bodySm, styles.pop, { color: t.pop }]}>{day.pop}%</Text>
            ) : (
              <View style={styles.pop} />
            )}

            {/* Temp range bar */}
            <View style={styles.barContainer}>
              <View style={[styles.barTrack, { backgroundColor: t.rail.bg }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      left: barLeft * 100 + '%',
                      width: Math.max(barWidth * 100, 4) + '%',
                      backgroundColor: t.accent,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Lo temp */}
            <Text style={[type.labelLg, styles.tempLo, { color: t.mute }]}>
              {Math.round(day.lo)}°
            </Text>

            {/* Hi temp */}
            <Text style={[type.labelLg, styles.tempHi, { color: t.text }]}>
              {Math.round(day.hi)}°
            </Text>
          </View>
        );
      })}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  dayLabel: { width: 44 },
  pop: { width: 36, textAlign: 'right', marginLeft: 8 },
  barContainer: { flex: 1, marginHorizontal: 10 },
  barTrack: { height: 5, borderRadius: 99, overflow: 'hidden', position: 'relative' },
  barFill: { position: 'absolute', top: 0, bottom: 0, borderRadius: 99 },
  tempLo: { width: 36, textAlign: 'right' },
  tempHi: { width: 36, textAlign: 'right', marginLeft: 6 },
});
