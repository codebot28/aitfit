import { corsHeaders, json } from '../_shared/cors.ts';
import { clientFromRequest, requireUser } from '../_shared/supabaseClient.ts';
import { invokeLLM } from '../_shared/anthropic.ts';

const TYPE_PREFIX: Record<string, string> = {
  broek: 'B', shirt: 'S', jas: 'J', schoen: 'SC', overkleding: 'OV', riem: 'R', accessoire: 'A',
};
const KLEUR_LETTER: Record<string, string> = {
  zwart: 'Z', wit: 'W', grijs: 'G', bruin: 'BR', blauw: 'B', rood: 'R',
  groen: 'GR', geel: 'Y', oranje: 'O', roze: 'P', paars: 'PA', beige: 'BE',
};
const LENGTE_LETTER: Record<string, string> = { kort: 'K', lang: 'L' };

function bouwBasis(type?: string, hoofdkleur?: string, lengte?: string) {
  const t = TYPE_PREFIX[type?.toLowerCase() ?? ''] || 'X';
  const k = KLEUR_LETTER[hoofdkleur?.toLowerCase() ?? ''] || 'X';
  const l = (type === 'broek' || type === 'shirt') && lengte ? (LENGTE_LETTER[lengte] || '') : '';
  return `${t}${k}${l}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = clientFromRequest(req);
    const user = await requireUser(supabase);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json();
    let { type, hoofdkleur, lengte } = body;

    // Als er een beschrijving is, leid type/kleur/lengte daaruit af (matcht de
    // — eventueel aangepaste — beschrijving i.p.v. de foto).
    if (body.beschrijving) {
      const prompt =
        'Bepaal op basis van deze kledingbeschrijving de volgende velden. Beschrijving: "' +
        body.beschrijving + '"\n' +
        '- type: één van: broek, shirt, overkleding, jas, schoen, riem, accessoire. (shirt = licht bovenstuk zoals t-shirt, polo, blouse, hemd; overkleding = dikkere bovenlaag zoals trui, vest, hoodie, sweater, colbert, blazer, gilet — maar GEEN jas/winterjas)\n' +
        '- hoofdkleur: één van: zwart, wit, grijs, bruin, blauw, rood, groen, geel, oranje, roze, paars, beige. Negeer "donker" of "licht" — bv. "donkerblauw" → "blauw", "lichtbruin" → "bruin".\n' +
        '- lengte: alleen voor broek of shirt. "kort" of "lang". Anders null.';
      const schema = {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['broek', 'shirt', 'overkleding', 'jas', 'schoen', 'riem', 'accessoire'] },
          hoofdkleur: { type: 'string' },
          lengte: { type: ['string', 'null'], enum: ['kort', 'lang', null] },
        },
        required: ['type', 'hoofdkleur'],
      };
      // deno-lint-ignore no-explicit-any
      const data = await invokeLLM({ prompt, response_json_schema: schema }) as any;
      type = data.type || type;
      hoofdkleur = data.hoofdkleur || hoofdkleur;
      lengte = data.lengte ?? lengte;
    }

    const basis = bouwBasis(type, hoofdkleur, lengte);

    // Bestaande codes met deze basis ophalen om het volgnummer te bepalen.
    const { data: alles, error } = await supabase.from('kledingstuk').select('code');
    if (error) throw error;
    const bestaande = (alles || [])
      .map((k: { code: string | null }) => k.code)
      .filter((c): c is string => !!c && c.startsWith(basis))
      .map((c) => parseInt(c.slice(basis.length), 10))
      .filter((n) => !isNaN(n));

    const nr = bestaande.length ? Math.max(...bestaande) + 1 : 1;
    return json({ code: `${basis}${nr}` });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
