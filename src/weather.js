import * as Location from 'expo-location';

// Used only if the user denies location permission. Change it to your own city.
const FALLBACK = { latitude: 51.5072, longitude: -0.1276, label: 'London' };

/* ---------- small helpers ---------- */
const toMin = (iso) => Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16)); // 'YYYY-MM-DDTHH:MM' -> minutes
export const fmt = (min) => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
};
const dur = (min) => (min >= 60 ? Math.floor(min / 60) + 'h ' + (min % 60) + 'm' : min + 'm');

// Light mood for a minute of the day: golden = 60 min before sunset to 30 min after, and 30 min before to 60 min after sunrise
export function moodAt(min, sr, ss) {
  if (min < sr - 30 || min > ss + 30) return 'night';
  if ((min >= sr - 30 && min <= sr + 60) || (min >= ss - 60 && min <= ss + 30)) return 'golden';
  return 'day';
}
export function phaseLabel(min, sr, ss) {
  const m = moodAt(min, sr, ss);
  if (m === 'golden') return 'Golden hour';
  if (m === 'night') return (min > ss + 30 && min <= ss + 90) || (min >= sr - 90 && min < sr - 30) ? 'Blue hour' : 'Night';
  return 'Daylight';
}

// Open-Meteo weather codes -> conditions the tree understands
function codeToCondition(code) {
  if (code >= 95) return 'storm';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code === 45 || code === 48) return 'fog';
  if (code === 1 || code === 2) return 'partly';
  if (code === 3) return 'cloudy';
  return 'clear';
}

/* ---------- location ---------- */
export async function locateMe() {
  let place = FALLBACK;
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      place = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, label: 'Your location' };
      try {
        const [g] = await Location.reverseGeocodeAsync(pos.coords);
        if (g && (g.city || g.region)) place.label = g.city || g.region;
      } catch (e) {}
    }
  } catch (e) {}
  return place;
}

// City name -> coordinates, using the Open-Meteo geocoding API
export async function searchPlace(query) {
  const url = 'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(query) + '&count=1&language=en';
  const j = await (await fetch(url)).json();
  if (!j.results || !j.results.length) throw new Error('Place not found');
  const r = j.results[0];
  return { latitude: r.latitude, longitude: r.longitude, label: r.name };
}

/* ---------- live weather ---------- */
export async function fetchWeather(place) {
  const url =
    'https://api.open-meteo.com/v1/forecast?latitude=' + place.latitude + '&longitude=' + place.longitude +
    '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m' +
    '&hourly=temperature_2m,weather_code,wind_speed_10m,precipitation_probability' +
    '&daily=sunrise,sunset,uv_index_max,temperature_2m_max,temperature_2m_min' +
    '&timezone=auto&forecast_days=2';
  const j = await (await fetch(url)).json();

  const nowIso = j.current.time;              // local time at the place
  const nowMin = toMin(nowIso);
  const di = Math.max(0, j.daily.time.indexOf(nowIso.slice(0, 10)));
  const sr = toMin(j.daily.sunrise[di]);
  const ss = toMin(j.daily.sunset[di]);

  let start = j.hourly.time.findIndex((t) => t >= nowIso.slice(0, 13) + ':00');
  if (start < 0) start = 0;
  const hourly = [];
  for (let i = start; i < start + 24 && i < j.hourly.time.length; i++) {
    const t = j.hourly.time[i];
    const min = toMin(t);
    const d = j.daily.time.indexOf(t.slice(0, 10));
    const k = d < 0 ? di : d;
    hourly.push({
      label: i === start ? 'Now' : fmt(min), min,
      temp: j.hourly.temperature_2m[i],
      condition: codeToCondition(j.hourly.weather_code[i]),
      wind: j.hourly.wind_speed_10m[i],
      pop: j.hourly.precipitation_probability ? j.hourly.precipitation_probability[i] : null,
      mood: moodAt(min, toMin(j.daily.sunrise[k]), toMin(j.daily.sunset[k])),
    });
  }
  // first entry = live current values
  hourly[0] = { ...hourly[0], temp: j.current.temperature_2m, wind: j.current.wind_speed_10m,
    condition: codeToCondition(j.current.weather_code), mood: moodAt(nowMin, sr, ss) };

  let goldenText;
  if (nowMin < ss - 60) goldenText = 'Starts in ' + dur(ss - 60 - nowMin);
  else if (nowMin <= ss) goldenText = 'Happening now, ends in ' + dur(ss - nowMin);
  else goldenText = 'Next one tomorrow';

  return {
    label: place.label,
    condition: codeToCondition(j.current.weather_code),
    temp: j.current.temperature_2m, feels: j.current.apparent_temperature,
    wind: j.current.wind_speed_10m, humidity: j.current.relative_humidity_2m,
    uv: Math.round(j.daily.uv_index_max[di]),
    hi: j.daily.temperature_2m_max[di], lo: j.daily.temperature_2m_min[di],
    sunrise: fmt(sr), sunset: fmt(ss), srMin: sr, ssMin: ss, nowMin,
    mood: moodAt(nowMin, sr, ss), hourly,
    goldenStart: fmt(ss - 60), goldenEnd: fmt(ss), goldenText,
  };
}

