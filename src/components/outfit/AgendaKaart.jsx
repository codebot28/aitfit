import React from 'react';
import { Calendar, Loader2, Link as LinkIcon, MapPin } from 'lucide-react';

function formatTijd(iso) {
  return new Date(iso).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Amsterdam',
  });
}

export default function AgendaKaart({ afspraken, isLoading, needsConnect, onConnect, isConnecting, error }) {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Agenda laden…</p>
      </div>
    );
  }

  if (needsConnect) {
    return (
      <button
        onClick={onConnect}
        disabled={isConnecting}
        className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:bg-accent transition text-left disabled:opacity-50"
      >
        <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shrink-0">
          {isConnecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LinkIcon className="w-4 h-4" strokeWidth={1.75} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Koppel Google Calendar</p>
          <p className="text-[11px] text-muted-foreground">Voor outfit-advies op basis van je afspraken</p>
        </div>
      </button>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-2xl px-4 py-3.5">
        <p className="text-sm text-muted-foreground">Agenda niet beschikbaar</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.75} />
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Vandaag · {afspraken.length} {afspraken.length === 1 ? 'afspraak' : 'afspraken'}
        </p>
      </div>
      {afspraken.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen afspraken vandaag</p>
      ) : (
        <ul className="space-y-2">
          {afspraken.map((a) => (
            <li key={a.id} className="flex gap-3">
              <span className="text-xs text-muted-foreground tabular-nums w-12 shrink-0 pt-0.5">
                {a.hele_dag ? 'Hele dag' : formatTijd(a.start)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{a.naam}</p>
                {a.locatie && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" strokeWidth={1.75} />
                    <span className="truncate">{a.locatie}</span>
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