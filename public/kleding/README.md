# Kledingfoto's

Alle foto's van de kledingstukken uit de Base44-app **Outfit AI**, met de code van
het kledingstuk als bestandsnaam. 65 kledingstukken,
75 afbeeldingen.

| | |
|---|---|
| Hoofdfoto | `<CODE>.jpg` — bijvoorbeeld `SZK4.jpg` |
| Kleurvariant met eigen foto | `<CODE>__<VARIANTCODE>.jpg` — bijvoorbeeld `SR1__SWK2.jpg` |
| In de app bereikbaar op | `/kleding/<CODE>.jpg` (Vite kopieert `public/` naar `dist/`) |
| Metadata per code | [`kleding-manifest.json`](kleding-manifest.json) |

## Foto's ophalen

```bash
npm run kleding:fotos             # verkleind naar max 1400px (aanrader voor git)
npm run kleding:fotos -- --origineel   # originele foto's, ~4 MB per stuk
```

Het script leest `kleding-manifest.json`, slaat bestanden over die er al staan
en heeft `sharp` (`npm i -D sharp`) of ImageMagick nodig om te verkleinen.
Daarna wijst de database nog naar Base44; met
[`../../outfits/kleding-fotos-lokaal.sql`](../../outfits/kleding-fotos-lokaal.sql)
zet je `foto_url` en de variantfoto's om naar `/kleding/<CODE>.jpg`.

## Overzicht

### Bovenkleding (43)

| Code | Bestand | Omschrijving | Dikte | Seizoen | Varianten |
|---|---|---|---|---|---|
| `OVB1` | `OVB1.jpg` | donkerblauwe gebreide trui met ronde hals | dun | lente, herfst | — |
| `OVB2` | `OVB2.jpg` | donkerblauwe effen hoodie met kangoeroe zak | normaal | lente, herfst | — |
| `OVB3` | `OVB3.jpg` | donkerblauwe hoodie met opschrift | normaal | lente, herfst | — |
| `OVB4` | `OVB4.jpg` | donkerblauwe gebreide sweater ronde hals | normaal | lente, herfst | — |
| `OVB5` | `OVB5.jpg` | Blauwe sweater met knoopkraag | normaal | lente, herfst, winter | — |
| `OVB6` | `OVB6.jpg` | zwarte hoodie met blauwe opdruk | dik | herfst, winter | — |
| `OVB7` | `OVB7.jpg` | Donkerblauwe waffle-knit longsleeve trui | dun | lente, herfst | — |
| `OVB8` | `OVB8.jpg` | donkerblauwe vest met rits | normaal | lente, herfst | — |
| `OVGR1` | `OVGR1.jpg` | donkergroene trui met ronde hals | dun | lente, herfst | — |
| `OVGR2` | `OVGR2.jpg` | Donkergroene colbert met knopen | normaal | lente, herfst, winter | — |
| `OVGR3` | `OVGR3.jpg` | donkergroene gilet met knopen | normaal | lente, herfst | — |
| `OVGR4` | `OVGR4.jpg` | donkergroene sweater met ronde hals | dun | lente, herfst | — |
| `OVGR5` | `OVGR5.jpg` | donkergroene gebreide trui met ronde hals | dun | lente, herfst | — |
| `OVGR6` | `OVGR6.jpg` | donkergroene effen sweater met v-hals | dun | lente, herfst | — |
| `OVR1` | `OVR1.jpg` | bordeauxrode effen gebreide trui | dun | lente, herfst | — |
| `OVR2` | `OVR2.jpg` | Bordeauxrode effen turtleneck trui | dun | lente, herfst | — |
| `OVZ1` | `OVZ1.jpg` | zwart colbert met lange mouwen | normaal | lente, herfst, winter | — |
| `OVZ2` | `OVZ2.jpg` | Zwarte trui met kwart-zip sluiting | normaal | lente, herfst, winter | `OVZ2__OVGR5.jpg` |
| `SB1` | `SB1.jpg` | Donkerblauwe geribde polo korte mouwen | normaal | lente, zomer | — |
| `SB2` | `SB2.jpg` | blauw tweekleurig t-shirt korte mouwen | normaal | lente, zomer | — |
| `SBK1` | `SBK1.jpg` | blauw t-shirt met papegaaienprint | dun | lente, zomer | — |
| `SBK2` | `SBK2.jpg` | blauw t-shirt met korte mouwen | dun | lente, zomer | — |
| `SBL1` | `SBL1.jpg` | Blauwe blouse met hond hotdog print | dun | lente, zomer | — |
| `SGK1` | `SGK1.jpg` | donkergrijs t-shirt met borstzakje | normaal | lente, zomer | — |
| `SGR1` | `SGR1.jpg` | donkergroene polo met korte mouwen | normaal | lente, zomer | — |
| `SGRK1` | `SGRK1.jpg` | groene polo met korte mouwen | dun | lente, zomer | — |
| `SGRK2` | `SGRK2.jpg` | groen t-shirt met korte mouwen | dun | lente, zomer | `SGRK2__SBK3.jpg`<br>`SGRK2__SGK1.jpg`<br>`SGRK2__SZK3.jpg` |
| `SR1` | `SR1.jpg` | bordeauxrood t-shirt met korte mouwen | normaal | lente, zomer | `SR1__SBK3.jpg`<br>`SR1__SZK3.jpg`<br>`SR1__SGRK3.jpg`<br>`SR1__SWK2.jpg` |
| `SW1` | `SW1.jpg` | wit overhemd met lange mouwen | dun | lente, zomer | — |
| `SWK1` | `SWK1.jpg` | witte polo met subtiele strepen | dun | lente, zomer | — |
| `SWK2` | `SWK2.jpg` | Wit Hawaiiaanse blouse  met tropisch print | dun | lente, zomer | — |
| `SWL1` | `SWL1.jpg` | wit overhemd met Hawaii print | dun | lente, zomer | — |
| `SWL2` | `SWL2.jpg` | Wit overhemd met lange mouwen en autootjes in de kraag | normaal | lente, zomer, herfst, winter | — |
| `SWL3` | `SWL3.jpg` | Wit overhemd met lange mouwen en blauw patroon in de kraag | normaal | lente, zomer, herfst | — |
| `SWL4` | `SWL4.jpg` | Wit overhemd met lange mouwen (zacht) | normaal | lente, zomer, herfst | — |
| `SZ1` | `SZ1.jpg` | zwarte blouse met korte mouwen | dun | lente, zomer | — |
| `SZ2` | `SZ2.jpg` | Zwarte geribbelde polo met korte mouwen | dun | lente, zomer | — |
| `SZ3` | `SZ3.jpg` | Zwarte polo met korte mouwen | dun | lente, zomer | — |
| `SZ4` | `SZ4.jpg` | Zwarte blouse met bananenprint | dun | lente, zomer | — |
| `SZK1` | `SZK1.jpg` | zwart t-shirt met korte mouwen | dun | lente, zomer | — |
| `SZK2` | `SZK2.jpg` | zwarte polo met korte mouwen | normaal | lente, zomer | — |
| `SZK3` | `SZK3.jpg` | zwarte polo met korte mouwen | normaal | lente, zomer | — |
| `SZK4` | `SZK4.jpg` | Zwarte polo met korte mouwen en kleine gaten | dun | lente, zomer | — |