/* ---------- simulation presets (test every tree reaction without waiting for weather) ---------- */
const SR = 370, SS = 1110; // 06:10 and 18:30
const DEFS = {
  clear:  { condition: 'clear',  temp: 24, wind: 8,  humidity: 50, uv: 7,  now: 780 },
  partly: { condition: 'partly', temp: 21, wind: 12, humidity: 60, uv: 4,  now: 780 },
  golden: { condition: 'clear',  temp: 22, wind: 10, humidity: 55, uv: 2,  now: 1070 },
  cloudy: { condition: 'cloudy', temp: 19, wind: 14, humidity: 70, uv: 3,  now: 780 },
  rain:   { condition: 'rain',   temp: 16, wind: 16, humidity: 88, uv: 1,  now: 780 },
  storm:  { condition: 'storm',  temp: 18, wind: 38, humidity: 92, uv: 1,  now: 780 },
  snow:   { condition: 'snow',   temp: -3, wind: 9,  humidity: 80, uv: 1,  now: 780 },
  windy:  { condition: 'clear',  temp: 21, wind: 45, humidity: 45, uv: 6,  now: 780 },
  hot:    { condition: 'clear',  temp: 39, wind: 6,  humidity: 30, uv: 10, now: 840 },
  night:  { condition: 'clear',  temp: 15, wind: 6,  humidity: 65, uv: 0,  now: 1320 },
};
export const MODES = [
  ['clear', 'Clear'], ['partly', 'Partly'], ['golden', 'Golden'], ['cloudy', 'Cloudy'], ['rain', 'Rain'], ['storm', 'Storm'],
  ['snow', 'Snow'], ['windy', 'Windy'], ['hot', 'Hot'], ['night', 'Night'],
];

const POP = { clear: 5, partly: 10, golden: 10, cloudy: 15, rain: 80, storm: 90, snow: 70, windy: 5, hot: 0, night: 5 };

export function getPreset(key) {
  const o = DEFS[key];
  const hourly = [];
  for (let i = 0; i < 24; i++) {
    const m = (o.now + i * 60) % 1440;
    hourly.push({
      label: i === 0 ? 'Now' : fmt(m), min: m,
      temp: i === 0 ? o.temp : Math.round((o.temp + 3 * Math.sin(((m - 540) / 1440) * 2 * Math.PI)) * 10) / 10,
      condition: o.condition, wind: o.wind, pop: POP[key], mood: moodAt(m, SR, SS),
    });
  }
  const nowMin = o.now;
  return {
    label: 'Simulation', condition: o.condition, temp: o.temp, feels: o.temp - 1, wind: o.wind,
    humidity: o.humidity, uv: o.uv, hi: o.temp + 3, lo: o.temp - 5,
    sunrise: fmt(SR), sunset: fmt(SS), srMin: SR, ssMin: SS, nowMin,
    mood: moodAt(nowMin, SR, SS), hourly,
    goldenStart: fmt(SS - 60), goldenEnd: fmt(SS),
    goldenText: nowMin < SS - 60 ? 'Starts in ' + dur(SS - 60 - nowMin)
      : nowMin <= SS ? 'Happening now, ends in ' + dur(SS - nowMin) : 'Next one tomorrow',
  };
}

export const CONDITION_LABEL = {
  clear: 'Clear sky', partly: 'Partly cloudy', cloudy: 'Cloudy', fog: 'Foggy', rain: 'Rain', storm: 'Thunderstorm', snow: 'Snow',
};