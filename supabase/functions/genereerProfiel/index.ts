import { corsHeaders, json } from '../_shared/cors.ts';
import { clientFromRequest, requireUser } from '../_shared/supabaseClient.ts';
import { invokeLLM } from '../_shared/anthropic.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = clientFromRequest(req);
    const user = await requireUser(supabase);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { beschrijving, dikte } = await req.json();
    if (!beschrijving || !dikte) return json({ error: 'beschrijving en dikte zijn verplicht' }, 400);

    const prompt = `Genereer een JSON-profiel voor dit kledingstuk op basis van de beschrijving en dikte. Geef altijd deze velden terug: kleur (hoofdkleur in het Nederlands), type (bijv. polo, jeans, sneaker, jas), mouwen (geen/kort/lang/nvt), dikte (dun/normaal/dik), seizoen (array: lente/zomer/herfst/winter), formeel_niveau (casual/smart-casual/formeel), categorie (bovenkleding/onderkleding/schoeisel/accessoire/jas). Geef alleen JSON terug, geen uitleg.

Beschrijving: ${beschrijving}
Dikte: ${dikte}`;

    const schema = {
      type: 'object',
      properties: {
        kleur: { type: 'string' },
        type: { type: 'string' },
        mouwen: { type: 'string', enum: ['geen', 'kort', 'lang', 'nvt'] },
        dikte: { type: 'string', enum: ['dun', 'normaal', 'dik'] },
        seizoen: { type: 'array', items: { type: 'string', enum: ['lente', 'zomer', 'herfst', 'winter'] } },
        formeel_niveau: { type: 'string', enum: ['casual', 'smart-casual', 'formeel'] },
        categorie: { type: 'string', enum: ['bovenkleding', 'onderkleding', 'schoeisel', 'accessoire', 'jas'] },
      },
      required: ['kleur', 'type', 'mouwen', 'dikte', 'seizoen', 'formeel_niveau', 'categorie'],
    };

    const profiel = await invokeLLM({ prompt, response_json_schema: schema, model: 'claude_sonnet_4_6' });
    return json({ profiel });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
