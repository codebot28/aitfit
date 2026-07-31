import { corsHeaders, json } from '../_shared/cors.ts';
import { clientFromRequest, requireUser } from '../_shared/supabaseClient.ts';

const DEFAULT = { lat: 52.3167, lon: 4.8667, label: 'Amstelveen' };

// WMO-weercode -> Nederlandse omschrijving + OpenWeatherMap-icooncode
// (zodat de bestaande weerkaart de iconen ongewijzigd kan blijven tonen).
const WMO: Record<number, { tekst: string; icon: string }> = {
  0: { tekst: 'helder', icon: '01d' },
  1: { tekst: 'overwegend helder', icon: '02d' },
  2: { tekst: 'half bewolkt', icon: '03d' },
  3: { tekst: 'bewolkt', icon: '04d' },
  45: { tekst: 'mist', icon: '50d' },
  48: { tekst: 'mist', icon: '50d' },
  51: { tekst: 'lichte motregen', icon: '09d' },
  53: { tekst: 'motregen', icon: '09d' },
  55: { tekst: 'dichte motregen', icon: '09d' },
  56: { tekst: 'ijzel', icon: '09d' },
  57: { tekst: 'ijzel', icon: '09d' },
  61: { tekst: 'lichte regen', icon: '10d' },
  63: { tekst: 'regen', icon: '10d' },
  65: { tekst: 'zware regen', icon: '10d' },
  66: { tekst: 'ijzel', icon: '13d' },
  67: { tekst: 'ijzel', icon: '13d' },
  71: { tekst: 'lichte sneeuw', icon: '13d' },
  73: { tekst: 'sneeuw', icon: '13d' },
  75: { tekst: 'zware sneeuw', icon: '13d' },
  77: { tekst: 'sneeuwkorrels', icon: '13d' },
  80: { tekst: 'lichte buien', icon: '09d' },
  81: { tekst: 'buien', icon: '09d' },
  82: { tekst: 'zware buien', icon: '09d' },
  85: { tekst: 'sneeuwbuien', icon: '13d' },
  86: { tekst: 'sneeuwbuien', icon: '13d' },
  95: { tekst: 'onweer', icon: '11d' },
  96: { tekst: 'onweer met hagel', icon: '11d' },
  99: { tekst: 'onweer met hagel', icon: '11d' },
};
const wmo = (code: number) => WMO[code] ?? { tekst: 'wisselend', icon: '03d' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = clientFromRequest(req);
    const user = await requireUser(supabase);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    let lat: number, lon: number, locatie: string;

    if (typeof body.lat === 'number' && typeof body.lon === 'number') {
      lat = body.lat; lon = body.lon; locatie = 'Huidige locatie';
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('locatie_lat, locatie_lon, locatie_label')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.locatie_lat != null && profile?.locatie_lon != null) {
        lat = profile.locatie_lat; lon = profile.locatie_lon; locatie = profile.locatie_label || DEFAULT.label;
      } else {
        lat = DEFAULT.lat; lon = DEFAULT.lon; locatie = DEFAULT.label;
      }
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m` +
      `&timezone=Europe%2FAmsterdam&forecast_days=1`;
    const res = await fetch(url);
    if (!res.ok) return json({ error: `Open-Meteo fout: ${res.status}` }, 502);
    const data = await res.json();
    const h = data.hourly;
    if (!h?.time?.length) return json({ error: 'Geen weerdata' }, 502);

    const temps: number[] = h.temperature_2m ?? [];
    const pops: number[] = h.precipitation_probability ?? [];
    const codes: number[] = h.weather_code ?? [];
    const winds: number[] = h.wind_speed_10m ?? [];

    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const avgTemp = temps.reduce((s, t) => s + t, 0) / temps.length;
    const maxPop = pops.length ? Math.max(...pops) : 0;
    const avgWind = winds.length ? winds.reduce((s, w) => s + w, 0) / winds.length : 0;

    // Dominante omschrijving overdag (07:00 - 20:00).
    const dayIdx = h.time
      .map((t: string, i: number) => ({ hr: +t.slice(11, 13), i }))
      .filter((x: { hr: number }) => x.hr >= 7 && x.hr <= 20)
      .map((x: { i: number }) => x.i);
    const counts: Record<number, number> = {};
    (dayIdx.length ? dayIdx : temps.map((_, i) => i)).forEach((i: number) => {
      counts[codes[i]] = (counts[codes[i]] || 0) + 1;
    });
    const domCode = +(Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 3);
    const dom = wmo(domCode);

    const tijdlijn = [6, 9, 12, 15, 18, 21]
      .map((hr) => {
        const i = h.time.findIndex((t: string) => +t.slice(11, 13) === hr);
        if (i < 0) return null;
        return {
          tijd: `${String(hr).padStart(2, '0')}:00`,
          temp: Math.round(temps[i]),
          omschrijving: wmo(codes[i]).tekst,
          neerslag_kans: Math.round(pops[i] ?? 0),
        };
      })
      .filter(Boolean) as { tijd: string; temp: number; omschrijving: string; neerslag_kans: number }[];

    const weer: Record<string, unknown> = {
      temperatuur: Math.round(avgTemp),
      min_temp: Math.round(minTemp),
      max_temp: Math.round(maxTemp),
      neerslag_kans: Math.round(maxPop),
      wind_kmh: Math.round(avgWind),
      omschrijving: dom.tekst,
      icon: dom.icon,
      tijdlijn,
      locatie,
    };
    weer.tekst =
      `${dom.tekst}, ${Math.round(minTemp)}°C tot ${Math.round(maxTemp)}°C (gem ${Math.round(avgTemp)}°C), ` +
      `max ${Math.round(maxPop)}% kans op neerslag, wind ${Math.round(avgWind)} km/u. ` +
      `Verloop: ${tijdlijn.map((t) => `${t.tijd} ${t.temp}°C ${t.omschrijving} (${t.neerslag_kans}%)`).join('; ')}`;

    return json({ weer });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
