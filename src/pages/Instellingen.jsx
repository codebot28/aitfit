import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Loader2 } from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import NaamInstelling from '@/components/instellingen/NaamInstelling';
import LocatieInstelling from '@/components/instellingen/LocatieInstelling';
import AgendaRoosterInstelling from '@/components/instellingen/AgendaRoosterInstelling';

export default function InstellingenPage() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
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
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Account</p>
          <h1 className="font-display text-2xl text-foreground leading-tight">Instellingen</h1>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {isLoading ? (
          <div className="bg-card border border-border rounded-2xl p-8 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <NaamInstelling user={user} />
            <LocatieInstelling user={user} />
            <AgendaRoosterInstelling user={user} />
          </>
        )}
      </div>
    </MobileShell>
  );
}
