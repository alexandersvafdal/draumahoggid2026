#!/usr/bin/env python3
"""Býr til data/stada.json (birt) út frá local/raslisti.json (einka).

Notkun:
    python3 tools/birta.py                 # endurbyggir stada.json
    python3 tools/birta.py 14 181.5cm      # skráir mælingu og endurbyggir
    python3 tools/birta.py 14 1.815        # sama, í metrum
    python3 tools/birta.py 22 hio          # hola í höggi
    python3 tools/birta.py 31 ogilt "Í vatn"
    python3 tools/birta.py flot 3 5 7 17 29    # merkir að þessir hafi hitt flötina
    python3 tools/birta.py afflot 5            # tekur flatarmerkinguna af
    python3 tools/birta.py teig 113 "Jón Jónsson"   # gefur keppanda röð á teig

Aðeins keppendur sem eru mældir eða hafa hitt flötina rata í data/stada.json.
Ráslistinn fer aldrei í git.
"""
import json, sys, os, datetime

RAS = "local/raslisti.json"
BIRT = "data/stada.json"
BIRTIR_REITIR = ("nr", "nafn", "klubbur", "hio", "ogilt", "fjarlaegd", "flot", "timi", "athugasemd")


def maeldur(k):
    return k.get("hio") is True or k.get("ogilt") is True or isinstance(k.get("fjarlaegd"), (int, float))


def birtanlegur(k):
    return maeldur(k) or k.get("flot") is True


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
    if rok and rok[0].lower() == "teig":
        nr, nafn = int(rok[1]), rok[2].strip().lower()
        ef_til = [k for k in g["keppendur"] if k.get("nr") == nr]
        if ef_til:
            sys.exit("Nr %d er þegar %s" % (nr, ef_til[0]["nafn"]))
        finna = [k for k in g["keppendur"] if nafn in k["nafn"].lower()]
        if len(finna) != 1:
            sys.exit("Fann %d keppendur fyrir '%s'%s" % (len(finna), rok[2],
                     (": " + ", ".join(k["nafn"] for k in finna)) if finna else ""))
        k = finna[0]
        print("Röð á teig %d -> %s (%s)" % (nr, k["nafn"], k.get("klubbur", "")))
        k["nr"] = nr
        k.pop("varamadur", None)
        rok = []
    if rok and rok[0].lower() in ("flot", "afflot"):
        setja = rok[0].lower() == "flot"
        eftir = {k.get("nr"): k for k in g["keppendur"]}
        for texti in rok[1:]:
            nr = int(texti)
            k = eftir.get(nr)
            if k is None:
                sys.exit("Enginn keppandi með nr %d" % nr)
            if setja:
                k["flot"] = True
            else:
                k.pop("flot", None)
            print("%s flöt: %d %s" % ("Merkt" if setja else "Afmerkt", nr, k["nafn"]))
        rok = []
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
            keppandi["flot"] = True          # mæling þýðir að boltinn var á flötinni
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
        if birtanlegur(k):
            birt["keppendur"].append({r: k[r] for r in BIRTIR_REITIR if r in k})
    json.dump(birt, open(BIRT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    open(BIRT, "a", encoding="utf-8").write("\n")
    maeldir = sum(1 for k in birt["keppendur"] if maeldur(k))
    print("%s: %d mældir, %d á flöt alls (af %d á ráslista)"
          % (BIRT, maeldir, len(birt["keppendur"]), len(g["keppendur"])))


if __name__ == "__main__":
    main()
