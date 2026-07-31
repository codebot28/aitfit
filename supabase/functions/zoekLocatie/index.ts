import { corsHeaders, json } from '../_shared/cors.ts';
import { clientFromRequest, requireUser } from '../_shared/supabaseClient.ts';

// Plaatsnaam -> coördinaten via de gratis Open-Meteo geocoder (geen key nodig).
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = clientFromRequest(req);
    const user = await requireUser(supabase);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const q = (body.q || '').trim();
    if (!q) return json({ error: 'Geen zoekterm' }, 400);

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=nl&format=json`;
    const res = await fetch(url);
    if (!res.ok) return json({ error: `Geocoder fout: ${res.status}` }, 502);
    const data = await res.json();

    const resultaten = (data.results || []).map((r: {
      name: string; admin1?: string; country?: string; latitude: number; longitude: number;
    }) => ({
      label: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
      lat: r.latitude,
      lon: r.longitude,
    }));

    return json({ resultaten });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
