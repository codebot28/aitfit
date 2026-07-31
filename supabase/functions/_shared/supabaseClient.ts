import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';

// Maakt een Supabase-client die meeschrijft ALS de ingelogde gebruiker
// (de Authorization-header van het verzoek wordt doorgegeven), zodat RLS
// gewoon van toepassing is — net als bij Base44's createClientFromRequest.
export function clientFromRequest(req: Request): SupabaseClient {
  const authHeader = req.headers.get('Authorization') ?? '';
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
  );
}

export async function requireUser(supabase: SupabaseClient) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}
