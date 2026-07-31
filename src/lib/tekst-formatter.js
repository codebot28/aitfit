// Zet de eerste letter van elke zin automatisch om naar een hoofdletter.
// Een "zin" begint bij het begin van de tekst of na . ! ? gevolgd door spatie(s)/nieuwe regel.
export function autoHoofdletter(tekst) {
  if (!tekst) return tekst;
  return tekst.replace(/(^|[.!?]\s+|\n+\s*)([a-zà-ÿ])/g, (_, prefix, letter) =>
    prefix + letter.toUpperCase()
  );
}