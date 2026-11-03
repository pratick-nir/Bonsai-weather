import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { colors, type, useTheme } from './theme';

// Dotted amber sun path from sunrise to sunset, with a layered golden halo around the sun.
// Props: sunrise/sunset (text), srMin/ssMin (minutes of the day), min (minute shown, moves with the slider)
export default function SolarArc({ sunrise, sunset, srMin, ssMin, min }) {
  const { t } = useTheme();
  const [w, setW] = useState(300);
  const H = 120, padX = 16, base = H - 14, peak = 78;
  const x0 = padX, x1 = w - padX, cx = w / 2, cy = base - 2 * peak;

  const raw = (min - srMin) / (ssMin - srMin);
  const up = raw >= 0 && raw <= 1;           // sun above the horizon?
  const k = Math.min(1, Math.max(0, raw));
  const sx = (1 - k) * (1 - k) * x0 + 2 * (1 - k) * k * cx + k * k * x1;
  const sy = (1 - k) * (1 - k) * base + 2 * (1 - k) * k * cy + k * k * base;

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <Svg width={w} height={H}>
        <Line x1={0} y1={base} x2={w} y2={base} stroke={t.arcLine} strokeWidth={1} />
        <Path
          d={'M ' + x0 + ' ' + base + ' Q ' + cx + ' ' + cy + ' ' + x1 + ' ' + base}
          stroke={t.accent} strokeWidth={2} strokeDasharray="2 7" strokeLinecap="round" fill="none"
        />
        <Circle cx={sx} cy={sy} r={24} fill={colors.primary} opacity={up ? 0.14 : 0.04} />
        <Circle cx={sx} cy={sy} r={16} fill={colors.primary} opacity={up ? 0.28 : 0.08} />
        <Circle cx={sx} cy={sy} r={9} fill={colors.apricot} opacity={up ? 1 : 0.4} />
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <Text style={[type.labelSm, { color: t.soft }]}>Sunrise</Text>
          <Text style={[type.headlineSm, { color: t.text }]}>{sunrise}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[type.labelSm, { color: t.soft }]}>Sunset</Text>
          <Text style={[type.headlineSm, { color: t.text }]}>{sunset}</Text>
        </View>
      </View>
    </View>
  );
}