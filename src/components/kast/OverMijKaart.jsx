import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { User, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function OverMijKaart() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tekst, setTekst] = useState('');
  const [origineel, setOrigineel] = useState('');

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (user) {
      const huidig = user.over_mij || '';
      setTekst(huidig);
      setOrigineel(huidig);
    }
  }, [user]);

  const opslaan = useMutation({
    mutationFn: (over_mij) => base44.auth.updateMe({ over_mij }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      setOrigineel(tekst);
      toast({ title: 'Opgeslagen', description: 'Je profielinfo is bijgewerkt.' });
    },
  });

  const veranderd = tekst !== origineel;

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <User className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.75} />
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Over mij</p>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">
        Vertel iets wat handig is voor je outfitkeuze. Bijv. lichaamsbouw, kleurvoorkeuren, dingen die je nooit draagt, of waar je snel last van hebt (warmte, kou, schurende stoffen).
      </p>
      <textarea
        value={tekst}
        onChange={(e) => setTekst(e.target.value)}
        disabled={isLoading}
        placeholder="Ik heb het snel warm, draag liever geen felle kleuren, en…"
        rows={5}
        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 transition resize-none"
      />
      {veranderd && (
        <div className="flex justify-end mt-3">
          <button
            onClick={() => opslaan.mutate(tekst)}
            disabled={opslaan.isPending}
            className="bg-primary text-[#000000] rounded-full px-4 py-2 text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition disabled:opacity-50"
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