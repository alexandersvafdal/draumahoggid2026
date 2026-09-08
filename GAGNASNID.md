# Gagnasnið – Draumahöggið

Síðan les **eina JSON-skrá**. Sjálfgefin slóð er `data/stada.json`, stillt í `config.js`
(`gagnaslod`). Skráin er sótt með `cache: "no-store"` og fyrirspurnarbreytu gegn skyndiminni.

## Tveir kostir

| Kostur | Skrár sem þarf | Uppfærist |
| --- | --- | --- |
| **Sjálfstæð síða** | `draumahoggid-2026.html` ein og sér | Nei – gögnin eru innbyggð |
| **Síða + gögn** | `index.html` + `config.js` + `assets/` + `data/stada.json` | Já – skiptu bara um JSON |

Sjálfstæða skjalið þarf **enga** JSON-skrá. Gögnin liggja í `window.DRAUMAHOGG_GOGN` inni í
skjalinu sjálfu, ásamt CSS, JS og merkinu. Núll utanaðkomandi köll.

## Snið JSON-skrárinnar

```json
{
  "meta": {
    "titill": "Draumahöggið 2026",
    "undirtitill": "Eitt högg. Eitt tækifæri.",
    "vollur": "Nesvöllur, Seltjarnarnesi",
    "hola": 9,
    "par": 3,
    "lengd_m": 103,
    "thatttakendur": 112,
    "dagsetning": "2026-09-05",
    "verdlaun": "",
    "stada": "Lokið",
    "lokid": true,
    "uppfaert": "2026-09-05T12:30:00+00:00"
  },
  "keppendur": [
    { "nr": 14, "nafn": "Gunnar Þór Ármannsson", "klubbur": "Golfklúbburinn Setberg",
      "fjarlaegd": 1.815, "flot": true, "timi": "11:16" },
    { "nr": 3,  "nafn": "Birkir Marinósson", "klubbur": "Golfklúbbur Grindavíkur", "flot": true },
    { "nr": 1,  "nafn": "Þuríður Valdimarsdóttir", "klubbur": "Golfklúbbur Reykjavíkur" }
  ]
}
```

### meta

Allir reitir valkvæðir. Reitur sem vantar birtist ekki.

| Reitur | Merking |
| --- | --- |
| `titill`, `undirtitill` | Fyrirsögn efst |
| `vollur`, `hola`, `par`, `lengd_m` | Reitir í holuspjaldinu |
| `thatttakendur` | Fjöldi sem spilaði – birtist sem reitur og í samantekt |
| `dagsetning` | `ÁÁÁÁ-MM-DD`, birt sem `DD.MM.ÁÁÁÁ` |
| `verdlaun` | Gullin lína; sleppt ef tómt |
| `stada` | Frjáls texti í holuspjaldinu |
| `lokid` | `true` ⇒ „Mótinu er lokið“, engin sjálfvirk uppfærsla, sigurvegarahaus |
| `uppfaert` | ISO-tímastimpill, birtur í fæti |

### keppendur

`nr` og `nafn` skylda, annað valkvætt. Röðun í hverri töflu reiknast sjálfkrafa.

| Reitur | Merking |
| --- | --- |
| `nr` | Röð á teig – einkvæm tala |
| `nafn`, `klubbur` | Nafn og klúbbur |
| `fjarlaegd` | Metrar frá holu, tala (`1.815`). Punktur, ekki komma |
| `hio` | `true` = hola í höggi. Fer í 1. sæti og kveikir gullna hausinn |
| `ogilt` | `true` = högg telst ekki. Birtist neðst án sætis |
| `flot` | `true` = hitti flötina. Mæling setur þetta sjálfkrafa |
| `timi` | `"11:16"` |
| `athugasemd` | Frjáls texti undir nafninu |

Staða keppanda ræðst svona, í þessari röð: `hio` → `fjarlaegd` → `ogilt` → `flot` → ekkert
(hitti ekki flötina, birtist með `—` í listanum yfir alla).

### Töflurnar þrjár

1. **Staðan** – aðeins þeir sem hafa `fjarlaegd`, `hio` eða `ogilt`. Raðað eftir vaxandi fjarlægð,
   jafntefli deila sæti.
2. **Hittu flötina** – allir með `flot`, `hio` eða `fjarlaegd`. Raðað eftir `nr`.
3. **Allir þátttakendur** – hver einasti keppandi í skránni. Raðað eftir `nr`.
