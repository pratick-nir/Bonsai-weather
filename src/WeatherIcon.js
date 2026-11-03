import React, { useRef } from 'react';
import Svg, { Path, Circle, G, Mask, Rect } from 'react-native-svg';
import { useTheme } from './theme';

// Icon shapes drawn in a 24 x 24 box
const CLOUD = 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z';
const MOON = 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z';

// Sun with a wavy (scalloped) edge: radius = R * (1 + 0.075 * cos(12 * angle))
function sunPath(cx, cy, R) {
  let d = '';
  for (let i = 0; i <= 120; i++) {
    const a = (i / 120) * Math.PI * 2;
    const r = R * (1 + 0.075 * Math.cos(12 * a));
    d += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2);
  }
  return d + 'Z';
}

let counter = 0;

// condition: clear | partly | cloudy | rain | storm | snow | fog     night: true shows the moon instead of the sun
export default function WeatherIcon({ condition, night = false, size = 28 }) {
  const { t } = useTheme();
  const id = useRef('cm' + counter++).current;
  const c = t.icon;
  const outline = { fill: 'none', stroke: c.cloud, strokeWidth: 1.8, strokeLinejoin: 'round' };
  const box = { width: size, height: size, viewBox: '0 0 24 24' };

  if (condition === 'clear') {
    return (
      <Svg {...box}>
        {night ? <Path d={MOON} fill={c.moon} /> : <Path d={sunPath(12, 12, 8.5)} fill={c.sun} />}
      </Svg>
    );
  }

  if (condition === 'cloudy') {
    return (
      <Svg {...box}>
        <Path d={CLOUD} {...outline} />
      </Svg>
    );
  }

  if (condition === 'partly') {
    // the sun or moon is cut away where the cloud sits in front of it
    return (
      <Svg {...box}>
        <Mask id={id}>
          <Rect x="0" y="0" width="24" height="24" fill="white" />
          <Path d={CLOUD} transform="translate(3 4) scale(0.85)" fill="black" stroke="black" strokeWidth={4} />
        </Mask>
        <G mask={'url(#' + id + ')'}>
          {night ? (
            <G transform="translate(-1 -1) scale(0.72)"><Path d={MOON} fill={c.moon} /></G>
          ) : (
            <Path d={sunPath(9, 9, 6.3)} fill={c.sun} />
          )}
        </G>
        <Path d={CLOUD} transform="translate(3 4) scale(0.85)" {...outline} strokeWidth={2} />
      </Svg>
    );
  }

  // rain, storm, snow, fog: cloud on top with a detail underneath
  return (
    <Svg {...box}>
      <Path d={CLOUD} transform="translate(2.2 -1.5) scale(0.85)" {...outline} strokeWidth={2} />
      {condition === 'rain' && (
        <Path d="M8 17.5v3M12 18.5v3M16 17.5v3" stroke={c.rain} strokeWidth={1.8} strokeLinecap="round" />
      )}
      {condition === 'storm' && (
        <Path d="M12.5 14l-3 4.5h3.5l-2 4" fill="none" stroke={c.bolt} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {condition === 'snow' && (
        <G fill={c.snow}>
          <Circle cx="8" cy="19" r="1.2" />
          <Circle cx="12" cy="20.5" r="1.2" />
          <Circle cx="16" cy="19" r="1.2" />
        </G>
      )}
      {condition === 'fog' && (
        <Path d="M6 18.5h12M8 21.5h8" stroke={c.cloud} strokeWidth={1.8} strokeLinecap="round" />
      )}
    </Svg>
  );
}