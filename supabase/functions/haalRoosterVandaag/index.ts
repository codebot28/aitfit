import { corsHeaders, json } from '../_shared/cors.ts';
import { clientFromRequest, requireUser } from '../_shared/supabaseClient.ts';
import { haalIcalVandaag } from '../_shared/ics.ts';

// Leest het lesrooster van vandaag uit de iCal-link van de gebruiker (bijv. HvA).
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = clientFromRequest(req);
    const user = await requireUser(supabase);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { data: profile } = await supabase
      .from('profiles')
      .select('rooster_ical_url')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.rooster_ical_url) {
      return json({ error: 'Geen rooster-link ingesteld (zet je iCal-link bij Instellingen)' }, 400);
    }

    const lessen = (await haalIcalVandaag(profile.rooster_ical_url, 'rooster'))
      .filter((l) => !/op pad/i.test(l.naam));
    return json({ lessen });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
