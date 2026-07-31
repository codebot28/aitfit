import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { User, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function NaamInstelling({ user }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [naam, setNaam] = useState('');
  const [origineel, setOrigineel] = useState('');

  useEffect(() => {
    if (user) {
      const n = user.full_name || '';
      setNaam(n);
      setOrigineel(n);
    }
  }, [user]);

  const opslaan = useMutation({
    mutationFn: (full_name) => base44.auth.updateMe({ full_name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      setOrigineel(naam);
      toast({ title: 'Opgeslagen', description: 'Je naam is bijgewerkt.' });
    },
  });

  const veranderd = naam !== origineel && naam.trim().length > 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <User className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.75} />
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Naam</p>
      </div>
      <input
        type="text"
        value={naam}
        onChange={(e) => setNaam(e.target.value)}
        placeholder="Je naam"
        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 transition"
      />
      {user?.email && (
        <p className="text-[11px] text-muted-foreground mt-2">
          E-mail: <span className="text-foreground">{user.email}</span>
        </p>
      )}
      {veranderd && (
        <div className="flex justify-end mt-3">
          <button
            onClick={() => opslaan.mutate(naam.trim())}
            disabled={opslaan.isPending}
            className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition disabled:opacity-50"
          >
            {opslaan.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" strokeWidth={2} />
            )}
            Opslaan
          </button>
        </div>
      )}
    </div>
  );
}