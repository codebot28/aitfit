import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, Check, X } from 'lucide-react';
import { autoHoofdletter } from '@/lib/tekst-formatter';

export default function OpmerkingEditor({ item }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [tekst, setTekst] = useState(item.opmerking || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTekst(item.opmerking || '');
  }, [item.opmerking]);

  const opslaan = async () => {
    setSaving(true);
    await base44.entities.Kledingstuk.update(item.id, { opmerking: tekst.trim() });
    await queryClient.invalidateQueries({ queryKey: ['kledingstuk', item.id] });
    await queryClient.invalidateQueries({ queryKey: ['kledingstukken'] });
    setSaving(false);
    setEditing(false);
  };

  const annuleren = () => {
    setTekst(item.opmerking || '');
    setEditing(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Opmerking</p>
        {!editing &&
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition">
          
            <Pencil className="w-3 h-3" strokeWidth={1.75} />
            {item.opmerking ? 'Bewerken' : 'Toevoegen'}
          </button>
        }
      </div>

      {editing ?
      <div className="space-y-2">
          <textarea
          value={tekst}
          onChange={(e) => setTekst(autoHoofdletter(e.target.value))}
          placeholder="Bijv. zit lekker maar krast bij warm weer"
          rows={3}
          className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 transition resize-none" />
        
          <div className="flex gap-2">
            <button
            onClick={opslaan}
            disabled={saving}
            className="flex-1 bg-card border border-border rounded-full py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-accent transition disabled:opacity-50">
            
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={2} />}
              Opslaan
            </button>
            <button
            onClick={annuleren}
            className="flex-1 bg-primary rounded-full py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition">
            
              <X className="w-4 h-4" strokeWidth={2} />
              Annuleren
            </button>
          </div>
        </div> :
      item.opmerking ?
      <p className="text-sm text-foreground bg-card border border-border rounded-2xl px-4 py-3 leading-relaxed whitespace-pre-wrap">
          {item.opmerking}
        </p> :

      <p className="text-sm text-muted-foreground italic">
          Nog geen opmerking. Geef feedback op outfits — de AI vult dit automatisch aan.
        </p>
      }
    </div>);

}