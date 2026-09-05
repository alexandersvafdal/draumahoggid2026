/* Stillingar fyrir Draumahöggið 2026
   ---------------------------------------------------------------
   gagnaslod        Slóð á gögnin. Getur verið:
                      • "data/keppni.json"  (skjalið í þessu repo)
                      • CSV-slóð úr Google Sheets (Skrá → Deila → Birta á vefnum → CSV)
                        Dæmi: "https://docs.google.com/spreadsheets/d/XXXX/pub?gid=0&single=true&output=csv"
                        Dálkar: nr, nafn, klubbur, fjarlaegd, hio, timi, ogilt, athugasemd
   uppfaerslutidni  Millisekúndur milli sjálfvirkra uppfærslna.
   merki            Slóð á merki efst í hausnum. Tómt = innbyggt fánamerki.
   meta             Notað þegar gagnaslod er CSV (JSON-skráin ber sína eigin meta).
*/
window.DRAUMAHOGG_CONFIG = {
  gagnaslod: "data/stada.json",
  uppfaerslutidni: 15000,
  merki: "https://www.golf.is/wp-content/uploads/2025/08/Einherjaklubburinn_logo-01-400x.png",

  meta: {
    titill: "Draumahöggið 2026",
    undirtitill: "Eitt högg. Eitt tækifæri.",
    vollur: "Nesvöllur, Seltjarnarnesi",
    hola: 9,
    par: 3,
    lengd_m: 103,
    dagsetning: "2026-09-05",
    verdlaun: "",
    stada: "Í gangi"
  }
};
