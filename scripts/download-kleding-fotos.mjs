#!/usr/bin/env node
/**
 * Downloadt alle kledingfoto's uit Base44 naar public/kleding/.
 *
 * Elke foto krijgt de code van het kledingstuk als bestandsnaam (SZK4.jpg), zodat
 * je in de app en in de map direct ziet welk kledingstuk het is. Afwijkende
 * kleurvarianten krijgen <CODE>__<VARIANTCODE>.jpg.
 *
 * De lijst met kledingstukken en bron-URL's staat in public/kleding/kleding-manifest.json.
 *
 *   node scripts/download-kleding-fotos.mjs                # verkleind (aanrader)
 *   node scripts/download-kleding-fotos.mjs --origineel    # originele foto's (~4 MB per stuk)
 *   node scripts/download-kleding-fotos.mjs --opnieuw      # bestaande bestanden overschrijven
 *   node scripts/download-kleding-fotos.mjs --breedte 2000 # andere maximale lange zijde
 *
 * Verkleinen gebeurt met sharp (npm i -D sharp) of met ImageMagick als dat
 * geïnstalleerd is. Is geen van beide aanwezig, dan worden de originelen bewaard.
 */

import { spawnSync } from 'node:child_process';
import { mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const wortel = join(dirname(fileURLToPath(import.meta.url)), '..');
const doelMap = join(wortel, 'public', 'kleding');
const manifestPad = join(doelMap, 'kleding-manifest.json');

const args = process.argv.slice(2);
const heeftVlag = (naam) => args.includes(naam);
const vlagWaarde = (naam, standaard) => {
  const i = args.indexOf(naam);
  return i !== -1 && args[i + 1] ? Number(args[i + 1]) : standaard;
};

const opties = {
  verklein: !heeftVlag('--origineel'),
  opnieuw: heeftVlag('--opnieuw'),
  maxBreedte: vlagWaarde('--breedte', 1400),
  kwaliteit: vlagWaarde('--kwaliteit', 82),
  gelijktijdig: vlagWaarde('--parallel', 4),
};

/** sharp als het geïnstalleerd is, anders ImageMagick, anders niets. */
async function kiesVerkleiner() {
  if (!opties.verklein) return null;

  try {
    const { default: sharp } = await import('sharp');
    return async (bron, doel) => {
      await sharp(bron)
        .rotate()
        .resize({ width: opties.maxBreedte, height: opties.maxBreedte, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: opties.kwaliteit, mozjpeg: true })
        .toFile(doel);
    };
  } catch {
    // sharp niet geïnstalleerd — probeer ImageMagick.
  }

  for (const bin of ['magick', 'convert']) {
    if (spawnSync(bin, ['-version'], { stdio: 'ignore' }).status === 0) {
      return async (bron, doel) => {
        const res = spawnSync(
          bin,
          [bron, '-auto-orient', '-resize', `${opties.maxBreedte}x${opties.maxBreedte}>`, '-quality', String(opties.kwaliteit), doel],
          { stdio: 'inherit' },
        );
        if (res.status !== 0) throw new Error(`${bin} gaf exitcode ${res.status}`);
      };
    }
  }

  console.warn(
    '! Geen sharp of ImageMagick gevonden — de originele foto\'s (~4 MB per stuk) worden bewaard.\n' +
      '  Installeer sharp met `npm i -D sharp` voor kleinere bestanden in git.',
  );
  return null;
}

async function bestaat(pad) {
  try {
    await stat(pad);
    return true;
  } catch {
    return false;
  }
}

async function haalOp(url, pogingen = 4) {
  for (let poging = 1; ; poging += 1) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const type = res.headers.get('content-type') || '';
      if (!type.startsWith('image/')) throw new Error(`onverwacht content-type "${type}"`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (poging >= pogingen) throw err;
      await new Promise((r) => setTimeout(r, 2 ** poging * 1000));
    }
  }
}

async function verwerk(taak, verklein) {
  const doel = join(doelMap, taak.bestand);
  if (!opties.opnieuw && (await bestaat(doel))) return { status: 'overgeslagen', bestand: taak.bestand };

  const data = await haalOp(taak.bron_url);
  const tijdelijk = `${doel}.download`;
  await writeFile(tijdelijk, data);

  if (verklein) {
    try {
      await verklein(tijdelijk, doel);
      await unlink(tijdelijk);
    } catch (err) {
      console.warn(`! Verkleinen van ${taak.bestand} mislukt (${err.message}) — origineel bewaard.`);
      await rename(tijdelijk, doel);
    }
  } else {
    await rename(tijdelijk, doel);
  }

  const { size } = await stat(doel);
  return { status: 'gedownload', bestand: taak.bestand, kb: Math.round(size / 1024) };
}

async function main() {
  const manifest = JSON.parse(await readFile(manifestPad, 'utf8'));
  await mkdir(doelMap, { recursive: true });

  const taken = manifest.kledingstukken.flatMap((k) => [
    { bestand: k.bestand, bron_url: k.bron_url, code: k.code },
    ...k.varianten.map((v) => ({ bestand: v.bestand, bron_url: v.bron_url, code: `${k.code}/${v.code}` })),
  ]);

  const verklein = await kiesVerkleiner();
  console.log(`${taken.length} afbeeldingen, doelmap public/kleding/${verklein ? `, verkleind naar max ${opties.maxBreedte}px` : ''}`);

  const mislukt = [];
  let gedownload = 0;
  let overgeslagen = 0;
  let volgende = 0;

  const werker = async () => {
    while (volgende < taken.length) {
      const taak = taken[volgende++];
      try {
        const res = await verwerk(taak, verklein);
        if (res.status === 'overgeslagen') {
          overgeslagen += 1;
        } else {
          gedownload += 1;
          console.log(`  ✓ ${res.bestand} (${res.kb} kB)`);
        }
      } catch (err) {
        mislukt.push({ bestand: taak.bestand, fout: err.message });
        console.error(`  ✗ ${taak.bestand}: ${err.message}`);
      }
    }
  };

  await Promise.all(Array.from({ length: Math.max(1, opties.gelijktijdig) }, werker));

  console.log(`\nKlaar: ${gedownload} gedownload, ${overgeslagen} overgeslagen, ${mislukt.length} mislukt.`);
  if (mislukt.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
