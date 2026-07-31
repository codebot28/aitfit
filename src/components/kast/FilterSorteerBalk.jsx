import React from 'react';
import { ArrowUpDown, X } from 'lucide-react';
import { TYPE_OPTIES, KLEUR_OPTIES, LENGTE_OPTIES, TYPES_MET_LENGTE } from '@/lib/kledingstuk-code';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const SORTEER_LABELS = {
  nieuwst: 'Nieuw → Oud',
  oudst: 'Oud → Nieuw',
  code_az: 'Code A → Z',
  code_za: 'Code Z → A',
  nummer_asc: 'Nummer klein → groot',
  nummer_desc: 'Nummer groot → klein',
};

// Knop met optioneel kruisje dat de filter wist zonder het dropdown te openen
function FilterKnop({ actief, onWis, children }) {
  const klasse = `px-3.5 py-2 rounded-full text-xs font-medium border transition flex items-center gap-1.5 ${
    actief ? 'bg-white text-black border-black' : 'bg-card text-foreground border-border hover:bg-accent'
  }`;
  return (
    <DropdownMenuTrigger asChild>
      <button className={klasse}>
        {children}
        {actief && (
          <span
            role="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onWis();
            }}
            className="ml-0.5 -mr-1 p-0.5 rounded-full hover:bg-black/10"
          >
            <X className="w-3 h-3" strokeWidth={2.5} />
          </span>
        )}
      </button>
    </DropdownMenuTrigger>
  );
}

export default function FilterSorteerBalk({
  typeFilter,
  setTypeFilter,
  kleurFilter,
  setKleurFilter,
  lengteFilter,
  setLengteFilter,
  sorteer,
  setSorteer,
  beschikbareTypes = [],
  beschikbareKleuren = [],
  beschikbareLengtes = [],
}) {
  const typeOpties = TYPE_OPTIES.filter((t) => beschikbareTypes.includes(t.key));
  const kleurOpties = KLEUR_OPTIES.filter((k) => beschikbareKleuren.includes(k.key));
  const lengteOpties = LENGTE_OPTIES.filter((l) => beschikbareLengtes.includes(l.key));

  const typeLabel = typeFilter ? TYPE_OPTIES.find((t) => t.key === typeFilter)?.label : 'Type';
  const kleur = kleurFilter ? KLEUR_OPTIES.find((k) => k.key === kleurFilter) : null;
  const lengteLabel = lengteFilter ? LENGTE_OPTIES.find((l) => l.key === lengteFilter)?.label : 'Lengte';

  // Toon lengtefilter alleen als er geen type-filter actief is, OF als het type lengte ondersteunt
  const toonLengte =
    lengteOpties.length > 0 && (!typeFilter || TYPES_MET_LENGTE.includes(typeFilter));

  return (
    <div className="flex gap-2 flex-wrap">
      {/* Type */}
      <DropdownMenu>
        <FilterKnop actief={!!typeFilter} onWis={() => setTypeFilter(null)}>
          {typeLabel}
        </FilterKnop>
        <DropdownMenuContent align="start" className="rounded-2xl">
          <DropdownMenuLabel>Filter op type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {typeOpties.length === 0 ? (
            <DropdownMenuItem disabled>Geen types beschikbaar</DropdownMenuItem>
          ) : (
            typeOpties.map((t) => (
              <DropdownMenuItem key={t.key} onClick={() => setTypeFilter(t.key)}>
                {t.label}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Kleur */}
      <DropdownMenu>
        <FilterKnop actief={!!kleurFilter} onWis={() => setKleurFilter(null)}>
          {kleur && (
            <span
              className="w-3 h-3 rounded-full border border-black/20"
              style={{ backgroundColor: kleur.hex }}
            />
          )}
          {kleur ? kleur.label : 'Kleur'}
        </FilterKnop>
        <DropdownMenuContent align="start" className="rounded-2xl max-h-80 overflow-y-auto">
          <DropdownMenuLabel>Filter op kleur</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {kleurOpties.length === 0 ? (
            <DropdownMenuItem disabled>Geen kleuren beschikbaar</DropdownMenuItem>
          ) : (
            kleurOpties.map((k) => (
              <DropdownMenuItem key={k.key} onClick={() => setKleurFilter(k.key)} className="gap-2">
                <span
                  className="w-3 h-3 rounded-full border border-border"
                  style={{ backgroundColor: k.hex }}
                />
                {k.label}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Lengte */}
      {toonLengte && (
        <DropdownMenu>
          <FilterKnop actief={!!lengteFilter} onWis={() => setLengteFilter(null)}>
            {lengteLabel}
          </FilterKnop>
          <DropdownMenuContent align="start" className="rounded-2xl">
            <DropdownMenuLabel>Filter op lengte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {lengteOpties.map((l) => (
              <DropdownMenuItem key={l.key} onClick={() => setLengteFilter(l.key)}>
                {l.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Sorteer */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="ml-auto px-3.5 py-2 rounded-full text-xs font-medium border bg-card text-foreground border-border hover:bg-accent transition flex items-center gap-1.5">
            <ArrowUpDown className="w-3 h-3" strokeWidth={2} />
            {SORTEER_LABELS[sorteer]}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-2xl">
          <DropdownMenuLabel>Sorteer op</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={sorteer} onValueChange={setSorteer}>
            {Object.entries(SORTEER_LABELS).map(([key, label]) => (
              <DropdownMenuRadioItem key={key} value={key}>
                {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}