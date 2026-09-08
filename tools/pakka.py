#!/usr/bin/env python3
"""Býr til afhendingarskrár í dist/:

  draumahoggid-2026.html        Sjálfstæð síða - allt innbyggt (CSS, JS, gögn).
                                Engar utanaðkomandi skrár, engin sjálfvirk uppfærsla.
  thatttakendur-2026.csv        Allir þátttakendur með árangri (til að para á Einherjasíðunni).
  thatttakendur-2026.json       Sama á JSON-formi.
"""
import json, io, os, re, csv, datetime

ROT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def les(p): return io.open(os.path.join(ROT, p), encoding="utf-8").read()

os.makedirs(os.path.join(ROT, "dist"), exist_ok=True)
gogn = json.loads(les("data/stada.json"))
allir = json.loads(les("local/raslisti.json"))
FJOLDI = allir["meta"].get("thatttakendur", 0)

# ---------- 1. sjálfstæð síða ----------
html = les("index.html")
html = html.replace('<link rel="stylesheet" href="assets/style.css?v=dev">',
                    "<style>\n" + les("assets/style.css") + "\n</style>")
html = html.replace('<script src="config.js?v=dev"></script>',
                    "<script>\n" + les("config.js") + "\n</script>")
html = html.replace('<script src="assets/app.js?v=dev"></script>',
                    "<script>\nwindow.DRAUMAHOGG_GOGN = " + json.dumps(gogn, ensure_ascii=False) + ";\n</script>\n"
                    "<script>\n" + les("assets/app.js") + "\n</script>")
for tag in ('<link rel="preconnect" href="https://fonts.googleapis.com">',
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'):
    html = html.replace(tag, "")

# Merkið innbyggt sem data: URI svo skjalið sé algjörlega sjálfstætt.
import base64, urllib.request
m = re.search(r'merki:\s*"([^"]+)"', les("config.js"))
if m and m.group(1).startswith("http"):
    try:
        with urllib.request.urlopen(m.group(1), timeout=20) as r:
            b64 = base64.b64encode(r.read()).decode()
        html = html.replace(m.group(1), "data:image/png;base64," + b64)
        print("merki innbyggt (%d KB)" % (len(b64) * 3 // 4096))
    except Exception as e:
        print("náði ekki í merki, vísa áfram á golf.is:", e)
ut = os.path.join(ROT, "dist", "draumahoggid-2026.html")
io.open(ut, "w", encoding="utf-8").write(html)
eftir = [m for m in re.findall(r'(?:src|href)="([^"#]+)"', html)
         if not m.startswith(("http", "data:"))]
print("dist/draumahoggid-2026.html  (%d KB)  utanaðkomandi skrár: %s"
      % (os.path.getsize(ut) // 1024, eftir or "engar"))

# ---------- 2. þátttakendalisti með árangri ----------
maeldir = sorted([k for k in gogn["keppendur"] if isinstance(k.get("fjarlaegd"), (int, float))
                  or k.get("hio")], key=lambda k: (0 if k.get("hio") else 1, k.get("fjarlaegd", 0)))
saeti, sidast = {}, None
for i, k in enumerate(maeldir):
    lykill = "hio" if k.get("hio") else k["fjarlaegd"]
    saeti[k["nr"]] = saeti[maeldir[i-1]["nr"]] if (sidast == lykill and i) else i + 1
    sidast = lykill
birt = {k["nr"]: k for k in gogn["keppendur"]}

radir = []
for k in sorted(allir["keppendur"], key=lambda k: k["nr"]):
    if k["nr"] > FJOLDI:
        continue
    b = birt.get(k["nr"], {})
    if b.get("hio"):
        arangur, fj = "Hola í höggi", ""
    elif isinstance(b.get("fjarlaegd"), (int, float)):
        arangur, fj = "Mæld á flöt", ("%.3f" % b["fjarlaegd"]).rstrip("0").rstrip(".").replace(".", ",")
    elif b.get("flot"):
        arangur, fj = "Hitti flötina", ""
    else:
        arangur, fj = "Hitti ekki flötina", ""
    radir.append({"nr": k["nr"], "nafn": k["nafn"], "klubbur": k.get("klubbur", ""),
                  "arangur": arangur, "fjarlaegd_m": fj,
                  "saeti": saeti.get(k["nr"], ""), "timi": b.get("timi", "")})

with io.open(os.path.join(ROT, "dist", "thatttakendur-2026.csv"), "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=["nr", "nafn", "klubbur", "arangur", "fjarlaegd_m", "saeti", "timi"],
                       delimiter=";")
    w.writeheader()
    w.writerows(radir)

json.dump({"mot": allir["meta"], "thatttakendur": radir},
          io.open(os.path.join(ROT, "dist", "thatttakendur-2026.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)

telja = {}
for r in radir:
    telja[r["arangur"]] = telja.get(r["arangur"], 0) + 1
print("dist/thatttakendur-2026.csv og .json  (%d þátttakendur)" % len(radir))
for a, n in sorted(telja.items(), key=lambda x: -x[1]):
    print("   %-20s %d" % (a, n))
