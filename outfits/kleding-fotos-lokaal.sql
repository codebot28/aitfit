-- ─────────────────────────────────────────────────────────────
-- Outfit AI — laat de app de lokale kledingfoto's gebruiken
--
-- Na het draaien van `node scripts/download-kleding-fotos.mjs` staan alle
-- foto's in public/kleding/ met de code van het kledingstuk als bestandsnaam
-- (SZK4.jpg, en SR1__SWK2.jpg voor een afwijkende kleurvariant). Vite kopieert
-- die map naar dist/, dus nginx serveert ze op /kleding/<CODE>.jpg.
--
-- Dit script zet de Base44-URL's in de database om naar die lokale paden —
-- zowel foto_url als de foto's van de kleurvarianten in het profiel-JSON.
-- Daarna heeft de app geen internet meer nodig voor de kledingfoto's.
--
--   docker exec -i plell-db psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 < outfits/kleding-fotos-lokaal.sql
--
-- Het script is idempotent: paden die al met /kleding/ beginnen blijven staan.
-- ─────────────────────────────────────────────────────────────

begin;

-- ── 1. Kleurvarianten in het profiel-JSON ──
-- Een variant die dezelfde foto als het hoofditem gebruikt wijst naar
-- /kleding/<CODE>.jpg; een variant met een eigen foto naar
-- /kleding/<CODE>__<VARIANTCODE>.jpg. Dit moet vóór stap 2, omdat we de
-- oude foto_url nodig hebben om beide gevallen te onderscheiden.
with varianten as (
    select
        k.id,
        jsonb_agg(
            case
                when coalesce(elem->>'foto_url', '') = '' then elem
                when elem->>'foto_url' like '/kleding/%' then elem
                when elem->>'foto_url' = k.foto_url
                    then jsonb_set(elem, '{foto_url}', to_jsonb('/kleding/' || upper(k.code) || '.jpg'))
                when coalesce(elem->>'code', '') = '' then elem
                else jsonb_set(
                    elem,
                    '{foto_url}',
                    to_jsonb('/kleding/' || upper(k.code) || '__' || upper(elem->>'code') || '.jpg')
                )
            end
            order by ord
        ) as nieuw
    from public.kledingstuk k
    cross join lateral jsonb_array_elements(
        coalesce(k.profiel::jsonb -> 'varianten', '[]'::jsonb)
    ) with ordinality as t(elem, ord)
    where coalesce(k.code, '') <> ''
    group by k.id
)
update public.kledingstuk k
set profiel = jsonb_set(k.profiel::jsonb, '{varianten}', v.nieuw)::text
from varianten v
where v.id = k.id;

-- ── 2. Hoofdfoto van het kledingstuk ──
update public.kledingstuk
set foto_url = '/kleding/' || upper(code) || '.jpg'
where coalesce(code, '') <> ''
  and coalesce(foto_url, '') <> ''
  and foto_url not like '/kleding/%';

commit;

-- Controle: hier hoort niets meer uit te komen behalve kledingstukken
-- zonder foto.
select code, foto_url
from public.kledingstuk
where foto_url is not null
  and foto_url not like '/kleding/%'
order by code;
