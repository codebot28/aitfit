-- Google-login: bewaar de refresh-token zodat de agenda server-side opgehaald
-- kan blijven worden (Google access-tokens verlopen na ~1 uur).
alter table public.profiles add column if not exists google_refresh_token text;
