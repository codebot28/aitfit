import React from 'react';
import { cn } from '@/lib/utils';
import { getKleurInfo } from '@/lib/varianten';

// Toont een rij kleurbolletjes voor varianten. Klik wisselt actieve variant.
// props:
//  varianten: [{ kleur, code, foto_url }]
//  actieveIndex: number
//  onSelect: (index) => void
//  size: 'sm' | 'md'
export default function KleurBolletjes({ varianten, actieveIndex, onSelect, size = 'sm' }) {
  if (!varianten || varianten.length <= 1) return null;

  const dot = size === 'md' ? 'w-6 h-6' : 'w-4 h-4';
  const ring = size === 'md' ? 'ring-2' : 'ring-2';

  return (
    <div className={cn('flex items-center gap-1.5', size === 'md' && 'gap-2')}>
      {varianten.map((v, i) => {
        const info = getKleurInfo(v.kleur);
        const hex = info?.hex || '#999';
        const active = i === actieveIndex;
        return (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect?.(i);
            }}
            className={cn(
              dot,
              'rounded-full border border-black/10 transition-all',
              active && `${ring} ring-foreground ring-offset-1 ring-offset-background`,
              !active && 'opacity-80 hover:opacity-100'
            )}
            style={{ backgroundColor: hex }}
            aria-label={info?.label || v.kleur || 'kleur'}
            title={info?.label || v.kleur}
          />
        );
      })}
    </div>
  );
}