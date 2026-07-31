// Helpers om type, kleur en lengte uit een kledingstuk-code te halen.
// Codes hebben de vorm: [TYPE][KLEUR][LENGTE?][NUMMER]
// Bv: BZK1 = Broek Zwart Kort 1, SCW1 = Schoen Wit 1

const TYPES = [
  { prefix: 'OV', label: 'Overkleding', key: 'overkleding' },
  { prefix: 'SC', label: 'Schoen', key: 'schoen' },
  { prefix: 'B', label: 'Broek', key: 'broek' },
  { prefix: 'S', label: 'Shirt', key: 'shirt' },
  { prefix: 'J', label: 'Jas', key: 'jas' },
  { prefix: 'R', label: 'Riem', key: 'riem' },
  { prefix: 'A', label: 'Accessoire', key: 'accessoire' },
];

const KLEUREN = [
  { code: 'BR', label: 'Bruin', key: 'bruin', hex: '#7B4A2A' },
  { code: 'BE', label: 'Beige', key: 'beige', hex: '#D6BFA0' },
  { code: 'GR', label: 'Groen', key: 'groen', hex: '#3E6B4A' },
  { code: 'PA', label: 'Paars', key: 'paars', hex: '#6E4A8A' },
  { code: 'Z', label: 'Zwart', key: 'zwart', hex: '#1A1A1A' },
  { code: 'W', label: 'Wit', key: 'wit', hex: '#F4F1EC' },
  { code: 'G', label: 'Grijs', key: 'grijs', hex: '#8C8780' },
  { code: 'B', label: 'Blauw', key: 'blauw', hex: '#3A5A8C' },
  { code: 'R', label: 'Rood', key: 'rood', hex: '#A83232' },
  { code: 'Y', label: 'Geel', key: 'geel', hex: '#E0B83A' },
  { code: 'O', label: 'Oranje', key: 'oranje', hex: '#D97B2B' },
  { code: 'P', label: 'Roze', key: 'roze', hex: '#D98AA8' },
];

export const TYPE_OPTIES = TYPES.map(({ key, label }) => ({ key, label }));
export const KLEUR_OPTIES = KLEUREN.map(({ key, label, hex }) => ({ key, label, hex }));
export const LENGTE_OPTIES = [
  { key: 'kort', label: 'Kort', letter: 'K' },
  { key: 'lang', label: 'Lang', letter: 'L' },
];
export const TYPES_MET_LENGTE = ['broek', 'shirt'];

export function parseCode(code) {
  if (!code) return { type: null, kleur: null, lengte: null, nummer: null };

  let rest = code;
  let type = null;
  for (const t of TYPES) {
    if (rest.startsWith(t.prefix)) {
      type = t.key;
      rest = rest.slice(t.prefix.length);
      break;
    }
  }

  let kleur = null;
  for (const k of KLEUREN) {
    if (rest.startsWith(k.code)) {
      kleur = k.key;
      rest = rest.slice(k.code.length);
      break;
    }
  }

  let lengte = null;
  if (TYPES_MET_LENGTE.includes(type)) {
    if (rest.startsWith('K')) {
      lengte = 'kort';
      rest = rest.slice(1);
    } else if (rest.startsWith('L')) {
      lengte = 'lang';
      rest = rest.slice(1);
    }
  }

  const nummerMatch = rest.match(/^(\d+)/);
  const nummer = nummerMatch ? parseInt(nummerMatch[1], 10) : null;

  return { type, kleur, lengte, nummer };
}