// Centrale helpers voor kleur-varianten van een kledingstuk.
// Een item heeft optioneel meerdere varianten (één per kleur).
// Varianten worden in item.profiel JSON onder "varianten" opgeslagen,
// zodat we het entity-schema niet hoeven aan te passen.
//
// Variant-shape: { kleur: 'blauw', code: 'SBL1', foto_url: '' | null }

import { parseCode, KLEUR_OPTIES } from './kledingstuk-code';

export function getKleurInfo(kleurKey) {
  return KLEUR_OPTIES.find((k) => k.key === kleurKey) || null;
}

// Lees varianten uit een item. Als er nog geen varianten zijn,
// genereer een hoofdvariant uit de bestaande velden.
export function leesVarianten(item) {
  if (!item) return [];
  let profiel = {};
  if (item.profiel) {
    try { profiel = JSON.parse(item.profiel); } catch { profiel = {}; }
  }
  if (Array.isArray(profiel.varianten) && profiel.varianten.length > 0) {
    return profiel.varianten;
  }
  // Fallback: maak één variant uit de huidige code + foto
  const parsed = parseCode(item.code);
  return [{
    kleur: parsed.kleur || null,
    code: item.code || '',
    foto_url: item.foto_url || '',
  }];
}

export function schrijfVarianten(item, varianten) {
  let profiel = {};
  if (item.profiel) {
    try { profiel = JSON.parse(item.profiel); } catch { profiel = {}; }
  }
  profiel.varianten = varianten;
  return JSON.stringify(profiel);
}