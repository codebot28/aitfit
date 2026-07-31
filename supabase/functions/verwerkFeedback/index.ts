import { corsHeaders, json } from '../_shared/cors.ts';
import { clientFromRequest, requireUser } from '../_shared/supabaseClient.ts';
import { invokeLLM } from '../_shared/anthropic.ts';
import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const SAMENVATTING_DREMPEL = 5;

async function verwerkItemOpmerkingen(
  supabase: SupabaseClient,
  feedback: { feedback_tekst?: string; rating?: number },
  items: Array<{ id: string; beschrijving: string; opmerking?: string }>,
) {
  if (!feedback.feedback_tekst || !items.length) return [];

  const itemLijst = items.map((i) => ({ id: i.id, beschrijving: i.beschrijving }));
  const systemPrompt =
    "Je krijgt een lijst kledingstukken (met id en beschrijving) en de feedback van de gebruiker op een outfit. Bepaal of de gebruiker iets zegt over een SPECIFIEK kledingstuk (bijv. 'die trui krast', 'die jeans zit te strak', 'die schoenen zijn perfect voor regen'). Geef alleen item-specifieke observaties terug — geen algemene feedback over de hele outfit. Schrijf elke opmerking als korte, herbruikbare notitie in de tweede persoon (bijv. 'Krast bij warm weer.' of 'Zit comfortabel maar te warm bij meer dan 20°C.'). Als de feedback niets over individuele items zegt, geef een lege lijst terug.";

  const userMessage = `Kledingstukken in deze outfit:\n${itemLijst
    .map((i) => `- id: ${i.id} — ${i.beschrijving}`)
    .join('\n')}\n\nFeedback: ${feedback.feedback_tekst}\nRating: ${feedback.rating ?? '-'}/5`;

  const schema = {
    type: 'object',
    properties: {
      opmerkingen: {
        type: 'array',
        items: {
          type: 'object',
          properties: { kledingstuk_id: { type: 'string' }, opmerking: { type: 'string' } },
          required: ['kledingstuk_id', 'opmerking'],
        },
      },
    },
    required: ['opmerkingen'],
  };

  // deno-lint-ignore no-explicit-any
  const data = await invokeLLM({ prompt: `${systemPrompt}\n\n${userMessage}`, response_json_schema: schema, model: 'claude_sonnet_4_6' }) as any;
  const opmerkingen: Array<{ kledingstuk_id: string; opmerking: string }> = Array.isArray(data?.opmerkingen) ? data.opmerkingen : [];

  const geldigeIds = new Set(items.map((i) => i.id));
  const toegepast: Array<{ kledingstuk_id: string; opmerking: string }> = [];

  for (const o of opmerkingen) {
    if (!geldigeIds.has(o.kledingstuk_id) || !o.opmerking?.trim()) continue;
    const item = items.find((i) => i.id === o.kledingstuk_id)!;
    const huidige = (item.opmerking || '').trim();
    const nieuwe = huidige ? `${huidige}\n• ${o.opmerking.trim()}` : `• ${o.opmerking.trim()}`;
    await supabase.from('kledingstuk').update({ opmerking: nieuwe }).eq('id', o.kledingstuk_id);
    toegepast.push({ kledingstuk_id: o.kledingstuk_id, opmerking: o.opmerking.trim() });
  }
  return toegepast;
}

