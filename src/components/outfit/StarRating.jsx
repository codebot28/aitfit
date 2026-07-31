import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StarRating({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= value;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="p-1 transition-transform active:scale-90"
          >
            <Star
              className={cn(
                'w-7 h-7 transition-colors',
                active ? 'fill-foreground text-foreground' : 'text-muted-foreground/40'
              )}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}