// Helpers voor de lokale kledingfoto's in public/kleding/.
//
// De foto's zijn met scripts/download-kleding-fotos.mjs uit Base44 gehaald en
// hebben de code van het kledingstuk als bestandsnaam. Zo zie je zowel in de
// map als in de netwerk-tab meteen om welk kledingstuk het gaat:
//
//   public/kleding/SZK4.jpg        → hoofdfoto van SZK4
//   public/kleding/SR1__SWK2.jpg   → kleurvariant SWK2 van SR1
//
// Vite kopieert public/ ongewijzigd naar dist/, dus in de app zijn ze
// bereikbaar op /kleding/<CODE>.jpg.

export const KLEDING_FOTO_MAP = '/kleding';

/** Pad naar de lokale foto van een code, of van een kleurvariant daarvan. */
export function lokaleFotoPad(code, variantCode = null) {
  if (!code) return '';
  const hoofd = String(code).trim().toUpperCase();
  if (!hoofd) return '';
  const variant = variantCode ? String(variantCode).trim().toUpperCase() : '';
  const naam = variant && variant !== hoofd ? `${hoofd}__${variant}` : hoofd;
  return `${KLEDING_FOTO_MAP}/${naam}.jpg`;
}

/** Is dit al een pad naar een lokale kledingfoto? */
export function isLokaleFoto(url) {
  return typeof url === 'string' && url.startsWith(`${KLEDING_FOTO_MAP}/`);
}

/**
 * Bron voor een <img>: de opgeslagen foto_url als die er is, anders het lokale
 * pad dat bij de code hoort. Handig voor items waarvan de foto_url nog naar
 * Base44 wijst — draai outfits/kleding-fotos-lokaal.sql om dat structureel op
 * te lossen.
 */
export function kledingFotoBron(item, variant = null) {
  const opgeslagen = variant?.foto_url || item?.foto_url || '';
  if (opgeslagen) return opgeslagen;
  return lokaleFotoPad(item?.code, variant?.code);
}

/**
 * onError-handler voor een <img>: valt terug op de lokale foto als een
 * Base44-URL niet laadt (bijvoorbeeld in een homelab zonder internet).
 *
 *   <img src={bron} onError={fotoFallback(item, variant)} />
 */
export function fotoFallback(item, variant = null) {
  return (event) => {
    const terugval = lokaleFotoPad(item?.code, variant?.code);
    if (!terugval || event.currentTarget.dataset.terugval === 'gebruikt') return;
    event.currentTarget.dataset.terugval = 'gebruikt';
    event.currentTarget.src = terugval;
  };
}
