import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import StarRating from './StarRating';
import { autoHoofdletter } from '@/lib/tekst-formatter';

export default function FeedbackForm({ onSubmit, onCancel, isSaving, initialTekst = '', initialRating = 0 }) {
  const [tekst, setTekst] = useState(initialTekst);
  const [rating, setRating] = useState(initialRating);

  const canSubmit = rating > 0 && !isSaving;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-3xl p-5 space-y-5">
      
      <div>
        <p className="font-display text-xl text-foreground">Hoe was deze outfit?</p>
        <p className="text-sm text-muted-foreground mt-0.5">Jouw feedback helpt de AI te verbeteren.</p>
      </div>

      <div>
        <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">
          Beoordeling
        </label>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <div>
        <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">
          Feedback
        </label>
        <textarea
          value={tekst}
          onChange={(e) => setTekst(autoHoofdletter(e.target.value))}
          placeholder="Wat vond je goed of minder goed?"
          rows={3}
          className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 transition resize-none" />
        
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 bg-primary rounded-2xl py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
          
          Annuleren
        </button>
        <button
          onClick={() => onSubmit({ feedback_tekst: tekst, rating })}
          disabled={!canSubmit}
          className="flex-1 bg-card border border-border text-foreground rounded-2xl py-3 text-sm font-medium flex items-center justify-center gap-2 hover:bg-accent transition disabled:opacity-40">
          
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Opslaan'}
        </button>
      </div>
    </motion.div>);

}