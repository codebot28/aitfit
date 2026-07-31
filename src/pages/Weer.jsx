import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Droplets, Wind, Thermometer, CloudOff, Loader2, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import MobileShell from '@/components/layout/MobileShell';
import useBrowserLocatie from '@/hooks/useBrowserLocatie';

export default function WeerPage() {
  const vandaag = new Date();
  const datumIso = format(vandaag, 'yyyy-MM-dd');
  const datumLabel = format(vandaag, 'EEEE d MMMM', { locale: nl });

  const { coords: browserCoords, status: locatieStatus } = useBrowserLocatie();
  const { data, isLoading } = useQuery({
    queryKey: ['weer', datumIso, browserCoords?.lat ?? null, browserCoords?.lon ?? null],
    enabled: locatieStatus !== 'pending',
    queryFn: async () => {
      const payload = browserCoords ? { lat: browserCoords.lat, lon: browserCoords.lon } : {};
      const res = await base44.functions.invoke('haalWeer', payload);
      if (res.data?.weer) return { weer: res.data.weer, error: null };
      return { weer: null, error: res.data?.error || 'Onbekende fout' };
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const weer = data?.weer || null;
  const error = data?.error || null;

  return (
    <MobileShell>
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <Link
          to="/outfit-van-de-dag"
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
        </Link>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Vandaag</p>
          <h1 className="font-display text-2xl text-foreground leading-tight capitalize">{datumLabel}</h1>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {isLoading ? (
          <div className="bg-card border border-border rounded-2xl p-8 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Weer laden…</p>
          </div>
        ) : error || !weer ? (
          <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-2 text-center">
            <CloudOff className="w-6 h-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{error || 'Weer niet beschikbaar'}</p>
          </div>
        ) : (
          <>
            {/* Hoofdkaart */}
            <div className="bg-card border border-border rounded-2xl p-6">
              {weer.locatie && (
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  <MapPin className="w-3 h-3" strokeWidth={1.75} />
                  {weer.locatie}
                </div>
              )}
              <div className="flex items-center gap-4">
                <img
                  src={`https://openweathermap.org/img/wn/${weer.icon}@4x.png`}
                  alt={weer.omschrijving}
                  className="w-24 h-24 -my-3"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-5xl text-foreground leading-none">
                    {weer.temperatuur}°
                  </p>
                  <p className="text-sm text-foreground capitalize mt-2">{weer.omschrijving}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-border">
                <Stat
                  icon={Thermometer}
                  label="Min / Max"
                  value={`${weer.min_temp}° / ${weer.max_temp}°`}
                />
                <Stat icon={Droplets} label="Neerslag" value={`${weer.neerslag_kans}%`} />
                <Stat icon={Wind} label="Wind" value={`${weer.wind_kmh} km/u`} />
              </div>
            </div>

            {/* Uur-tijdlijn */}
            {weer.tijdlijn?.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 px-1">
                  Per moment
                </p>
                <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
                  {weer.tijdlijn.map((t, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 flex flex-col items-center gap-1 bg-background border border-border rounded-2xl px-3 py-3 min-w-[68px]"
                    >
                      <p className="text-[11px] text-muted-foreground">{t.tijd}</p>
                      <p className="font-display text-xl text-foreground leading-none">
                        {t.temp}°
                      </p>
                      <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Droplets className="w-2.5 h-2.5" strokeWidth={1.75} />
                        {t.neerslag_kans}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Per moment details */}
            {weer.tijdlijn?.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 px-1">
                  Details
                </p>
                <div className="divide-y divide-border">
                  {weer.tijdlijn.map((t, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5">
                      <p className="text-sm font-medium text-foreground w-12">{t.tijd}</p>
                      <p className="text-sm text-foreground flex-1 capitalize truncate">
                        {t.omschrijving}
                      </p>
                      <p className="text-sm text-muted-foreground">{t.neerslag_kans}%</p>
                      <p className="text-sm font-medium text-foreground w-10 text-right">
                        {t.temp}°
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MobileShell>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col items-center text-center gap-1">
      <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}