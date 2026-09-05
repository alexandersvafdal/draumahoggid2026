/* Draumahöggið – lifandi stigatafla
   Eitt högg á hvern keppanda. Sá sem er næst holu leiðir; hola í höggi tekur allt. */
(function () {
  "use strict";

  var CFG = window.DRAUMAHOGG_CONFIG || {};
  var SLOD = CFG.gagnaslod || "data/keppni.json";
  var TIDNI = Math.max(3000, CFG.uppfaerslutidni || 15000);

  var el = function (id) { return document.getElementById(id); };
  // Íslenskt talnasnið handvirkt – sumir vafrar hafa ekki is-IS í ICU og myndu skila "1,234.50".
  var thusund = function (heil) { return heil.replace(/\B(?=(\d{3})+(?!\d))/g, "."); };
  var nfM = { format: function (n) {
    var s = Math.abs(n).toFixed(2).split(".");
    return (n < 0 ? "-" : "") + thusund(s[0]) + "," + s[1];
  } };
  var nf0 = { format: function (n) {
    return (n < 0 ? "-" : "") + thusund(String(Math.round(Math.abs(n))));
  } };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var nrm = function (s) { return String(s == null ? "" : s).replace(/ /g, " ").replace(/\s+/g, " ").trim(); };

  var q = el("q"), klubburSel = el("klubbur"), cfilter = el("cfilter");
  var sia = "", klubburVal = "", leit = "";
  var sedir = null;          // nr sem þegar hafa verið birt sem kláruð -> til að merkja ný högg
  var sidastRaw = "";
  var klubbarFylltir = false;

  /* ---------------- gögn ---------------- */

  function erCsv(u) { return /output=csv|\.csv(\?|$)/i.test(u); }

  function parseCsv(txt) {
    var rows = [], row = [], f = "", i = 0, inQ = false, c;
    txt = txt.replace(/^﻿/, "");
    for (; i < txt.length; i++) {
      c = txt[i];
      if (inQ) {
        if (c === '"') { if (txt[i + 1] === '"') { f += '"'; i++; } else inQ = false; }
        else f += c;
      } else if (c === '"') inQ = true;
      else if (c === ",") { row.push(f); f = ""; }
      else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
      else if (c !== "\r") f += c;
    }
    if (f.length || row.length) { row.push(f); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (v) { return nrm(v) !== ""; }); });
  }

  function satt(v) { return /^(1|já|ja|true|x|y|yes)$/i.test(nrm(v)); }

  function tala(v) {
    var s = nrm(v).replace(/\s|m$/gi, "").replace(",", ".");
    if (s === "") return null;
    var n = parseFloat(s);
    return isFinite(n) ? n : null;
  }

  function csvTilGagna(txt) {
    var rows = parseCsv(txt);
    if (!rows.length) return { meta: CFG.meta || {}, keppendur: [] };
    var head = rows[0].map(function (h) { return nrm(h).toLowerCase(); });
    var ix = function (name) { return head.indexOf(name); };
    var iNr = ix("nr"), iNafn = ix("nafn"), iKl = ix("klubbur"), iFj = ix("fjarlaegd") >= 0 ? ix("fjarlaegd") : ix("fjarlægð");
    var iHio = ix("hio"), iTimi = ix("timi") >= 0 ? ix("timi") : ix("tími"), iOg = ix("ogilt") >= 0 ? ix("ogilt") : ix("ógilt");
    var iAth = ix("athugasemd");
    var keppendur = rows.slice(1).map(function (r, n) {
      return {
        nr: iNr >= 0 ? (tala(r[iNr]) || n + 1) : n + 1,
        nafn: iNafn >= 0 ? nrm(r[iNafn]) : "",
        klubbur: iKl >= 0 ? nrm(r[iKl]) : "",
        fjarlaegd: iFj >= 0 ? tala(r[iFj]) : null,
        hio: iHio >= 0 ? satt(r[iHio]) : false,
        ogilt: iOg >= 0 ? satt(r[iOg]) : false,
        timi: iTimi >= 0 ? nrm(r[iTimi]) : "",
        athugasemd: iAth >= 0 ? nrm(r[iAth]) : ""
      };
    }).filter(function (k) { return k.nafn; });
    return { meta: CFG.meta || {}, keppendur: keppendur };
  }

  function saekja(handvirkt) {
    var u = SLOD + (SLOD.indexOf("?") < 0 ? "?" : "&") + "t=" + Date.now();
    return fetch(u, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(function (txt) {
        el("err").hidden = true;
        if (txt === sidastRaw && !handvirkt) { stimpla(); return; }
        sidastRaw = txt;
        var gogn = erCsv(SLOD) ? csvTilGagna(txt) : JSON.parse(txt);
        gogn.meta = Object.assign({}, CFG.meta || {}, gogn.meta || {});
        window.__GOGN = gogn;
        teikna(gogn);
        stimpla();
      })
      .catch(function (e) {
        var b = el("err");
        b.hidden = false;
        b.innerHTML = "Náði ekki í gögn (" + esc(e.message) + "). Reyni aftur eftir " +
          Math.round(TIDNI / 1000) + " sek. Slóð: <code>" + esc(SLOD) + "</code>";
        el("livepill").classList.add("pause");
        el("livetext").textContent = "Ekkert samband";
      });
  }

  var p2 = function (n) { return (n < 10 ? "0" : "") + n; };
  function dagsTimi(d) {
    return p2(d.getDate()) + "." + p2(d.getMonth() + 1) + "." + d.getFullYear() +
      " kl. " + p2(d.getHours()) + ":" + p2(d.getMinutes());
  }

  function stimpla() {
    var d = new Date();
    el("livepill").classList.remove("pause");
    el("livetext").textContent = "Í beinni · " + p2(d.getHours()) + ":" + p2(d.getMinutes()) + ":" + p2(d.getSeconds());
  }

  /* ---------------- röðun ---------------- */

  function bunaKeppanda(k) {
    if (k.hio === true) return "hio";
    if (typeof k.fjarlaegd === "number" && isFinite(k.fjarlaegd)) return "lokid";
    if (k.ogilt === true) return "ogilt";
    return "bidur";
  }

  function radad(keppendur) {
    var hio = [], lokid = [], ogilt = [], bidur = [];
    keppendur.forEach(function (k) {
      var s = bunaKeppanda(k);
      k.__stada = s;
      ({ hio: hio, lokid: lokid, ogilt: ogilt, bidur: bidur })[s].push(k);
    });
    var eftirNr = function (a, b) { return (a.nr || 0) - (b.nr || 0); };
    hio.sort(eftirNr);
    ogilt.sort(eftirNr);
    bidur.sort(eftirNr);
    lokid.sort(function (a, b) { return a.fjarlaegd - b.fjarlaegd || eftirNr(a, b); });

    // sætistala: hola í höggi deilir 1. sæti, síðan vaxandi fjarlægð með jafntefli
    var n = 0, sidast = null;
    hio.forEach(function (k) { k.__saeti = 1; });
    n = hio.length;
    lokid.forEach(function (k, i) {
      if (sidast !== null && k.fjarlaegd === sidast) k.__saeti = lokid[i - 1].__saeti;
      else k.__saeti = n + i + 1;
      sidast = k.fjarlaegd;
    });
    if (hio.length) hio.forEach(function (k) { k.__saeti = 1; });
    ogilt.forEach(function (k) { k.__saeti = null; });
    bidur.forEach(function (k) { k.__saeti = null; });

    return { hio: hio, lokid: lokid, ogilt: ogilt, bidur: bidur, spiladir: hio.concat(lokid, ogilt) };
  }

  /* ---------------- teikning ---------------- */

  function fjarlaegdTexti(k) {
    if (k.__stada === "hio") return '<span class="val">HOLA Í HÖGGI</span>';
    if (k.__stada === "lokid") return '<span class="val">' + nfM.format(k.fjarlaegd) + '<small>m</small></span>';
    if (k.__stada === "ogilt") return '<span class="val">Ógilt</span>';
    return '<span class="val">Bíður</span>';
  }

  function teiknaHaus(m) {
    el("logo").src = CFG.merki || "";
    if (!CFG.merki) el("logo").style.display = "none";
    document.title = (m.titill || "Draumahöggið") + " – Staðan í beinni";
    var dags = m.dagsetning ? m.dagsetning.split("-").reverse().join(".") : "";
    var facts = [
      ["Völlur", m.vollur],
      ["Hola", m.hola],
      ["Par", m.par],
      ["Lengd", m.lengd_m ? nf0.format(m.lengd_m) + " m" : ""],
      ["Dagsetning", dags],
      ["Staða", m.stada]
    ].filter(function (f) { return f[1] != null && f[1] !== ""; });
    el("hole").innerHTML =
      '<h1>' + esc(m.titill || "Draumahöggið") +
      (m.undirtitill ? '<span>' + esc(m.undirtitill) + '</span>' : '') + '</h1>' +
      '<div class="facts">' + facts.map(function (f) {
        return '<div class="fact"><div class="k">' + esc(f[0]) + '</div><div class="v">' + esc(f[1]) + '</div></div>';
      }).join("") + '</div>' +
      (m.verdlaun ? '<div class="prize"><b>Verðlaun fyrir holu í höggi:</b> ' + esc(m.verdlaun) + '</div>' : '');
  }

  function teiknaHio(hio) {
    var box = el("hiobox");
    if (!hio.length) { box.innerHTML = ""; return; }
    var einn = hio.length === 1;
    box.innerHTML =
      '<div class="hio">' +
      '<div class="kicker">Draumahöggið heppnaðist</div>' +
      '<h2>' + (einn ? esc(hio[0].nafn) + ' fór holu í höggi!' : hio.length + ' fóru holu í höggi!') + '</h2>' +
      (einn
        ? '<p>' + [hio[0].klubbur, hio[0].timi ? "kl. " + hio[0].timi : ""].filter(Boolean).map(esc).join(" · ") + '</p>'
        : '<ul>' + hio.map(function (k) {
            return '<li>' + esc(k.nafn) + [k.klubbur, k.timi ? "kl. " + k.timi : ""].filter(Boolean)
              .map(function (x) { return " · " + esc(x); }).join("") + '</li>';
          }).join("") + '</ul>') +
      '</div>';
  }

  function teiknaPall(spiladir) {
    var topp = spiladir.filter(function (k) { return k.__saeti; }).slice(0, 3);
    el("podium").hidden = topp.length === 0;
    el("podium").innerHTML = topp.map(function (k, i) {
      return '<div class="pod p' + (i + 1) + '">' +
        '<span class="rk">' + k.__saeti + '</span>' +
        '<div class="nm">' + esc(k.nafn) + '</div>' +
        '<div class="cl">' + esc(k.klubbur || "—") + (k.timi ? " · kl. " + esc(k.timi) : "") + '</div>' +
        '<div class="ds">' + (k.__stada === "hio" ? "HOLA Í HÖGGI" : nfM.format(k.fjarlaegd) + '<small>m</small>') + '</div>' +
        '</div>';
    }).join("");
  }

  function fyllaKlubba(keppendur) {
    if (klubbarFylltir) return;
    var talning = {};
    keppendur.forEach(function (k) { if (k.klubbur) talning[k.klubbur] = (talning[k.klubbur] || 0) + 1; });
    Object.keys(talning).sort(function (a, b) { return a.localeCompare(b, "is"); }).forEach(function (c) {
      var o = document.createElement("option");
      o.value = c; o.textContent = c + " (" + talning[c] + ")";
      klubburSel.appendChild(o);
    });
    klubbarFylltir = true;
  }

  function teiknaSiur(r) {
    var val = [
      ["Allir", "", r.spiladir.length + r.bidur.length],
      ["Búnir", "spiladir", r.spiladir.length],
      ["Á teig", "bidur", r.bidur.length],
      ["Ógilt", "ogilt", r.ogilt.length]
    ];
    if (r.hio.length) val.splice(1, 0, ["★ Hola í höggi", "hio", r.hio.length]);
    cfilter.innerHTML = "";
    val.forEach(function (v) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "cbtn" + (sia === v[1] ? " on" : "");
      b.innerHTML = esc(v[0]) + ' <span class="cn">' + v[2] + "</span>";
      b.onclick = function () { sia = (sia === v[1] ? "" : v[1]); teikna(window.__GOGN); };
      cfilter.appendChild(b);
    });
  }

  function passar(k) {
    if (klubburVal && nrm(k.klubbur) !== nrm(klubburVal)) return false;
    if (sia === "hio" && k.__stada !== "hio") return false;
    if (sia === "ogilt" && k.__stada !== "ogilt") return false;
    if (sia === "bidur" && k.__stada !== "bidur") return false;
    if (sia === "spiladir" && k.__stada === "bidur") return false;
    if (!leit) return true;
    var hey = ((k.nafn || "") + " " + (k.klubbur || "") + " " + (k.athugasemd || "")).toLowerCase();
    return leit.split(/\s+/).filter(Boolean).every(function (w) { return hey.indexOf(w) >= 0; });
  }

  function rada(k, nyr) {
    var merki = [];
    if (k.__stada === "hio") merki.push('<span class="tag t-hio">Hola í höggi</span>');
    if (k.__stada === "ogilt") merki.push('<span class="tag t-ogilt">Ógilt</span>');
    if (nyr) merki.push('<span class="tag t-ny">Nýtt</span>');
    var undir = [k.klubbur, k.timi ? "kl. " + k.timi : "", k.athugasemd].filter(Boolean).map(esc).join(" · ");
    return '<div class="row' + (k.__saeti && k.__saeti <= 3 ? " r" + k.__saeti : "") +
      (k.__stada === "hio" ? " hio" : "") + (k.__stada === "ogilt" ? " ogilt" : "") + (nyr ? " ny" : "") + '">' +
      '<div class="rk">' + (k.__saeti || "–") + '</div>' +
      '<div><div class="n">' + esc(k.nafn) + '</div><div class="c">' + undir + " " + merki.join(" ") + '</div></div>' +
      fjarlaegdTexti(k) +
      '</div>';
  }

  function teikna(gogn) {
    if (!gogn) return;
    var keppendur = gogn.keppendur || [];
    var m = gogn.meta || {};
    teiknaHaus(m);
    fyllaKlubba(keppendur);

    var r = radad(keppendur);
    teiknaHio(r.hio);
    teiknaPall(r.spiladir);
    teiknaSiur(r);

    // merkja ný högg frá síðustu umferð
    var nuSedir = {};
    r.spiladir.forEach(function (k) { nuSedir[k.nr] = 1; });
    var fyrstaKeyrsla = sedir === null;
    var nyir = {};
    if (!fyrstaKeyrsla) {
      Object.keys(nuSedir).forEach(function (nr) { if (!sedir[nr]) nyir[nr] = 1; });
    }
    sedir = nuSedir;

    var syndir = r.spiladir.filter(passar);
    var bidur = r.bidur.filter(passar);

    var enginnSkradur = keppendur.length === 0;
    el("list").innerHTML = syndir.length
      ? syndir.map(function (k) { return rada(k, !!nyir[k.nr]); }).join("")
      : '<p class="empty">' + (enginnSkradur ? "Engir keppendur skráðir enn."
        : r.spiladir.length === 0 ? "Enginn búinn að slá enn." : "Engin skráning fannst.") + '</p>';
    el("waitlist").innerHTML = bidur.length
      ? bidur.map(function (k) { return rada(k, false); }).join("")
      : '<p class="empty">' + (enginnSkradur ? "Engir keppendur skráðir enn."
        : r.bidur.length === 0 ? "Allir búnir að slá." : "Engin skráning fannst.") + '</p>';

    el("nres").textContent = syndir.length + (syndir.length !== r.spiladir.length ? " af " + r.spiladir.length : "");
    el("nwait").textContent = bidur.length + (bidur.length !== r.bidur.length ? " af " + r.bidur.length : "");

    var alls = keppendur.length, bunir = r.spiladir.length;
    var bestur = r.hio.length ? r.hio[0] : (r.lokid[0] || null);
    el("count").innerHTML = alls === 0
      ? "<span>Engir keppendur skráðir enn</span> <em>· bættu þeim við í <code>data/keppni.json</code> eða á skráningarsíðunni</em>"
      : "<span>" + nf0.format(bunir) + " af " + nf0.format(alls) + " búnir að slá</span>" +
      (bestur ? ' <em>· efst/ur: ' + esc(bestur.nafn) + " – " +
        (bestur.__stada === "hio" ? "hola í höggi" : nfM.format(bestur.fjarlaegd) + " m") + "</em>" : "") +
      (r.ogilt.length ? ' <em>· ' + r.ogilt.length + " ógild"+(r.ogilt.length===1?"t":"") + "</em>" : "");

    var uppf = m.uppfaert ? new Date(m.uppfaert) : null;
    el("foot").innerHTML =
      "Draumahöggið · hver keppandi fær eitt högg. Sá sem er næst holu leiðir; hola í höggi tekur allt." +
      (uppf && !isNaN(uppf) ? " Gögn síðast merkt uppfærð " + dagsTimi(uppf) + "." : "") +
      " Síðan uppfærist sjálfkrafa á " + Math.round(TIDNI / 1000) + " sek. fresti.";
  }

  /* ---------------- viðburðir ---------------- */

  var leitTimer;
  q.addEventListener("input", function () {
    clearTimeout(leitTimer);
    leitTimer = setTimeout(function () { leit = q.value.trim().toLowerCase(); teikna(window.__GOGN); }, 120);
  });
  klubburSel.addEventListener("change", function () { klubburVal = klubburSel.value; teikna(window.__GOGN); });
  el("refresh").addEventListener("click", function () { saekja(true); });

  var timer = setInterval(function () { if (!document.hidden) saekja(false); }, TIDNI);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) saekja(false); });
  window.addEventListener("beforeunload", function () { clearInterval(timer); });

  saekja(true);
})();
