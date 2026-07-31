import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, Shirt } from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import KledingstukKaart from '@/components/kast/KledingstukKaart';
import HamburgerMenu from '@/components/layout/HamburgerMenu';
import ScrollNaarBovenKnop from '@/components/kast/ScrollNaarBovenKnop';
import FilterSorteerBalk from '@/components/kast/FilterSorteerBalk';
import { parseCode } from '@/lib/kledingstuk-code';

export default function MijnKastPage() {
  const [typeFilter, setTypeFilter] = useState(null);
  const [kleurFilter, setKleurFilter] = useState(null);
  const [lengteFilter, setLengteFilter] = useState(null);
  const [sorteer, setSorteer] = useState('nieuwst');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['kledingstukken'],
    queryFn: () => base44.entities.Kledingstuk.list('-aangemaakt_op'),
  });

  const items_geparsed = useMemo(
    () => items.map((it) => ({ ...it, _parsed: parseCode(it.code) })),
    [items]
  );

  // Beschikbare opties per dimensie = unieke waarden in items die voldoen aan ALLE
  // andere actieve filters (de filter op de dimensie zelf wordt genegeerd).
  const opties = (dimensie) => {
    const lijst = items_geparsed.filter((it) => {
      if (dimensie !== 'type' && typeFilter && it._parsed.type !== typeFilter) return false;
      if (dimensie !== 'kleur' && kleurFilter && it._parsed.kleur !== kleurFilter) return false;
      if (dimensie !== 'lengte' && lengteFilter && it._parsed.lengte !== lengteFilter) return false;
      return true;
    });
    return [...new Set(lijst.map((it) => it._parsed[dimensie]).filter(Boolean))];
  };

  const beschikbareTypes = useMemo(
    () => opties('type'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items_geparsed, kleurFilter, lengteFilter]
  );
  const beschikbareKleuren = useMemo(
    () => opties('kleur'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items_geparsed, typeFilter, lengteFilter]
  );
  const beschikbareLengtes = useMemo(
    () => opties('lengte'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items_geparsed, typeFilter, kleurFilter]
  );

  const zichtbareItems = useMemo(() => {
    let lijst = items_geparsed;

    if (typeFilter) lijst = lijst.filter((it) => it._parsed.type === typeFilter);
    if (kleurFilter) lijst = lijst.filter((it) => it._parsed.kleur === kleurFilter);
    if (lengteFilter) lijst = lijst.filter((it) => it._parsed.lengte === lengteFilter);

    const codeOf = (it) => it.code || '';
    const tijdOf = (it) => new Date(it.aangemaakt_op || it.created_date || 0).getTime();
    const nrOf = (it) => (it._parsed.nummer == null ? Number.POSITIVE_INFINITY : it._parsed.nummer);

    lijst = [...lijst];
    if (sorteer === 'nieuwst') lijst.sort((a, b) => tijdOf(b) - tijdOf(a));
    else if (sorteer === 'oudst') lijst.sort((a, b) => tijdOf(a) - tijdOf(b));
    else if (sorteer === 'code_az') lijst.sort((a, b) => codeOf(a).localeCompare(codeOf(b)));
    else if (sorteer === 'code_za') lijst.sort((a, b) => codeOf(b).localeCompare(codeOf(a)));
    else if (sorteer === 'nummer_asc') lijst.sort((a, b) => nrOf(a) - nrOf(b));
    else if (sorteer === 'nummer_desc') lijst.sort((a, b) => nrOf(b) - nrOf(a));

    return lijst;
  }, [items_geparsed, typeFilter, kleurFilter, lengteFilter, sorteer]);

  return (
    <MobileShell>
      <div className="px-5 pt-10 pb-5 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Collectie</p>
          <h1 className="font-display text-3xl text-foreground mt-1.5">Mijn Kast</h1>
        </div>
        <HamburgerMenu />
      </div>

      <div className="px-5 mb-4">
        <Link
          to="/toevoegen"
          className="w-full bg-primary rounded-2xl py-3.5 font-medium flex items-center justify-center gap-2 hover:opacity-90 transition shadow-lg"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          Nieuw item toevoegen
        </Link>
      </div>

      {items.length > 0 && (
        <div className="px-5 mb-4">
          <FilterSorteerBalk
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            kleurFilter={kleurFilter}
            setKleurFilter={setKleurFilter}
            lengteFilter={lengteFilter}
            setLengteFilter={setLengteFilter}
            sorteer={sorteer}
            setSorteer={setSorteer}
            beschikbareTypes={beschikbareTypes}
            beschikbareKleuren={beschikbareKleuren}
            beschikbareLengtes={beschikbareLengtes}
          />
        </div>
      )}

      <div className="px-5">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-10 text-center bg-card border border-border rounded-3xl p-10">
            <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mx-auto">
              <Shirt className="w-6 h-6 text-accent-foreground" strokeWidth={1.5} />
            </div>
            <p className="font-display text-xl text-foreground mt-4">Nog geen items</p>
            <p className="text-sm text-muted-foreground mt-1">Voeg je eerste kledingstuk toe</p>
          </div>
        ) : zichtbareItems.length === 0 ? (
          <div className="mt-6 text-center bg-card border border-border rounded-3xl p-8">
            <p className="text-sm text-muted-foreground">Geen items met deze filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {zichtbareItems.map((item, i) => (
              <KledingstukKaart key={item.id} item={item} prioriteit={i < 6} />
            ))}
          </div>
        )}
      </div>
      <ScrollNaarBovenKnop />
    </MobileShell>
  );
}