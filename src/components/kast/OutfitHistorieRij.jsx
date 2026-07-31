import React, { useState } from 'react';
import { Star, Pencil, MessageSquarePlus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import FeedbackEditor from './FeedbackEditor';

function Sterren({ rating }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={
            n <= rating
              ? 'w-3 h-3 fill-foreground text-foreground'
              : 'w-3 h-3 text-muted-foreground/40'
          }
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

export default function OutfitHistorieRij({ outfit, kledingstukken }) {
  const [editing, setEditing] = useState(false);
  const ids = (outfit.kledingstuk_ids || '').split(',').filter(Boolean);
  const items = ids
    .map((id) => kledingstukken.find((k) => k.id === id))
    .filter(Boolean);

  const heeftFeedback = Boolean(outfit.feedback_tekst || outfit.rating);

  const datumLabel = outfit.datum
    ? format(parseISO(outfit.datum), 'EEEE d MMM', { locale: nl })
    : '';

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground capitalize">
            {datumLabel}
          </p>
          {outfit.activiteit_beschrijving && (
            <p className="text-sm text-foreground mt-1 line-clamp-2">
              {outfit.activiteit_beschrijving}
            </p>
          )}
        </div>
        <Sterren rating={outfit.rating} />
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5">
          {items.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="aspect-square rounded-lg overflow-hidden bg-muted"
            >
              {item.foto_url && (
                <img
                  src={item.foto_url}
                  alt={item.beschrijving}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {outfit.feedback_tekst && !editing && (
        <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-3">
          "{outfit.feedback_tekst}"
        </p>
      )}

      {!editing && (
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition"
        >
          {heeftFeedback ? (
            <>
              <Pencil className="w-3 h-3" strokeWidth={1.75} />
              Feedback aanpassen
            </>
          ) : (
            <>
              <MessageSquarePlus className="w-3 h-3" strokeWidth={1.75} />
              Feedback toevoegen
            </>
          )}
        </button>
      )}

      {editing && <FeedbackEditor outfit={outfit} onDone={() => setEditing(false)} />}
    </div>
  );
}