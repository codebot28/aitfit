import { corsHeaders, json } from '../_shared/cors.ts';
import { clientFromRequest, requireUser } from '../_shared/supabaseClient.ts';
import { invokeLLM } from '../_shared/anthropic.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = clientFromRequest(req);
    const user = await requireUser(supabase);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { datum, activiteit, weer, afspraken, lessen } = await req.json();
    if (!datum || !activiteit) return json({ error: 'datum en activiteit zijn verplicht' }, 400);

    const { data: kledingstukken } = await supabase.from('kledingstuk').select('*');
    if (!kledingstukken?.length) return json({ error: 'Geen kledingstukken in de kast' }, 400);

    // Laatste 10 feedbacks + bijbehorende outfit-context.
    const { data: feedbacks } = await supabase
      .from('feedback').select('*').order('aangemaakt_op', { ascending: false }).limit(10);
    const feedbackContext: Array<Record<string, unknown>> = [];
    for (const fb of feedbacks ?? []) {
      if (!fb.outfit_id) continue;
      const { data: ofitArr } = await supabase.from('outfit').select('*').eq('id', fb.outfit_id);
      const ofit = ofitArr?.[0];
      if (!ofit) continue;
      const ids = (ofit.kledingstuk_ids || '').split(',').filter(Boolean);
      const beschrijvingen = ids
        .map((id: string) => kledingstukken.find((k) => k.id === id)?.beschrijving)
        .filter(Boolean);
      feedbackContext.push({
        datum: ofit.datum, activiteit: ofit.activiteit_beschrijving, weer: ofit.weer_context,
        items: beschrijvingen, feedback: fb.feedback_tekst, rating: fb.rating,
      });
    }

    const lijst = kledingstukken.map((k) => {
      let profiel: unknown = {};
      try { profiel = k.profiel ? JSON.parse(k.profiel) : {}; } catch { profiel = {}; }
      return {
        id: k.id, code: k.code || '', beschrijving: k.beschrijving, profiel,
        ...(k.opmerking ? { opmerking: k.opmerking } : {}),
      };
    });

    const systemPrompt =
      'Jij bent een persoonlijke stylist. Je krijgt een lijst kledingstukken (elk met een unieke id, een korte code zoals BZK1, een beschrijving, profiel en soms een persoonlijke opmerking van de gebruiker over dat specifieke item). Gebruik de codes in je redenering zodat de gebruiker precies weet welk item je bedoelt (bv. "de BZK1 met de SWL2"). Houd nadrukkelijk rekening met die opmerkingen — als er staat dat een item krast, te warm is of niet lekker zit, vermijd het in die omstandigheden. Kies een complete outfit (bovenkleding, onderkleding, schoeisel, en optioneel een jas/accessoire). Houd rekening met het weer: kies geen dikke jas bij 25 graden, en kies waterbestendig schoeisel bij regen boven 40% kans. Als er formele afspraken in de agenda staan (vergadering, presentatie, sollicitatie) kies dan een smart-casual of formelere outfit. Bij sportafspraken kies sportkleding. Bij vrije tijd kies casual. Leer van de eerdere feedback. Als de gebruiker een combinatie niet mooi vond, vermijd die combinatie. Als de gebruiker aangeeft dat iets te warm of te koud was, houd daar rekening mee bij vergelijkbaar weer. Het stijlprofiel en de leermomenten zijn opgebouwd uit eerdere feedback van de gebruiker. Gebruik deze informatie actief bij je keuze. BELANGRIJK: geef je antwoord als JSON met deze velden: gekozen_ids (array van de id-strings van de gekozen kledingstukken, EXACT zoals ze in de lijst staan), items (array van bijbehorende beschrijvingen), redenering (2-3 zinnen waarom deze combinatie), tips (eventuele stijltip). Kies alleen uit de aangeleverde lijst — verzin nooit nieuwe items.';

    const weerRegel = weer
      ? `\nWeer vandaag: ${weer.omschrijving}, temperatuur van ${weer.min_temp ?? weer.temperatuur}°C tot ${weer.max_temp ?? weer.temperatuur}°C (gemiddeld ${weer.temperatuur}°C), max neerslagkans ${weer.neerslag_kans}%, wind ${weer.wind_kmh} km/u.${
          Array.isArray(weer.tijdlijn) && weer.tijdlijn.length
            ? ` Verloop door de dag: ${weer.tijdlijn.map((t: { tijd: string; temp: number; omschrijving: string; neerslag_kans: number }) => `${t.tijd} ${t.temp}°C ${t.omschrijving} (${t.neerslag_kans}% neerslag)`).join('; ')}.`
            : ''
        } Houd rekening met het verschil tussen ochtend en middag — als het 's ochtends koel is en 's middags warm, kies dan laagjes die uitgedaan kunnen worden.`
      : '';

    const fmtTijd = (start: string, hele_dag: boolean) =>
      hele_dag ? 'hele dag' : new Date(start).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });

    const agendaTekst = (afspraken && afspraken.length)
      ? afspraken.map((a: { start: string; hele_dag: boolean; naam: string; locatie?: string }) =>
          `${fmtTijd(a.start, a.hele_dag)} – ${a.naam}${a.locatie ? ` (locatie: ${a.locatie})` : ''}`).join('; ')
      : 'geen afspraken';

    const roosterTekst = (lessen && lessen.length)
      ? lessen.map((l: { start: string; hele_dag: boolean; naam: string; locatie?: string }) =>
          `${fmtTijd(l.start, l.hele_dag)} – ${l.naam}${l.locatie ? ` (locatie: ${l.locatie})` : ''}`).join('; ')
      : 'geen lessen';

    const { data: profile } = await supabase.from('profiles').select('over_mij').eq('id', user.id).maybeSingle();
    const overMij = (profile?.over_mij || '').trim();
    const overMijBlok = overMij ? `\nOver de gebruiker (zelf opgegeven):\n${overMij}` : '';

    const { data: samenvattingen } = await supabase
      .from('geheugen').select('*').eq('type', 'profiel_samenvatting').order('aangemaakt_op', { ascending: false }).limit(1);
    const { data: leermomenten } = await supabase
      .from('geheugen').select('*').eq('type', 'leermoment').order('aangemaakt_op', { ascending: false }).limit(15);

    const geheugenBlok =
      (samenvattingen?.[0] || leermomenten?.length)
        ? `\nPersoonlijk stijlprofiel van de gebruiker:\n${
            samenvattingen?.[0]?.inhoud || '(nog geen samenvatting beschikbaar)'
          }\n\nRecente leermomenten (laatste 15):\n${
            leermomenten?.length ? leermomenten.map((l, i) => `${i + 1}. ${l.inhoud}`).join('\n') : '(nog geen leermomenten)'
          }`
        : '';

    const feedbackBlok = feedbackContext.length
      ? '\nEerdere feedback van de gebruiker:\n' +
        feedbackContext.map((f) =>
          `- ${f.datum} – ${f.activiteit || '(geen activiteit)'} – items: ${
            (f.items as string[]).join(', ') || 'onbekend'
          } – feedback: "${f.feedback || '-'}" – rating: ${f.rating ?? '-'}/5`).join('\n')
      : '';

    const userMessage = `Datum: ${datum}${weerRegel}
Agenda vandaag: ${agendaTekst}
Rooster vandaag: ${roosterTekst}
Activiteit: ${activiteit}${overMijBlok}${feedbackBlok}${geheugenBlok}
Beschikbare kledingstukken: ${JSON.stringify(lijst)}`;

    const schema = {
      type: 'object',
      properties: {
        gekozen_ids: { type: 'array', items: { type: 'string' } },
        items: { type: 'array', items: { type: 'string' } },
        redenering: { type: 'string' },
        tips: { type: 'string' },
      },
      required: ['gekozen_ids', 'items', 'redenering'],
    };

    // deno-lint-ignore no-explicit-any
    const result = await invokeLLM({ prompt: `${systemPrompt}\n\n${userMessage}`, response_json_schema: schema, model: 'claude_sonnet_4_6' }) as any;

    const geldigeIds = new Set(kledingstukken.map((k) => k.id));
    let gekozenIds: string[] = (result.gekozen_ids || []).filter((id: string) => geldigeIds.has(id));

    // Fallback: match op beschrijving als de IDs ontbreken/niet kloppen.
    if (!gekozenIds.length && Array.isArray(result.items)) {
      gekozenIds = result.items
        .map((beschrijving: string) => {
          const zoek = beschrijving.toLowerCase().trim();
          const exact = kledingstukken.find((k) => k.beschrijving?.toLowerCase().trim() === zoek);
          if (exact) return exact.id;
          const fuzzy = kledingstukken.find((k) =>
            k.beschrijving && (zoek.includes(k.beschrijving.toLowerCase()) || k.beschrijving.toLowerCase().includes(zoek)));
          return fuzzy?.id;
        })
        .filter(Boolean);
    }

    const { data: outfit, error: outfitError } = await supabase.from('outfit').insert({
      datum,
      kledingstuk_ids: gekozenIds.join(','),
      activiteit_beschrijving: activiteit,
      weer_context: weer?.tekst || '',
      agenda_context: agendaTekst,
      ai_redenering: result.redenering || '',
      aangemaakt_op: new Date().toISOString(),
    }).select().single();
    if (outfitError) throw outfitError;

    return json({ outfit, result, gekozenIds });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
