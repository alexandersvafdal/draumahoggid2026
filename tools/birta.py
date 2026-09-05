#!/usr/bin/env python3
"""Býr til data/stada.json (birt) út frá local/raslisti.json (einka).

Notkun:
    python3 tools/birta.py                 # endurbyggir stada.json
    python3 tools/birta.py 14 181.5cm      # skráir mælingu og endurbyggir
    python3 tools/birta.py 14 1.815        # sama, í metrum
    python3 tools/birta.py 22 hio          # hola í höggi
    python3 tools/birta.py 31 ogilt "Í vatn"

Aðeins mældir keppendur rata í data/stada.json. Ráslistinn fer aldrei í git.
"""
import json, sys, os, datetime

RAS = "local/raslisti.json"
BIRT = "data/stada.json"
BIRTIR_REITIR = ("nr", "nafn", "klubbur", "hio", "ogilt", "fjarlaegd", "timi", "athugasemd")


def maeldur(k):
    return k.get("hio") is True or k.get("ogilt") is True or isinstance(k.get("fjarlaegd"), (int, float))


def i_metrum(texti):
    t = texti.strip().lower().replace(",", ".")
    if t.endswith("cm"):
        return round(float(t[:-2].strip()) / 100, 4)
    if t.endswith("m"):
        t = t[:-1].strip()
    return round(float(t), 4)


def main():
    if not os.path.exists(RAS):
        sys.exit("Finn ekki %s" % RAS)
    g = json.load(open(RAS, encoding="utf-8"))

    rok = sys.argv[1:]
    if rok:
        nr = int(rok[0])
        keppandi = next((k for k in g["keppendur"] if k.get("nr") == nr), None)
        if keppandi is None:
            sys.exit("Enginn keppandi með nr %d" % nr)
        gildi = rok[1].lower() if len(rok) > 1 else ""
        for reitur in ("fjarlaegd", "hio", "ogilt"):
            keppandi.pop(reitur, None)
        if gildi == "hio":
            keppandi["hio"] = True
        elif gildi == "ogilt":
            keppandi["ogilt"] = True
        elif gildi in ("hreinsa", "clear"):
            keppandi.pop("timi", None)
            keppandi.pop("athugasemd", None)
        else:
            keppandi["fjarlaegd"] = i_metrum(rok[1])
        if len(rok) > 2:
            keppandi["athugasemd"] = rok[2]
        if gildi not in ("hreinsa", "clear"):
            keppandi.setdefault("timi", datetime.datetime.now().strftime("%H:%M"))
        print("Skráð: %d %s -> %s" % (nr, keppandi["nafn"],
              {r: keppandi[r] for r in ("fjarlaegd", "hio", "ogilt", "timi") if r in keppandi}))

    nu = datetime.datetime.now().astimezone().replace(microsecond=0).isoformat()
    g["meta"]["uppfaert"] = nu
    json.dump(g, open(RAS, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    open(RAS, "a", encoding="utf-8").write("\n")

    birt = {"meta": g["meta"], "keppendur": []}
    for k in g["keppendur"]:
        if maeldur(k):
            birt["keppendur"].append({r: k[r] for r in BIRTIR_REITIR if r in k})
    json.dump(birt, open(BIRT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    open(BIRT, "a", encoding="utf-8").write("\n")
    print("%s: %d af %d keppendum mældir" % (BIRT, len(birt["keppendur"]), len(g["keppendur"])))


if __name__ == "__main__":
    main()