async function maakLeermoment(
  supabase: SupabaseClient,
  outfit: Record<string, string>,
  feedback: { feedback_tekst?: string; rating?: number },
  items: Array<{ beschrijving: string }>,
) {
  const itemTekst = items.map((i) => i.beschrijving).filter(Boolean).join(', ') || 'onbekend';
  const systemPrompt =
    "Je analyseert de dagbeschrijving, de gekozen outfit en de feedback van de gebruiker. Destilleer hier een concreet, herbruikbaar leermoment uit. Maximaal 2 zinnen. Schrijf in de tweede persoon over de gebruiker (bijv. 'Je verkiest lossere kleding bij sportieve activiteiten.' of 'Op schooldagen geef je de voorkeur aan smart-casual boven volledig casual.'). Geef alleen het leermoment terug, geen uitleg.";

  const userMessage = `Activiteit van die dag: ${outfit.activiteit_beschrijving || '-'}
Gekozen outfit: ${itemTekst}
Weer: ${outfit.weer_context || '-'}
Feedback van de gebruiker: ${feedback.feedback_tekst || '-'}
Beoordeling: ${feedback.rating ?? '-'}/5`;

  const tekst = ((await invokeLLM({ prompt: `${systemPrompt}\n\n${userMessage}`, model: 'claude_sonnet_4_6' })) as string).trim();
  if (!tekst) return null;

  const { data } = await supabase.from('geheugen').insert({
    type: 'leermoment', inhoud: tekst, bron_outfit_id: outfit.id, aangemaakt_op: new Date().toISOString(),
  }).select().single();
  return data;
}

async function werkSamenvattingBij(supabase: SupabaseClient) {
  const { data: leermomenten } = await supabase
    .from('geheugen').select('*').eq('type', 'leermoment').order('aangemaakt_op', { ascending: false });
  if (!leermomenten?.length) return null;

  const { data: samenvattingen } = await supabase
    .from('geheugen').select('*').eq('type', 'profiel_samenvatting').order('aangemaakt_op', { ascending: false });
  const laatste = samenvattingen?.[0];

  let sindsLaatste = leermomenten.length;
  if (laatste) {
    sindsLaatste = leermomenten.filter(
      (l) => new Date(l.aangemaakt_op || l.created_date) > new Date(laatste.aangemaakt_op || laatste.created_date),
    ).length;
  }
  if (sindsLaatste < SAMENVATTING_DREMPEL) return null;

  const systemPrompt =
    'Je maakt een persoonlijk stijlprofiel op basis van een reeks leermomenten. Schrijf een beknopte samenvatting in de tweede persoon van maximaal 150 woorden. Dek deze onderwerpen af als er data voor is: algemene stijlvoorkeur, voorkeuren per situatie (werk/vrije tijd/school/sport), temperatuur- en seizoensvoorkeuren, kledingstukken of combinaties die je niet bevallen, en vaste patronen in je dagindeling. Geef alleen de samenvatting terug.';
  const lijst = leermomenten.map((l, i) => `${i + 1}. ${l.inhoud}`).join('\n');

  const tekst = ((await invokeLLM({ prompt: `${systemPrompt}\n\nLeermomenten:\n${lijst}`, model: 'claude_sonnet_4_6' })) as string).trim();
  if (!tekst) return null;

  for (const s of samenvattingen ?? []) await supabase.from('geheugen').delete().eq('id', s.id);

  const { data } = await supabase.from('geheugen').insert({
    type: 'profiel_samenvatting', inhoud: tekst, aangemaakt_op: new Date().toISOString(),
  }).select().single();
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = clientFromRequest(req);
    const user = await requireUser(supabase);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { outfit_id, feedback_tekst, rating } = await req.json();
    if (!outfit_id) return json({ error: 'outfit_id verplicht' }, 400);

    const { data: outfitArr } = await supabase.from('outfit').select('*').eq('id', outfit_id);
    const outfit = outfitArr?.[0];
    if (!outfit) return json({ error: 'Outfit niet gevonden' }, 404);

    const ids = (outfit.kledingstuk_ids || '').split(',').filter(Boolean);
    const items: Array<{ id: string; beschrijving: string; opmerking?: string }> = [];
    for (const id of ids) {
      const { data: arr } = await supabase.from('kledingstuk').select('*').eq('id', id);
      if (arr?.[0]) items.push(arr[0]);
    }

    const itemOpmerkingen = await verwerkItemOpmerkingen(supabase, { feedback_tekst, rating }, items);
    const leermoment = await maakLeermoment(supabase, outfit, { feedback_tekst, rating }, items);
    const samenvatting = await werkSamenvattingBij(supabase);

    return json({ leermoment, samenvatting, itemOpmerkingen });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
