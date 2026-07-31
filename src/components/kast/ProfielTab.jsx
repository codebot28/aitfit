import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, Trash2, Brain } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import OverMijKaart from '@/components/kast/OverMijKaart';

export default function ProfielTab() {
  const qc = useQueryClient();

  const { data: samenvattingen = [], isLoading: laadSam } = useQuery({
    queryKey: ['geheugen', 'samenvatting'],
    queryFn: () =>
      base44.entities.Geheugen.filter({ type: 'profiel_samenvatting' }, '-aangemaakt_op', 1),
  });

  const { data: leermomenten = [], isLoading: laadLeer } = useQuery({
    queryKey: ['geheugen', 'leermomenten'],
    queryFn: () =>
      base44.entities.Geheugen.filter({ type: 'leermoment' }, '-aangemaakt_op', 20),
  });

  const verwijder = useMutation({
    mutationFn: (id) => base44.entities.Geheugen.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['geheugen'] }),
  });

  const samenvatting = samenvattingen[0];
  const isLoading = laadSam || laadLeer;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-32 rounded-2xl bg-muted animate-pulse" />
        <div className="h-20 rounded-2xl bg-muted animate-pulse" />
        <div className="h-20 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <OverMijKaart />

      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.75} />
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Jouw stijlprofiel</p>
        </div>
        {samenvatting ? (
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {samenvatting.inhoud}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nog niet genoeg data. Geef feedback op een paar outfits zodat we je beter leren kennen.
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Brain className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.75} />
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Leermomenten · {leermomenten.length}
          </p>
        </div>

        {leermomenten.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-sm text-muted-foreground">Nog geen leermomenten opgeslagen.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {leermomenten.map((l) => (
              <li
                key={l.id}
                className="bg-card border border-border rounded-2xl p-4 flex gap-3 items-start"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed">{l.inhoud}</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    {format(new Date(l.aangemaakt_op || l.created_date), 'd MMM yyyy', { locale: nl })}
                  </p>
                </div>
                <button
                  onClick={() => verwijder.mutate(l.id)}
                  disabled={verwijder.isPending}
                  className="shrink-0 w-8 h-8 rounded-full hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-destructive transition disabled:opacity-50"
                  aria-label="Leermoment verwijderen"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}