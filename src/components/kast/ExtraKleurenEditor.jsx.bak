import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, X, ImagePlus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KLEUR_OPTIES } from '@/lib/kledingstuk-code';
import { getKleurInfo } from '@/lib/varianten';

// Editor voor extra kleur-varianten (naast de hoofdvariant).
// props:
//   extraVarianten: [{ kleur, code?, foto_url? }]  - alleen de extras
//   onChange: (nieuweLijst) => void
//   gebruikteKleuren: string[]  - kleuren die al in gebruik zijn (hoofd + extras), om te disabelen
export default function ExtraKleurenEditor({ extraVarianten, onChange, gebruikteKleuren = [] }) {
  const [actief, setActief] = useState(extraVarianten.length > 0);
  const [zoek, setZoek] = useState('');
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const inputRefs = useRef({});

  const voegToe = (kleurKey) => {
    if (!kleurKey || gebruikteKleuren.includes(kleurKey)) return;
    onChange([...extraVarianten, { kleur: kleurKey, foto_url: '' }]);
    setZoek('');
  };

  const verwijder = (i) => {
    const kopie = [...extraVarianten];
    kopie.splice(i, 1);
    onChange(kopie);
  };

  const uploadFoto = async (i, file) => {
    setUploadingIndex(i);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const kopie = [...extraVarianten];
    kopie[i] = { ...kopie[i], foto_url: file_url };
    onChange(kopie);
    setUploadingIndex(null);
  };

  const resultaten = zoek.trim()
    ? KLEUR_OPTIES.filter(
        (k) =>
          !gebruikteKleuren.includes(k.key) &&
          (k.label.toLowerCase().includes(zoek.trim().toLowerCase()) ||
            k.key.includes(zoek.trim().toLowerCase()))
      )
    : [];

  if (!actief) {
    return (
      <button
        type="button"
        onClick={() => setActief(true)}
        className="w-full bg-card border border-border rounded-2xl py-3 text-sm font-medium flex items-center justify-center gap-2 hover:bg-accent transition"
      >
        <Plus className="w-4 h-4" strokeWidth={2} />
        Extra kleuren toevoegen
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Extra kleuren
        </label>
        <button
          type="button"
          onClick={() => setActief(false)}
          className="text-xs text-muted-foreground hover:text-foreground transition"
        >
          Sluiten
        </button>
      </div>

      {/* Zoekbalk */}
      <div className="relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
        <input
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          placeholder="Zoek een kleur (bv. blauw)"
          className="w-full bg-card border border-border rounded-full pl-11 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 transition"
        />
      </div>

      {/* Resultaten: rij met bolletje + kleurnaam */}
      {resultaten.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {resultaten.map((k) => (
            <button
              key={k.key}
              type="button"
              onClick={() => voegToe(k.key)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition text-left"
            >
              <span
                className="w-5 h-5 rounded-full border border-black/10 shrink-0"
                style={{ backgroundColor: k.hex }}
              />
              <span className="text-sm font-medium capitalize">{k.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Lijst van toegevoegde extras */}
      {extraVarianten.length > 0 && (
        <div className="space-y-2">
          {extraVarianten.map((v, i) => {
            const info = getKleurInfo(v.kleur);
            return (
              <div
                key={i}
                className="flex items-center gap-3 bg-card border border-border rounded-2xl px-3 py-2"
              >
                <span
                  className="w-6 h-6 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: info?.hex || '#999' }}
                />
                <span className="text-sm font-medium capitalize flex-1">
                  {info?.label || v.kleur}
                </span>

                {v.foto_url ? (
                  <img src={v.foto_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : null}

                <button
                  type="button"
                  onClick={() => inputRefs.current[i]?.click()}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1.5 rounded-full hover:bg-accent transition"
                >
                  {uploadingIndex === i ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ImagePlus className="w-3.5 h-3.5" strokeWidth={1.75} />
                  )}
                  {v.foto_url ? 'Wijzig' : 'Foto'}
                </button>
                <input
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadFoto(i, e.target.files[0])}
                />

                <button
                  type="button"
                  onClick={() => verwijder(i)}
                  className="w-7 h-7 rounded-full hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition"
                  aria-label="Verwijder kleur"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}