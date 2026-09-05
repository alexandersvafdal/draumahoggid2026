# Draumahöggið 2026

Lifandi stigatafla fyrir Draumahöggið – hver keppandi fær **eitt högg** á par 3 holu.
Sá sem er næst holu leiðir; hola í höggi tekur allt.

Kyrrstæð vefsíða (HTML/CSS/JS, engir pakkar, ekkert byggingarskref). Þemað fylgir vef
Einherjaklúbbsins: Poppins, grænt `#0a5e34`, gullnir hápunktar, hvít spjöld með 16px hornum.

## Skrár

| Skrá | Hlutverk |
| --- | --- |
| `index.html` | Stigataflan – uppfærist sjálfkrafa |
| `skra.html` | Skráningarform fyrir ritara, býr til `keppni.json` |
| `config.js` | Gagnaslóð, uppfærslutíðni, merki, meta fyrir CSV |
| `data/keppni.json` | Gögn keppninnar (**tómt – bættu keppendum við**) |
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
    "hola": 9, "par": 3, "lengd_m": 132,
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

Staða keppanda ræðst af reitunum:

- `hio: true` → **hola í höggi**, deilir 1. sæti og kveikir gullna borðann efst.
- `fjarlaegd` (metrar, tala) → raðast í vaxandi röð.
- `ogilt: true` → högg tekið en telst ekki (vatn, út fyrir völl); birtist neðst án sætis.
- hvorugt → keppandinn hefur ekki slegið og birtist undir **Á teig**.

Jafntefli á sömu fjarlægð deila sæti.

## Að uppfæra stöðuna meðan á keppni stendur

**Leið A – skráningarformið (einfaldast).** Opnaðu `skra.html`:

1. **☰ Líma inn nafnalista** – límdu keppendur inn, eitt nafn í línu (`Nafn, Klúbbur`), til að byggja upp ráslistann.
2. Sláðu inn fjarlægðir jafnóðum meðan keppnin stendur yfir. Tími fyllist sjálfkrafa við fyrstu skráningu.
3. **⬇ Sækja keppni.json**, settu skrána yfir `data/keppni.json`, committaðu og pushaðu.

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

Workflow-ið `.github/workflows/pages.yml` birtir rótina við hvert push á `main`.
Kveiktu einu sinni á Pages: **Settings → Pages → Source: GitHub Actions**.
Síðan verður á `https://alexandersvafdal.github.io/draumahoggid2026/`.

## Merki

`config.js` vísar sjálfgefið á merki Einherjaklúbbsins á golf.is. Settu `merki: ""` til að fela það,
eða settu eigin mynd í `assets/` og vísaðu á hana.
