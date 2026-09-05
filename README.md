# Draumahöggið 2026

Lifandi stigatafla fyrir Draumahöggið – hver keppandi fær **eitt högg** á par 3 holu.
Mældar fjarlægðir frá holu raðast í vaxandi röð; hola í höggi fer efst.

Kyrrstæð vefsíða (HTML/CSS/JS, engir pakkar, ekkert byggingarskref). Þemað fylgir vef
Einherjaklúbbsins: Poppins, grænt `#0a5e34`, gullnir hápunktar, hvít spjöld með 16px hornum.

## Skrár

| Skrá | Hlutverk |
| --- | --- |
| `index.html` | Stigataflan – uppfærist sjálfkrafa |
| `skra.html` | Skráningarform fyrir ritara – **ekki birt á vefnum**, keyrist staðbundið |
| `config.js` | Gagnaslóð, uppfærslutíðni, merki, meta fyrir CSV |
| `data/stada.json` | **Birt gögn** – lýsigögn og eingöngu mældir keppendur |
| `local/raslisti.json` | Ráslistinn (247 nöfn) – **utan git**, fer hvorki á GitHub né vefinn |
| `assets/qr.svg`, `assets/qr.png` | QR-kóði á vefslóð stigatöflunnar |
| `assets/style.css`, `assets/app.js` | Útlit og rökfræði |

## Keyra staðbundið

```bash
python3 -m http.server 8080
```

Opnaðu svo `http://localhost:8080/`. (`file://` virkar ekki – `fetch` á JSON krefst vefþjóns.)

## Gagnasnið

```json
{
  "meta": {
    "titill": "Draumahöggið 2026",
    "undirtitill": "Eitt högg. Eitt tækifæri.",
    "vollur": "Nesvöllur, Seltjarnarnesi",
    "hola": 9, "par": 3, "lengd_m": 103,
    "dagsetning": "2026-09-05",
    "verdlaun": "Bíll frá styrktaraðila fyrir holu í höggi",
    "stada": "Í gangi",
    "uppfaert": "2026-06-13T14:12:00+00:00"
  },
  "keppendur": [
    { "nr": 1, "nafn": "Anna Kristín Jónsdóttir", "klubbur": "GR", "fjarlaegd": 2.14, "timi": "10:04" },
    { "nr": 2, "nafn": "Jón Jónsson", "klubbur": "GK", "hio": true, "timi": "10:11" },
    { "nr": 3, "nafn": "Gunnar Máni", "klubbur": "GO", "ogilt": true, "athugasemd": "Út fyrir völl" },
    { "nr": 4, "nafn": "Aldís Fanney", "klubbur": "GKG" }
  ]
}
```

`nr` er **röð á teig** úr ráslistanum. Keppendur án dreginnar raðar eru merktir `varamadur: true`
og fá númer 112 og upp úr. `fjoldi_hio` er fjöldi holna í höggi á ferlinum, úr upprunalega Excel-skjalinu.

Staða keppanda ræðst af reitunum:

- `hio: true` → **hola í höggi**, deilir 1. sæti og kveikir gullna borðann efst.
- `fjarlaegd` (metrar, tala) → raðast í vaxandi röð.
- `ogilt: true` → högg tekið en telst ekki (vatn, út fyrir völl); birtist neðst án sætis.
- `flot: true` → hitti flötina en var ekki mældur; birtist í **Hittu flötina** en ekki í stöðunni.
  Mæling setur `flot` sjálfkrafa.
- ekkert af þessu → keppandinn birtist **hvergi** á vefnum.

Jafntefli á sömu fjarlægð deila sæti.

### Ráslistinn er hvorki birtur né aðgengilegur

Þrjár aðskildar varnir:

1. **Stigataflan** sýnir aðeins keppendur sem eru mældir eða hittu flötina. Enginn ráslisti,
   engin heildartala keppenda, og klúbbasían telur eingöngu þá sem birtast.
2. **Birt gögn** (`data/stada.json`) innihalda eingöngu mælda keppendur og þá sem hittu flötina. Ráslistinn er í
   `local/raslisti.json` sem er í `.gitignore` og fer því aldrei í repo-ið.
3. **GitHub Pages** birtir aðeins `index.html`, `assets/`, `config.js` og `data/stada.json`.
   `skra.html` er ekki birt, og workflow-ið stöðvar birtingu ef ráslisti kemst inn í möppuna.

Skráningarsíðan keyrist því aðeins staðbundið (`python3 -m http.server`) og er hvergi til á vefslóð.

## Að uppfæra stöðuna meðan á keppni stendur

**Leið A – skráningarformið (einfaldast).** Opnaðu `skra.html`:

1. Notaðu **síureitinn** til að finna keppanda (nafn, klúbbur eða númer) – listinn er 247 nöfn.
2. Sláðu inn fjarlægð í metrum. Tími fyllist sjálfkrafa við fyrstu skráningu.
3. **⬇ Sækja stada.json (birt)** → settu yfir `data/stada.json`, committaðu og pushaðu.
   Sú skrá inniheldur eingöngu mælda keppendur.
4. **⬇ Sækja raslisti.json (einka)** → settu yfir `local/raslisti.json` til að geyma vinnuna
   þína. Sú skrá fer aldrei í git.

**☰ Líma inn nafnalista** bætir við eða skiptir út öllum keppendum (eitt nafn í línu, `Nafn, Klúbbur`).

Allir opnir vafrar taka breytinguna upp innan `uppfaerslutidni` (sjálfgefið 15 sek.) án þess að endurhlaða þurfi.
Breytingar í forminu geymast í `localStorage` þar til þú sækir skrána – lokaður flipi tapar þeim ekki.

**Leið B – Google Sheets (uppfærist án commit).** Í Google Sheets: `Skrá → Deila → Birta á vefnum → CSV`.
Settu slóðina í `config.js`:

```js
gagnaslod: "https://docs.google.com/spreadsheets/d/XXXX/pub?gid=0&single=true&output=csv",
```

Dálkar í fyrstu línu: `nr, nafn, klubbur, fjarlaegd, hio, timi, ogilt, athugasemd`.
`hio`/`ogilt` taka `1`, `já`, `x` eða `true`. Í þessari leið kemur `meta` úr `config.js`.

Athugið: Google birtir uppfærslur á CSV með nokkurra mínútna töf.

## Birting á GitHub Pages

Workflow-ið `.github/workflows/pages.yml` setur saman birtingarmöppu úr `index.html`,
`assets/`, `config.js` og `data/stada.json` við hvert push á `main` – ekkert annað fer á vefinn.
Kveiktu einu sinni á Pages: **Settings → Pages → Source: GitHub Actions**.
Síðan verður á `https://alexandersvafdal.github.io/draumahoggid2026/`.

## Merki

`config.js` vísar sjálfgefið á merki Einherjaklúbbsins á golf.is. Settu `merki: ""` til að fela það,
eða settu eigin mynd í `assets/` og vísaðu á hana.

## QR-kóði

`assets/qr.svg` (vektor, fyrir prentun) og `assets/qr.png` (588×588 px) vísa á
`https://alexandersvafdal.github.io/draumahoggid2026/`. Útgáfa 6, villuleiðréttingarstig H
(þolir 30% skemmd) – óhætt að prenta á skilti úti á velli.
