import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2, CloudOff, Droplets, Wind } from 'lucide-react';

export default function WeerKaart({ weer, isLoading, error }) {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Weer laden…</p>
      </div>
    );
  }

  if (error || !weer) {
    return (
      <div className="bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center gap-3">
        <CloudOff className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Weer niet beschikbaar</p>
      </div>
    );
  }

  const iconUrl = `https://openweathermap.org/img/wn/${weer.icon}@2x.png`;

  return (
    <Link
      to="/weer"
      className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-3 hover:bg-accent transition"
    >
      <img src={iconUrl} alt={weer.omschrijving} className="w-12 h-12 -my-1" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          {weer.min_temp !== undefined && weer.max_temp !== undefined && weer.min_temp !== weer.max_temp ? (
            <p className="font-display text-2xl text-foreground leading-none">
              {weer.min_temp}° – {weer.max_temp}°
            </p>
          ) : (
            <p className="font-display text-2xl text-foreground leading-none">{weer.temperatuur}°</p>
          )}
          <p className="text-sm text-foreground capitalize truncate">{weer.omschrijving}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Droplets className="w-3 h-3" strokeWidth={1.75} />
            {weer.neerslag_kans}%
          </span>
          <span className="flex items-center gap-1">
            <Wind className="w-3 h-3" strokeWidth={1.75} />
            {weer.wind_kmh} km/u
          </span>
        </div>
      </div>
    </Link>
  );
}