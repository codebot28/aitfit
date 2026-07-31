import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CalendarDays, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function AgendaRoosterInstelling({ user }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [agenda, setAgenda] = useState('');
  const [rooster, setRooster] = useState('');

  useEffect(() => {
    setAgenda(user?.agenda_ical_url || '');
    setRooster(user?.rooster_ical_url || '');
  }, [user]);

  const opslaan = useMutation({
    mutationFn: () =>
      base44.auth.updateMe({
        agenda_ical_url: agenda.trim() || null,
        rooster_ical_url: rooster.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['agenda'] });
      qc.invalidateQueries({ queryKey: ['rooster'] });
      toast({ title: 'Opgeslagen', description: 'Je agenda- en roosterlinks zijn bijgewerkt.' });
    },
    onError: (e) => toast({ title: 'Opslaan mislukt', description: e.message }),
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.75} />
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Agenda &amp; rooster</p>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
        Plak je privé iCal-links. Google Agenda: Instellingen → je agenda → &ldquo;Geheim adres in
        iCal-indeling&rdquo;. Rooster: de iCal/abonneer-link van je rooster.
      </p>

      <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">Agenda iCal-link</label>
      <input
        type="url"
        value={agenda}
        onChange={(e) => setAgenda(e.target.value)}
        placeholder="https://calendar.google.com/.../basic.ics"
        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 transition mb-3"
      />

      <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">Rooster iCal-link</label>
      <input
        type="url"
        value={rooster}
        onChange={(e) => setRooster(e.target.value)}
        placeholder="https://...rooster....ics"
        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 transition mb-3"
      />

      <button
        onClick={() => opslaan.mutate()}
        disabled={opslaan.isPending}
        className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
      >
        {opslaan.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Opslaan
      </button>
    </div>
  );
}
