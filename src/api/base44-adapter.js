// -----------------------------------------------------------------------------
// base44-adapter — een drop-in vervanging voor de @base44/sdk client, maar dan
// bovenop Supabase (database, auth, storage) + Anthropic (via edge functions).
//
// Doel: de bestaande frontend praat ongewijzigd verder via `base44.entities.*`,
// `base44.auth.*`, `base44.functions.invoke()` en `base44.integrations.Core.*`.
// Hierdoor is deze laag herbruikbaar voor álle van Base44 gemigreerde apps:
// alleen de tabel-mapping hieronder verschilt per app.
// -----------------------------------------------------------------------------
import { supabase } from './supabaseClient';

// Map van Base44-entiteitsnaam -> Postgres-tabel. Per app aanpasbaar.
const ENTITY_TABLES = {
  Kledingstuk: 'kledingstuk',
  Outfit: 'outfit',
  Feedback: 'feedback',
  Geheugen: 'geheugen',
};

const STORAGE_BUCKET = 'uploads';

function authError(message, status = 401) {
  return Object.assign(new Error(message), { status });
}

// Base44 sorteert met een string: 'veld' (oplopend) of '-veld' (aflopend).
function applySort(query, sort) {
  if (!sort) return query;
  const desc = sort.startsWith('-');
  const column = desc ? sort.slice(1) : sort;
  return query.order(column, { ascending: !desc });
}

function makeEntity(table) {
  return {
    async list(sort, limit) {
      let q = supabase.from(table).select('*');
      q = applySort(q, sort);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },

    async filter(criteria = {}, sort, limit) {
      let q = supabase.from(table).select('*');
      for (const [key, value] of Object.entries(criteria)) {
        q = Array.isArray(value) ? q.in(key, value) : q.eq(key, value);
      }
      q = applySort(q, sort);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },

    async get(id) {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },

    async create(values) {
      const { data, error } = await supabase.from(table).insert(values).select().single();
      if (error) throw error;
      return data;
    },

    async update(id, values) {
      const { data, error } = await supabase.from(table).update(values).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  };
}

const entities = Object.fromEntries(
  Object.entries(ENTITY_TABLES).map(([name, table]) => [name, makeEntity(table)])
);

// ---- auth -------------------------------------------------------------------
async function me() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw authError('Niet ingelogd');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email,
    full_name: profile?.full_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
    over_mij: profile?.over_mij ?? '',
    locatie_label: profile?.locatie_label ?? null,
    locatie_lat: profile?.locatie_lat ?? null,
    locatie_lon: profile?.locatie_lon ?? null,
    agenda_ical_url: profile?.agenda_ical_url ?? '',
    rooster_ical_url: profile?.rooster_ical_url ?? '',
    role: profile?.role ?? 'user',
  };
}

async function updateMe(values) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw authError('Niet ingelogd');
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, ...values })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function signInWithGoogle(redirectTo) {
  // Google-login geeft meteen een token waarmee we de agenda kunnen lezen.
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo || window.location.origin,
      scopes: 'email profile https://www.googleapis.com/auth/calendar.readonly',
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });
}

async function signInWithEmail(email, redirectTo) {
  // Magic link — geen wachtwoord nodig.
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo || window.location.origin },
  });
}

async function logout(redirectUrl) {
  await supabase.auth.signOut();
  if (typeof window !== 'undefined') {
    if (redirectUrl) window.location.href = redirectUrl;
    else window.location.reload();
  }
}

async function redirectToLogin(fromUrl) {
  // Standaard: Google (voor de agenda-koppeling).
  return signInWithGoogle(fromUrl);
}

// ---- functions (edge functions) ---------------------------------------------
async function invoke(name, payload) {
  const { data, error } = await supabase.functions.invoke(name, { body: payload ?? {} });
  if (error) {
    // Edge function gaf non-2xx terug — probeer de JSON-body alsnog te lezen,
    // zodat de bestaande `res.data?.error`-checks in de frontend blijven werken.
    if (error.context && typeof error.context.json === 'function') {
      try {
        const body = await error.context.json();
        return { data: body };
      } catch { /* val terug op error.message */ }
    }
    return { data: { error: error.message } };
  }
  return { data };
}

// ---- integrations.Core ------------------------------------------------------
async function UploadFile({ file }) {
  const { data: { user } } = await supabase.auth.getUser();
  const ext = (file.name?.split('.').pop() || 'bin').toLowerCase();
  const rnd = (crypto?.randomUUID?.() || `${Date.now()}-${Math.round(Math.random() * 1e9)}`);
  const path = `${user?.id ?? 'anon'}/kleding/${rnd}.${ext}`;

  const { error } = await supabase.storage
    .from('kleding')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;

  // Privebucket: sla het pad op, niet een publieke URL.
  const data = { publicUrl: path };
  return { file_url: data.publicUrl };
}

async function InvokeLLM(args) {
  // Nooit rechtstreeks vanuit de browser naar Anthropic (key zou lekken):
  // altijd via de server-side edge function 'invoke-llm'.
  const { data, error } = await supabase.functions.invoke('invoke-llm', { body: args });
  if (error) throw error;
  return data;
}

async function TranscribeAudio({ audio_url }) {
  const { data, error } = await supabase.functions.invoke('transcribe-audio', { body: { audio_url } });
  if (error) throw error;
  return data;
}

// ---- de samengestelde "base44" client ---------------------------------------
export const base44 = {
  auth: { me, updateMe, logout, redirectToLogin, signInWithGoogle, signInWithEmail },
  entities,
  functions: { invoke },
  integrations: { Core: { UploadFile, InvokeLLM, TranscribeAudio } },
};

export default base44;
