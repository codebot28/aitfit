import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Check, X, Star } from 'lucide-react';
import { autoHoofdletter } from '@/lib/tekst-formatter';

export default function FeedbackEditor({ outfit, onDone }) {
  const queryClient = useQueryClient();
  const [tekst, setTekst] = useState(outfit.feedback_tekst || '');
  const [rating, setRating] = useState(outfit.rating || 0);
  const [saving, setSaving] = useState(false);

  const opslaan = async () => {
    if (!rating) return;
    setSaving(true);
    const nu = new Date().toISOString();

    await base44.entities.Outfit.update(outfit.id, {
      feedback_tekst: tekst.trim(),
      rating,
    });
    await base44.entities.Feedback.create({
      outfit_id: outfit.id,
      feedback_tekst: tekst.trim(),
      rating,
      aangemaakt_op: nu,
    });

    base44.functions
      .invoke('verwerkFeedback', {
        outfit_id: outfit.id,
        feedback_tekst: tekst.trim(),
        rating,
      })
      .catch(() => {});

    await queryClient.invalidateQueries({ queryKey: ['outfits-historie'] });
    setSaving(false);
    onDone?.();
  };

  return (
    <div className="space-y-3 pt-3 border-t border-border">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            className="p-0.5"
            type="button"
          >
            <Star
              className={
                n <= rating
                  ? 'w-5 h-5 fill-foreground text-foreground'
                  : 'w-5 h-5 text-muted-foreground/40'
              }
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
      <textarea
        value={tekst}
        onChange={(e) => setTekst(autoHoofdletter(e.target.value))}
        placeholder="Hoe beviel deze outfit?"
        rows={3}
        className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 transition resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={opslaan}
          disabled={saving || !rating}
          className="flex-1 bg-primary text-primary-foreground rounded-full py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={2} />}
          Opslaan
        </button>
        <button
          onClick={onDone}
          className="flex-1 bg-card border border-border rounded-full py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-accent transition"
        >
          <X className="w-4 h-4" strokeWidth={2} />
          Annuleren
        </button>
      </div>
    </div>
  );
}