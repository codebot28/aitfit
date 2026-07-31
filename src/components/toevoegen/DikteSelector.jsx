import React from 'react';
import { cn } from '@/lib/utils';

const opties = [
{ value: 'dun', label: 'Dun', hint: 'T-shirt, blouse' },
{ value: 'normaal', label: 'Normaal', hint: 'Trui, jeans' },
{ value: 'dik', label: 'Dik', hint: 'Jas, wol' }];


export default function DikteSelector({ value, onChange }) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3 block">
        Dikte
      </label>
      <div className="grid grid-cols-3 gap-2">
        {opties.map((optie) => {
          const active = value === optie.value;
          return (
            <button
              key={optie.value}
              onClick={() => onChange(optie.value)}
              className={cn(
                'rounded-2xl p-4 text-left border transition-all duration-200',
                active ?
                "bg-foreground border-foreground text-background shadow-md scale-[1.02]" :
                'bg-card border-border text-foreground hover:border-foreground/30'
              )}>
              
              <div className="font-medium text-sm">{optie.label}</div>
              <div className={cn('text-[11px] mt-0.5', active ? 'opacity-70' : 'text-muted-foreground')}>
                {optie.hint}
              </div>
            </button>);

        })}
      </div>
    </div>);

}