import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { leesVarianten } from '@/lib/varianten';
import KleurBolletjes from './KleurBolletjes';
import GeenFotoPlaceholder from './GeenFotoPlaceholder';

const dikteLabel = {
  dun: 'Dun',
  normaal: 'Normaal',
  dik: 'Dik',
};

export default function KledingstukKaart({ item, prioriteit = false }) {
  const varianten = leesVarianten(item);
  const [actief, setActief] = useState(0);
  const variant = varianten[actief] || varianten[0];

  return (
    <Link to={`/kledingstuk/${item.id}`} className="group block space-y-2">
      <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-muted relative">
        {variant?.foto_url ? (
          <img
            src={variant.foto_url}
            alt={item.beschrijving}
            loading={prioriteit ? 'eager' : 'lazy'}
            decoding="async"
            fetchpriority={prioriteit ? 'high' : 'low'}
            width="400"
            height="500"
            className="w-full h-full object-cover group-active:scale-[0.98] transition-transform duration-200"
          />
        ) : (
          <GeenFotoPlaceholder />
        )}
        {variant?.code && (
          <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium tracking-wider px-2 py-1 rounded-full">
            {variant.code}
          </span>
        )}
      </div>
      <div className="px-1">
        <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
          {item.beschrijving}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {item.dikte && (
            <p className="text-[11px] text-muted-foreground">
              {dikteLabel[item.dikte] || item.dikte}
            </p>
          )}
          {varianten.length > 1 && (
            <>
              {item.dikte && <span className="text-[11px] text-muted-foreground">·</span>}
              <KleurBolletjes
                varianten={varianten}
                actieveIndex={actief}
                onSelect={setActief}
                size="sm"
              />
            </>
          )}
        </div>
      </div>
    </Link>
  );
}