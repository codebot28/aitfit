-- =============================================================================
-- Outfit AI — initieel schema (gemigreerd van Base44)
-- Tabellen: profiles, kledingstuk, outfit, feedback, geheugen
-- Inclusief Row Level Security (eigenaar-only) op ALLES + storage voor foto's.
-- =============================================================================

-- ---- PROFILES (vervangt de extra velden op Base44's User) -------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  over_mij      text,
  locatie_label text,
  locatie_lat   double precision,
  locatie_lon   double precision,
  agenda_ical_url  text,   -- privé iCal-link van Google Agenda (afspraken vandaag)
  rooster_ical_url text,   -- iCal-link van rooster (bijv. HvA)
  role          text not null default 'user',
  created_date  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_self" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Maak automatisch een profielrij aan bij registratie.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- KLEDINGSTUK ------------------------------------------------------------
create table if not exists public.kledingstuk (
  id            uuid primary key default gen_random_uuid(),
  created_by    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  foto_url      text,
  beschrijving  text,
  dikte         text check (dikte in ('dun','normaal','dik')),
  profiel       text,   -- JSON-als-string (zoals in Base44; kan later jsonb worden)
  opmerking     text,
  code          text,
  aangemaakt_op timestamptz default now(),
  created_date  timestamptz not null default now()
);

-- ---- OUTFIT -----------------------------------------------------------------
create table if not exists public.outfit (
  id                      uuid primary key default gen_random_uuid(),
  created_by              uuid not null default auth.uid() references auth.users(id) on delete cascade,
  datum                   date,
  kledingstuk_ids         text,   -- kommagescheiden id-lijst (zoals in Base44)
  weer_context            text,
  agenda_context          text,
  activiteit_beschrijving text,
  ai_redenering           text,
  feedback_tekst          text,
  rating                  int check (rating between 1 and 5),
  aangemaakt_op           timestamptz default now(),
  created_date            timestamptz not null default now()
);

-- ---- FEEDBACK ---------------------------------------------------------------
create table if not exists public.feedback (
  id             uuid primary key default gen_random_uuid(),
  created_by     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  outfit_id      uuid,
  feedback_tekst text,
  rating         int check (rating between 1 and 5),
  aangemaakt_op  timestamptz default now(),
  created_date   timestamptz not null default now()
);

-- ---- GEHEUGEN ---------------------------------------------------------------
create table if not exists public.geheugen (
  id             uuid primary key default gen_random_uuid(),
  created_by     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type           text not null check (type in ('leermoment','profiel_samenvatting')),
  inhoud         text not null,
  bron_outfit_id uuid,
  aangemaakt_op  timestamptz default now(),
  created_date   timestamptz not null default now()
);

-- ---- RLS: eigenaar-only op alle app-tabellen --------------------------------
alter table public.kledingstuk enable row level security;
alter table public.outfit      enable row level security;
alter table public.feedback    enable row level security;
alter table public.geheugen    enable row level security;

create policy "kledingstuk_owner" on public.kledingstuk
  for all using (auth.uid() = created_by) with check (auth.uid() = created_by);
create policy "outfit_owner" on public.outfit
  for all using (auth.uid() = created_by) with check (auth.uid() = created_by);
create policy "feedback_owner" on public.feedback
  for all using (auth.uid() = created_by) with check (auth.uid() = created_by);
create policy "geheugen_owner" on public.geheugen
  for all using (auth.uid() = created_by) with check (auth.uid() = created_by);

-- ---- Indexen voor de meest voorkomende queries ------------------------------
create index if not exists idx_kledingstuk_owner_aang on public.kledingstuk (created_by, aangemaakt_op desc);
create index if not exists idx_outfit_owner_datum     on public.outfit (created_by, datum desc);
create index if not exists idx_geheugen_owner_type    on public.geheugen (created_by, type, aangemaakt_op desc);

-- ---- STORAGE: bucket voor kledingfoto's -------------------------------------
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

create policy "uploads_public_read" on storage.objects
  for select using (bucket_id = 'uploads');
create policy "uploads_auth_insert" on storage.objects
  for insert with check (bucket_id = 'uploads' and auth.role() = 'authenticated');
create policy "uploads_owner_update" on storage.objects
  for update using (bucket_id = 'uploads' and owner = auth.uid());
create policy "uploads_owner_delete" on storage.objects
  for delete using (bucket_id = 'uploads' and owner = auth.uid());
