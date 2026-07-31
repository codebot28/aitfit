import { corsHeaders, json } from '../_shared/cors.ts';
import { clientFromRequest, requireUser } from '../_shared/supabaseClient.ts';
import { invokeLLM } from '../_shared/anthropic.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = clientFromRequest(req);
    const user = await requireUser(supabase);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { foto_url } = await req.json();
    if (!foto_url) return json({ error: 'foto_url is verplicht' }, 400);

    const prompt =
      'Analyseer dit kledingstuk. Geef JSON terug met deze velden:\n' +
      '- beschrijving: maximaal 6 woorden, alleen kleur/type/patroon (bv. "donkergroene polo met korte mouwen"). Geen merk of model.\n' +
      '- type: één van: broek, shirt, overkleding, jas, schoen, riem, accessoire. (shirt = licht bovenstuk zoals t-shirt, polo, blouse, hemd; overkleding = dikkere bovenlaag zoals trui, vest, hoodie, sweater, colbert, blazer, gilet — maar GEEN jas/winterjas)\n' +
      '- hoofdkleur: één van: zwart, wit, grijs, bruin, blauw, rood, groen, geel, oranje, roze, paars, beige. Negeer "donker" of "licht" — bv. "donkerblauw" → "blauw", "lichtbruin" → "bruin". Kies de meest dominante kleur.\n' +
      '- lengte: alleen invullen voor broek of shirt. "kort" = korte broek/shorts of korte mouwen. "lang" = lange broek of lange mouwen. Voor andere types: null.';

    const schema = {
      type: 'object',
      properties: {
        beschrijving: { type: 'string' },
        type: { type: 'string', enum: ['broek', 'shirt', 'overkleding', 'jas', 'schoen', 'riem', 'accessoire'] },
        hoofdkleur: { type: 'string' },
        lengte: { type: ['string', 'null'], enum: ['kort', 'lang', null] },
      },
      required: ['beschrijving', 'type', 'hoofdkleur'],
    };

    // deno-lint-ignore no-explicit-any
    const data = await invokeLLM({ prompt, file_urls: [foto_url], response_json_schema: schema, model: 'claude_sonnet_4_6' }) as any;

    return json({
      beschrijving: (data.beschrijving || '').trim().replace(/^["']|["']$/g, ''),
      type: data.type || '',
      hoofdkleur: data.hoofdkleur || '',
      lengte: data.lengte || null,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
