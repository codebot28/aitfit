import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Check, X } from 'lucide-react';
import { autoHoofdletter } from '@/lib/tekst-formatter';
import { leesVarianten, schrijfVarianten } from '@/lib/varianten';
import { parseCode } from '@/lib/kledingstuk-code';
import DikteSelector from '@/components/toevoegen/DikteSelector';
import ExtraKleurenEditor from './ExtraKleurenEditor';

// Bewerk-formulier voor een kledingstuk. Beheert beschrijving, dikte en varianten.
export default function DetailBewerken({ item, onKlaar }) {
  const queryClient = useQueryClient();
  const initiëleVarianten = leesVarianten(item);
  const hoofdVariant = initiëleVarianten[0];
  const extraInitieel = initiëleVarianten.slice(1);

  const [beschrijving, setBeschrijving] = useState(item.beschrijving || '');
  const [dikte, setDikte] = useState(item.dikte || 'normaal');
  const [extraVarianten, setExtraVarianten] = useState(extraInitieel);
  const [saving, setSaving] = useState(false);

  const parsed = parseCode(item.code);
  const hoofdKleur = hoofdVariant?.kleur || parsed.kleur;

  const opslaan = async () => {
    setSaving(true);

    // Genereer codes voor nieuwe extras (die nog geen code hebben)
    const nieuweExtras = [];
    for (const ev of extraVarianten) {
      if (ev.code) {
        nieuweExtras.push(ev);
      } else {
        const res = await base44.functions.invoke('genereerCode', {
          type: parsed.type,
          hoofdkleur: ev.kleur,
          lengte: parsed.lengte
        });
        nieuweExtras.push({
          kleur: ev.kleur,
          code: res.data?.code || '',
          foto_url: ev.foto_url || ''
        });
      }
    }

    const varianten = [
    { kleur: hoofdKleur, code: item.code, foto_url: item.foto_url },
    ...nieuweExtras];


    await base44.entities.Kledingstuk.update(item.id, {
      beschrijving: beschrijving.trim(),
      dikte,
      profiel: schrijfVarianten(item, varianten)
    });
    await queryClient.invalidateQueries({ queryKey: ['kledingstuk', item.id] });
    await queryClient.invalidateQueries({ queryKey: ['kledingstukken'] });
    setSaving(false);
    onKlaar?.();
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 block">
          Beschrijving
        </label>
        <textarea
          value={beschrijving}
          onChange={(e) => setBeschrijving(autoHoofdletter(e.target.value))}
          rows={2}
          className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 transition resize-none font-display text-lg leading-snug" />
        
      </div>

      <DikteSelector value={dikte} onChange={setDikte} />

      <ExtraKleurenEditor
        extraVarianten={extraVarianten}
        onChange={setExtraVarianten}
        gebruikteKleuren={[hoofdKleur, ...extraVarianten.map((v) => v.kleur)].filter(Boolean)} />
      

      <div className="flex gap-2">
        <button
          onClick={opslaan}
          disabled={saving || !beschrijving.trim()}
          className="flex-1 bg-card border border-border text-foreground rounded-full py-3 text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-accent transition disabled:opacity-50">
          
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={2} />}
          Opslaan
        </button>
        <button
          onClick={onKlaar}
          className="flex-1 bg-primary rounded-full py-3 text-sm font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition text-[hsl(var(--foreground))]">
          
          <X className="w-4 h-4" strokeWidth={2} />
          Annuleren
        </button>
      </div>
    </div>);

}