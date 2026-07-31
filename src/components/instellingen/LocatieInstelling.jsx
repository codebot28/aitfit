import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Search, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function LocatieInstelling({ user }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [zoekterm, setZoekterm] = useState('');
  const [resultaten, setResultaten] = useState([]);
  const [zoeken, setZoeken] = useState(false);

  const huidigLabel = user?.locatie_label || 'Amstelveen (standaard)';

  useEffect(() => {
    if (user?.locatie_label) setZoekterm(user.locatie_label);
  }, [user]);

  const zoek = async () => {
    if (!zoekterm.trim()) return;
    setZoeken(true);
    setResultaten([]);
    const res = await base44.functions.invoke('zoekLocatie', { q: zoekterm.trim() });
    setZoeken(false);
    if (res.data?.error) {
      toast({ title: 'Zoeken mislukt', description: res.data.error });
      return;
    }
    setResultaten(res.data?.resultaten || []);
  };

  const opslaan = useMutation({
    mutationFn: (loc) =>
      base44.auth.updateMe({
        locatie_label: loc.label,
        locatie_lat: loc.lat,
        locatie_lon: loc.lon,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['weer'] });
      toast({ title: 'Locatie opgeslagen', description: 'Het weer wordt nu voor deze locatie opgehaald.' });
      setResultaten([]);
    },
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.75} />
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Locatie voor weer</p>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">
        Huidige locatie: <span className="text-foreground font-medium">{huidigLabel}</span>
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={zoekterm}
          onChange={(e) => setZoekterm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && zoek()}
          placeholder="Plaatsnaam, bijv. Amsterdam"
          className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 transition"
        />
        <button
          onClick={zoek}
          disabled={zoeken || !zoekterm.trim()}
          className="bg-primary text-primary-foreground rounded-xl px-4 text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition disabled:opacity-50"
        >
          {zoeken ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </div>

      {resultaten.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {resultaten.map((r, i) => (
            <button
              key={i}
              onClick={() => opslaan.mutate(r)}
              disabled={opslaan.isPending}
              className="w-full text-left bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-accent transition flex items-center gap-2 disabled:opacity-50"
            >
              <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" strokeWidth={1.75} />
              <span className="flex-1 truncate">{r.label}</span>
              {opslaan.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              ) : (
                <Check className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}