### Onderkleding (11)

| Code | Bestand | Omschrijving | Dikte | Seizoen | Varianten |
|---|---|---|---|---|---|
| `BBK1` | `BBK1.jpg` | donkerblauwe korte joggingbroek met trekkoord | normaal | lente, zomer | `BBK1__BWK1.jpg` |
| `BBL1` | `BBL1.jpg` | lichtblauwe jeans met washed effect | normaal | lente, zomer, herfst, winter | — |
| `BBL2` | `BBL2.jpg` | Donkerblauwe lange spijkerbroek met streepjes | normaal | lente, zomer, herfst, winter | — |
| `BGR1` | `BGR1.jpg` | donkergroene rechte pantalon | normaal | lente, herfst, winter | — |
| `BWL1` | `BWL1.jpg` | Witte lange chino broek | dun | lente, zomer | `BWL1__BBL2.jpg` |
| `BZ1` | `BZ1.jpg` | Zwarte effen pantalon | normaal | lente, zomer, herfst, winter | — |
| `BZ2` | `BZ2.jpg` | zwarte joggingbroek met witte trekkoord | dik | lente, herfst | — |
| `BZK1` | `BZK1.jpg` | Zwarte shorts effen zonder patroon katoen | normaal | lente, zomer | — |
| `BZK2` | `BZK2.jpg` | zwarte korte joggingbroek met trekkoord | normaal | lente, zomer | — |
| `BZL1` | `BZL1.jpg` | zwarte pantalon effen stof | normaal | lente, herfst, winter | — |
| `BZL2` | `BZL2.jpg` | Zwarte lange linnen broek met touwtje | dun | lente, zomer | — |

### Jassen (3)

| Code | Bestand | Omschrijving | Dikte | Seizoen | Varianten |
|---|---|---|---|---|---|
| `JB1` | `JB1.jpg` | donkerblauwe gewatteerde jas met capuchon | dik | herfst, winter | — |
| `JZ1` | `JZ1.jpg` | zwarte lange overjas met knopen | dik | herfst, winter | — |
| `JZ2` | `JZ2.jpg` | zwarte gewatteerde jas met rits | normaal | herfst, winter | — |

### Schoeisel (5)

| Code | Bestand | Omschrijving | Dikte | Seizoen | Varianten |
|---|---|---|---|---|---|
| `SCB1` | `SCB1.jpg` | donkerblauwe en witte leren sneakers | normaal | lente, zomer, herfst | — |
| `SCB2` | `SCB2.jpg` | donkerblauwe canvas sneakers met veters (net) | normaal | lente, zomer, herfst | — |
| `SCW1` | `SCW1.jpg` | wit-zwarte leren sneakers met veters | normaal | lente, zomer, herfst | — |
| `SCZ1` | `SCZ1.jpg` | zwarte sneakers met witte zool (sport) | normaal | lente, zomer, herfst, winter | — |
| `SCZ2` | `SCZ2.jpg` | zwarte hoge wandelschoenen met veters (klus schoenen) | normaal | lente, zomer, herfst, winter | — |

### Accessoires (3)

| Code | Bestand | Omschrijving | Dikte | Seizoen | Varianten |
|---|---|---|---|---|---|
| `RB1` | `RB1.jpg` | donkerblauwe gevlochten riem met leren details | normaal | lente, zomer, herfst, winter | — |
| `RBR1` | `RBR1.jpg` | donkerbruine gevlochten riem met leren details | normaal | lente, zomer, herfst, winter | — |
| `RZ1` | `RZ1.jpg` | zwarte leren riem met zilveren gesp | normaal | lente, zomer, herfst, winter | — |
