import { corsHeaders, json } from '../_shared/cors.ts';
import { clientFromRequest, requireUser } from '../_shared/supabaseClient.ts';
import { invokeLLM } from '../_shared/anthropic.ts';

// Generieke LLM-proxy (vervangt base44.integrations.Core.InvokeLLM vanuit de browser).
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = clientFromRequest(req);
    const user = await requireUser(supabase);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const args = await req.json();
    const result = await invokeLLM(args);
    return json(result);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
