import React from 'react';
import { GraduationCap, Loader2, MapPin } from 'lucide-react';

function formatTijd(iso) {
  return new Date(iso).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Amsterdam',
  });
}

export default function RoosterKaart({ lessen, isLoading, error }) {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Rooster laden…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-2xl px-4 py-3.5">
        <p className="text-sm text-muted-foreground">Rooster niet beschikbaar</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.75} />
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          HvA rooster · {lessen.length} {lessen.length === 1 ? 'les' : 'lessen'}
        </p>
      </div>
      {lessen.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen lessen vandaag</p>
      ) : (
        <ul className="space-y-2">
          {lessen.map((l) => (
            <li key={l.id} className="flex gap-3">
              <span className="text-xs text-muted-foreground tabular-nums w-12 shrink-0 pt-0.5">
                {l.hele_dag ? 'Hele dag' : formatTijd(l.start)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{l.naam}</p>
                {l.locatie && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" strokeWidth={1.75} />
                    <span className="truncate">{l.locatie}</span>
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}