import { corsHeaders, json } from '../_shared/cors.ts';
import { clientFromRequest, requireUser } from '../_shared/supabaseClient.ts';
import { haalIcalVandaag } from '../_shared/ics.ts';

// Verse Google access-token uit de opgeslagen refresh-token.
async function googleAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`Google token-refresh fout: ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

function todayRangeAmsterdam() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const p = fmt.formatToParts(new Date());
  const y = p.find((x) => x.type === 'year')!.value;
  const m = p.find((x) => x.type === 'month')!.value;
  const d = p.find((x) => x.type === 'day')!.value;
  const off = (+m >= 4 && +m <= 9) ? '+02:00' : '+01:00';
  return { start: `${y}-${m}-${d}T00:00:00${off}`, end: `${y}-${m}-${d}T23:59:59${off}` };
}

async function googleAgenda(accessToken: string) {
  const { start, end } = todayRangeAmsterdam();
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('timeMin', new Date(start).toISOString());
  url.searchParams.set('timeMax', new Date(end).toISOString());
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '20');
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Google Calendar fout: ${await res.text()}`);
  const data = await res.json();
  // deno-lint-ignore no-explicit-any
  return (data.items || []).map((e: any) => ({
    id: e.id,
    naam: e.summary || '(geen titel)',
    locatie: e.location || '',
    start: e.start?.dateTime || e.start?.date || '',
    eind: e.end?.dateTime || e.end?.date || '',
    hele_dag: !!e.start?.date,
  }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = clientFromRequest(req);
    const user = await requireUser(supabase);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { data: profile } = await supabase
      .from('profiles')
      .select('google_refresh_token, agenda_ical_url')
      .eq('id', user.id)
      .maybeSingle();

    // Voorkeur: Google Agenda (real-time). Anders een iCal-link. Anders niets.
    if (profile?.google_refresh_token) {
      const token = await googleAccessToken(profile.google_refresh_token);
      const afspraken = await googleAgenda(token);
      return json({ afspraken });
    }
    if (profile?.agenda_ical_url) {
      const afspraken = await haalIcalVandaag(profile.agenda_ical_url, 'afspraak');
      return json({ afspraken });
    }
    return json({ error: 'Geen agenda gekoppeld (log in met Google of zet een iCal-link bij Instellingen)' }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
