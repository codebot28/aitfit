import { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';

const BUCKET = 'kleding';
const cache = new Map();

/**
 * Zet een opgeslagen pad om naar een tijdelijke, ondertekende URL.
 * Oude volledige URL's (http...) worden ongewijzigd teruggegeven,
 * zodat bestaande data blijft werken.
 */
export async function fotoUrl(pad) {
  if (!pad) return null;
  if (pad.startsWith('http')) return pad;

  const bewaard = cache.get(pad);
  if (bewaard && bewaard.tot > Date.now()) return bewaard.url;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(pad, 3600);

  if (error) return null;
  cache.set(pad, { url: data.signedUrl, tot: Date.now() + 3300 * 1000 });
  return data.signedUrl;
}

/** Vervangt <img src={foto_url}> — zelfde props, laadt de link zelf. */
export function KledingFoto({ pad, alt = '', className = '', ...rest }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    let actief = true;
    fotoUrl(pad).then((u) => { if (actief) setSrc(u); });
    return () => { actief = false; };
  }, [pad]);

  if (!src) return <div className={className} aria-hidden="true" />;
  return <img src={src} alt={alt} className={className} {...rest} />;
}
