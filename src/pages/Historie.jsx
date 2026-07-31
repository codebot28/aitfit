import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ArrowLeft, History } from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import OutfitHistorieRij from '@/components/kast/OutfitHistorieRij';

export default function HistoriePage() {
  const { data: items = [] } = useQuery({
    queryKey: ['kledingstukken'],
    queryFn: () => base44.entities.Kledingstuk.list('-aangemaakt_op'),
  });

  const { data: outfits = [], isLoading } = useQuery({
    queryKey: ['outfits-historie'],
    queryFn: () => base44.entities.Outfit.list('-datum'),
  });

  return (
    <MobileShell>
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <Link
          to="/"
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
        </Link>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Outfits</p>
          <h1 className="font-display text-2xl text-foreground leading-tight">Geschiedenis</h1>
        </div>
      </div>

      <div className="px-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : outfits.length === 0 ? (
          <div className="mt-10 text-center bg-card border border-border rounded-3xl p-10">
            <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mx-auto">
              <History className="w-6 h-6 text-accent-foreground" strokeWidth={1.5} />
            </div>
            <p className="font-display text-xl text-foreground mt-4">Nog geen outfits</p>
            <p className="text-sm text-muted-foreground mt-1">
              Genereer je eerste outfit van de dag
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {outfits.map((o) => (
              <OutfitHistorieRij key={o.id} outfit={o} kledingstukken={items} />
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  );
}