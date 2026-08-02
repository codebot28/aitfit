import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';
import { leesVarianten, getKleurInfo } from '@/lib/varianten';
import GeenFotoPlaceholder from '@/components/kast/GeenFotoPlaceholder';

export default function OutfitResultaat({ result, gekozenItems }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-3xl overflow-hidden"
    >
      <div className="bg-primary text-primary-foreground px-5 py-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4" strokeWidth={2} />
        <p className="text-xs uppercase tracking-[0.2em] font-medium">Jouw outfit</p>
      </div>

      {gekozenItems.length > 0 && (
        <div className="grid grid-cols-2 gap-px bg-border">
          {gekozenItems.map((item) => {
            const variant = leesVarianten(item)[0];
            const kleurInfo = getKleurInfo(variant?.kleur);
            return (
              <div key={item.id} className="bg-card aspect-square overflow-hidden relative">
                {variant?.foto_url ? (
                  <img
                    src={variant.foto_url}
                    alt={item.beschrijving}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <GeenFotoPlaceholder />
                    {kleurInfo && (
                      <span
                        className="absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-white shadow-md"
                        style={{ backgroundColor: kleurInfo.hex }}
                        title={kleurInfo.label}
                      />
                    )}
                  </>
                )}
                {variant?.code && (
                  <Link
                    to={`/kledingstuk/${item.id}`}
                    className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium tracking-wider px-2 py-1 rounded-full hover:bg-black/90 transition"
                  >
                    {variant.code}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="p-5 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Items</p>
          <ul className="space-y-1.5">
            {(result.items || []).map((item, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2">
                <span className="text-muted-foreground">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Redenering</p>
          <p className="text-sm text-foreground leading-relaxed">{result.redenering}</p>
        </div>

        {result.tips && (
          <div className="bg-accent/50 rounded-2xl p-4 flex gap-3">
            <Lightbulb className="w-4 h-4 text-foreground shrink-0 mt-0.5" strokeWidth={1.75} />
            <p className="text-sm text-foreground leading-relaxed">{result.tips}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}