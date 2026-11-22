/* main.js - shared by every page: data-bound text ([data-stat]), chart mounting (.chart[data-chart]),
 * toggles (.controls[data-chart]), linked state selection (State page), responsive re-render
 * (ResizeObserver, debounced) and the section nav scroll-spy.
 */
(function () {
  "use strict";
  const D = window.STORY_DATA;
  if (!window.d3 || !window.U || !D) {
    const show = () => document.querySelectorAll(".chart").forEach((el) => {
      el.innerHTML = `<p class="chart-error">Charts need assets/js/d3.v7.min.js and assets/data/story-data.js. Run scripts/build_data.py.</p>`;
    });
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", show); else show();
    return;
  }
  const { fmt } = U;
  const STATE_CHARTS = new Set(["s1", "s2", "s3", "s4", "s5"]);
  const entries = {};

  /* ---------------------------------------------------------- data-bound text
   * Any element with data-stat="key" gets its text from STORY_DATA, so prose figures
   * cannot drift from the generated data. */
  const find = (arr, k, v) => arr.find((d) => d[k] === v);
  const nw = (w) => find(D.national.windows, "window", w);
  const rus = (c) => find(D.national.roadUserSeverity, "category", c);
  const age = (c) => find(D.national.ageSeverity, "category", c);
  const rem = (c) => find(D.national.remoteness, "category", c);
  const ruw = (u, w) => D.national.roadUserWindows.find((d) => d.roadUser === u && d.window === w).pctChange;
  const ruy = (u, y) => D.national.roadUserByYear.find((d) => d.roadUser === u && d.year === y).hospitalisations;
  const stw = (s, w) => D.state.windows.find((d) => d.state === s && d.window === w).pctChange;
  const cyc = (s) => find(D.state.cyclists, "state", s);
  const bd20 = (s) => find(D.state.bedDays, "state", s).bedDaysPerCase1520;
  const stYr = (s, y) => D.state.annual.find((d) => d.state === s && d.year === y).hospitalisations;
  const cycOther = D.state.roadUserMix.filter((d) => d.category === "Pedal cyclist" && d.state !== "ACT").map((d) => d.shareOfT1);
  const mix = (arr, s, c) => arr.find((d) => d.state === s && d.category === c).shareOfT1;
  const hy = (p) => find(D.national.halfYearly, "period", p).hospitalisations;
  const remRU = (a, u) => D.national.remotenessRoadUser.find((d) => d.remoteness === a && d.roadUser === u).share;
  const covid = (u) => find(D.national.roadUserCovid, "roadUser", u).pctChange;
  const yr = (y) => find(D.national.yearly, "year", y);

  const STATS = {
    h2021: () => fmt.int(yr(2021).hospitalisations),
    h2011: () => fmt.int(yr(2011).hospitalisations),
    natTotal: () => fmt.int(d3.sum(D.national.yearly, (d) => d.hospitalisations)),
    h2019: () => fmt.int(yr(2019).hospitalisations),
    perDay2021: () => fmt.dec(yr(2021).hospitalisations / 365, 0),
    g1121: () => fmt.signed(nw("2011-2021").pctChange),
    g1216: () => fmt.signed(nw("2012-2016").pctChange),
    g1821: () => fmt.signed(nw("2018-2021").pctChange),
    covidH1: () => fmt.signed(((hy("2020 H1") - hy("2019 H1")) / hy("2019 H1")) * 100),
    h2020H2: () => fmt.int(hy("2020 H2")),
    h2021H1: () => fmt.int(hy("2021 H1")),
    dr2011: () => fmt.dec(yr(2011).deathsPer1000, 1),
    dr2019: () => fmt.dec(yr(2019).deathsPer1000, 1),
    dr2016: () => fmt.dec(yr(2016).deathsPer1000, 1),
    dr2017: () => fmt.dec(yr(2017).deathsPer1000, 1),
    d2016: () => fmt.int(yr(2016).diedCases),
    cyc1121: () => fmt.signed(ruw("Pedal cyclist", "2011-2021")),
    cyc1216: () => fmt.signed(ruw("Pedal cyclist", "2012-2016")),
    cyc1821: () => fmt.signed(ruw("Pedal cyclist", "2018-2021")),
    cyc2011: () => fmt.int(ruy("Pedal cyclist", 2011)),
    cyc2021: () => fmt.int(ruy("Pedal cyclist", 2021)),
    cycCovid: () => fmt.signed(covid("Pedal cyclist")),
    pedCovid: () => fmt.signed(covid("Pedestrian")),
    ped1121: () => fmt.signed(ruw("Pedestrian", "2011-2021")),
    ped1119: () => fmt.signed(ruw("Pedestrian", "2011-2019")),
    pedCases: () => fmt.pct(rus("Pedestrian").shareCases2011_2019),
    pedDeaths: () => fmt.pct(rus("Pedestrian").shareDeaths2011_2019),
    pedRate: () => fmt.dec(rus("Pedestrian").deathsPer1000),
    pedN: () => fmt.int(rus("Pedestrian").deaths2011_2019),
    cycCases: () => fmt.pct(rus("Pedal cyclist").shareCases2011_2019),
    cycDeaths: () => fmt.pct(rus("Pedal cyclist").shareDeaths2011_2019),
    hvCases: () => fmt.pct(find(D.national.counterpartySeverity, "category", "Heavy transport vehicle or bus").shareCases2011_2019),
    hvDeaths: () => fmt.pct(find(D.national.counterpartySeverity, "category", "Heavy transport vehicle or bus").shareDeaths2011_2019),
    hvRate: () => fmt.dec(find(D.national.counterpartySeverity, "category", "Heavy transport vehicle or bus").deathsPer1000),
    a75Cases: () => fmt.pct(age("75+").shareCases2011_2019),
    a75Deaths: () => fmt.pct(age("75+").shareDeaths2011_2019),
    a75Rate: () => fmt.dec(age("75+").deathsPer1000),
    a4064Rate: () => fmt.dec(age("40-64").deathsPer1000),
    a6574Rate: () => fmt.dec(age("65-74").deathsPer1000),
    a75Bd: () => fmt.dec(age("75+").bedDaysPerCase1520),
    male: () => fmt.pct(find(D.national.sexSeverity, "category", "Male").shareHospitalisations),
    ratio816: () => fmt.dec(find(D.national.ageSex, "age", "8-16").male / find(D.national.ageSex, "age", "8-16").female, 2),
    ratio75: () => fmt.dec(find(D.national.ageSex, "age", "75+").male / find(D.national.ageSex, "age", "75+").female, 2),
    cycCity: () => fmt.pct(remRU("Major Cities", "Pedal cyclist")),
    cycRemote: () => fmt.pct(remRU("Remote", "Pedal cyclist")),
    paxCity: () => fmt.pct(remRU("Major Cities", "Car passenger")),
    paxRemote: () => fmt.pct(remRU("Remote", "Car passenger")),
    regRate: () => fmt.dec(rem("Regional").deathsPer1000),
    cityRate: () => fmt.dec(rem("Major Cities").deathsPer1000),
    remRate: () => fmt.dec(rem("Remote").deathsPer1000),
    regBd: () => fmt.dec(rem("Regional").bedDaysPerCase1520),
    cityBd: () => fmt.dec(rem("Major Cities").bedDaysPerCase1520),
    missCases: () => fmt.pct(rem("Missing").shareCases2011_2019),
    missDeaths: () => fmt.pct(rem("Missing").shareDeaths2011_2019),
    missRate: () => fmt.dec(rem("Missing").deathsPer1000),
    qld1821: () => fmt.signed(stw("Qld", "2018-2021")),
    qld1216: () => fmt.signed(stw("Qld", "2012-2016")),
    qld1121: () => fmt.signed(stw("Qld", "2011-2021")),
    nt1821: () => fmt.signed(stw("NT", "2018-2021")),
    nsw1821: () => fmt.signed(stw("NSW", "2018-2021")),
    nsw1121: () => fmt.signed(stw("NSW", "2011-2021")),
    vic1121: () => fmt.signed(stw("Vic", "2011-2021")),
    nt2018: () => fmt.int(stYr("NT", 2018)),
    vic2018: () => fmt.int(stYr("Vic", 2018)),
    vic1321: () => fmt.signed((stYr("Vic", 2021) / stYr("Vic", 2013) - 1) * 100),
    actCyc: () => fmt.signed(cyc("ACT").pctChange),
    waCyc: () => fmt.signed(cyc("WA").pctChange),
    actCycShare: () => fmt.pct(mix(D.state.roadUserMix, "ACT", "Pedal cyclist")),
    cycShareMin: () => fmt.pct(d3.min(cycOther)),
    cycShareMax: () => fmt.pct(d3.max(cycOther)),
    ntNonColl: () => fmt.pct(mix(D.state.counterpartyMix, "NT", "Non-collision transport accident")),
    qldMoto: () => fmt.pct(mix(D.state.roadUserMix, "Qld", "Motorcyclist")),
    waMoto: () => fmt.pct(mix(D.state.roadUserMix, "WA", "Motorcyclist")),
    tasMoto: () => fmt.pct(mix(D.state.roadUserMix, "Tas", "Motorcyclist")),
    npMaxRU: () => fmt.pct(d3.max(D.state.roadUserMix.filter((d) => d.category === "Not published"), (d) => d.shareOfT1)),
    actBd20: () => fmt.dec(bd20("ACT"), 2), qldBd20: () => fmt.dec(bd20("Qld"), 2), nswBd20: () => fmt.dec(bd20("NSW"), 2),
    natBd: () => fmt.dec(D.national.bedDaysNational1520.bedDaysPerCase, 2),
    gapMin: () => fmt.pct(d3.min(D.state.reconciliation, (d) => d.gapPct)),
    gapMax: () => fmt.pct(d3.max(D.state.reconciliation, (d) => d.gapPct)),
    // ---- First Nations (firstNations.*; annual totals = workbook Table 1)
    ...fnStats(),
  };

  function fnStats() {
    const F = D.firstNations;
    if (!F) return {};
    const FN = "First Nations people", NI = "Non-Indigenous";
    const an = (y) => find(F.annual, "year", y);
    const tot = (p, y) => (p === FN ? an(y).firstNations : an(y).nonIndigenous);
    const mx = (arr, p, y, c) => arr.find((d) => d.population === p && d.year === y && d.category === c);
    const u26 = (p) => ["0-7", "8-16", "17-25"].reduce((s, a) => s + mx(F.ageMix, p, 2021, a).hospitalisations, 0) / tot(p, 2021) * 100;
    const moto = (p, y) => F.motorcyclists.find((d) => d.population === p && d.year === y).hospitalisations;
    const peak = F.annual.reduce((a, b) => (b.firstNations > a.firstNations ? b : a));
    return {
      fn2011: () => fmt.int(an(2011).firstNations),
      fn2021: () => fmt.int(an(2021).firstNations),
      ni2011: () => fmt.int(an(2011).nonIndigenous),
      ni2021: () => fmt.int(an(2021).nonIndigenous),
      fnChg: () => fmt.signed((an(2021).firstNations / an(2011).firstNations - 1) * 100),
      niChg: () => fmt.signed((an(2021).nonIndigenous / an(2011).nonIndigenous - 1) * 100),
      fnPeak: () => fmt.int(peak.firstNations),
      fnPeakYear: () => String(peak.year),
      fnShare2011: () => fmt.pct(an(2011).fnShare),
      fnShare2021: () => fmt.pct(an(2021).fnShare),
      fnU26: () => fmt.pct(u26(FN)),
      niU26: () => fmt.pct(u26(NI)),
      fn1725: () => fmt.int(mx(F.ageMix, FN, 2021, "17-25").hospitalisations),
      fn65: () => fmt.pct(mx(F.ageMix, FN, 2021, "65+").share),
      ni65: () => fmt.pct(mx(F.ageMix, NI, 2021, "65+").share),
      fnRemote: () => fmt.pct(mx(F.remotenessMix, FN, 2021, "Remote").share),
      niRemote: () => fmt.pct(mx(F.remotenessMix, NI, 2021, "Remote").share),
      fnCity: () => fmt.pct(mx(F.remotenessMix, FN, 2021, "Major Cities").share),
      niCity: () => fmt.pct(mx(F.remotenessMix, NI, 2021, "Major Cities").share),
      fnUnknownRes: () => fmt.int(F.unknownResidence.find((d) => d.population === FN && d.year === 2021).hospitalisations),
      fnMoto2019: () => fmt.int(moto(FN, 2019)),
      fnMoto2020: () => fmt.int(moto(FN, 2020)),
      fnMotoChg: () => fmt.signed((moto(FN, 2020) / moto(FN, 2019) - 1) * 100),
      niMoto2019: () => fmt.int(moto(NI, 2019)),
      niMoto2020: () => fmt.int(moto(NI, 2020)),
      fnNonColl: () => fmt.pct(mx(F.counterpartyMix, FN, 2021, "Non-collision transport accident").share),
      niNonColl: () => fmt.pct(mx(F.counterpartyMix, NI, 2021, "Non-collision transport accident").share),
      fnPed: () => fmt.pct(mx(F.roadUserMix, FN, 2021, "Pedestrian").share),
      niPed: () => fmt.pct(mx(F.roadUserMix, NI, 2021, "Pedestrian").share),
      fnCyc: () => fmt.pct(mx(F.roadUserMix, FN, 2021, "Pedal cyclist").share),
      niCyc: () => fmt.pct(mx(F.roadUserMix, NI, 2021, "Pedal cyclist").share),
      fnNpRU: () => fmt.int(F.npCells.roadUser),
      fnMotoShare2011: () => fmt.pct(mx(F.roadUserMix, FN, 2011, "Motorcyclist").share),
      fnMotoShare2021: () => fmt.pct(mx(F.roadUserMix, FN, 2021, "Motorcyclist").share),
      niMotoShare2011: () => fmt.pct(mx(F.roadUserMix, NI, 2011, "Motorcyclist").share),
      niMotoShare2021: () => fmt.pct(mx(F.roadUserMix, NI, 2021, "Motorcyclist").share),
      fnMoto1121: () => fmt.signed((moto(FN, 2021) / moto(FN, 2011) - 1) * 100),
      fnAge07_2011: () => fmt.pct(mx(F.ageMix, FN, 2011, "0-7").share),
      fnAge07_2021: () => fmt.pct(mx(F.ageMix, FN, 2021, "0-7").share),
    };
  }

  function bindStats() {
    document.querySelectorAll("[data-stat]").forEach((el) => {
      const f = STATS[el.dataset.stat];
      try { el.textContent = f ? f() : "?"; } catch (e) { el.textContent = "?"; console.error("stat", el.dataset.stat, e); }
    });
  }

  /* ---------------------------------------------------------- charts */
  function draw(id) {
    const e = entries[id];
    const w = Math.floor(e.el.clientWidth);
    if (!w) return;
    e.lastW = w;
    // controls built inside the chart (N2 legend, S4 sort chips) are rebuilt on redraw:
    // remember which one had keyboard focus and give it back afterwards.
    const f = document.activeElement;
    const refocus = f && f !== e.el && e.el.contains(f) && f.tagName === "BUTTON" ? f.textContent : null;
    e.el.innerHTML = "";
    try {
      Charts[id].render(e.el, D, Object.assign(e.opts, { width: w, selectedState: U.state.selected, rerender: () => { draw(id); fillTable(id); syncControls(id); } }));
    } catch (err) {
      console.error(`Chart ${id} failed`, err);
      e.el.innerHTML = `<p class="chart-error">This chart could not be drawn (${err.message}).</p>`;
    }
    if (refocus != null) {
      const b = Array.from(e.el.querySelectorAll("button")).find((x) => x.textContent === refocus);
      if (b) b.focus();
    }
  }
  function fillTable(id) {
    const t = document.getElementById("table-" + id);
    if (!t || !Charts[id].table) return;
    const spec = Charts[id].table(D, entries[id].opts);
    U.dataTable(t, spec.columns, spec.rows, spec.caption);
  }
  function syncControls(id) {
    document.querySelectorAll(`.controls[data-chart="${id}"] button[data-opt]`).forEach((b) => {
      b.setAttribute("aria-pressed", String(entries[id].opts[b.dataset.opt] === b.dataset.value));
    });
  }

  function mountCharts() {
    const ro = new ResizeObserver((items) => items.forEach((it) => {
      const id = it.target.dataset.chart;
      const e = entries[id];
      if (e && Math.abs(Math.floor(it.contentRect.width) - e.lastW) > 2) e.redraw();
    }));
    document.querySelectorAll(".chart[data-chart]").forEach((el) => {
      const id = el.dataset.chart;
      if (!Charts[id]) { console.error("Missing chart module", id); return; }
      entries[id] = { el, opts: Object.assign({}, Charts[id].defaults || {}), lastW: 0 };
      entries[id].redraw = U.debounce(() => draw(id), 150);
      draw(id); fillTable(id); syncControls(id);
      ro.observe(el);
    });
    // generic toggle buttons: <div class="controls" data-chart="n1"><button data-opt="mode" data-value="annual">
    document.querySelectorAll(".controls[data-chart] button[data-opt]").forEach((b) => {
      b.addEventListener("click", () => {
        const id = b.closest(".controls").dataset.chart;
        entries[id].opts[b.dataset.opt] = b.dataset.value;
        syncControls(id);
        entries[id].el.classList.remove("fade"); void entries[id].el.offsetWidth; entries[id].el.classList.add("fade");
        draw(id); fillTable(id);
      });
    });
  }

  /* ---------------------------------------------------------- linked state selection */
  function mountStateSelector() {
    const bar = document.getElementById("state-buttons");
    if (!bar) return;
    D.state.states.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.dataset.state = s; b.textContent = s;
      b.setAttribute("aria-pressed", "false");
      b.setAttribute("aria-label", `Highlight ${U.STATE_NAMES[s]} in charts S1 to S5`);
      b.addEventListener("click", () => U.state.set(s));
      bar.appendChild(b);
    });
    const clear = document.getElementById("state-clear");
    clear.addEventListener("click", () => U.state.clear());
    const status = document.getElementById("state-status");
    U.state.on((sel) => {
      bar.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.state === sel)));
      clear.hidden = !sel;
      status.textContent = sel ? `Highlighting ${U.STATE_NAMES[sel]}` : "No state selected";
      STATE_CHARTS.forEach((id) => entries[id] && draw(id));
    });
  }

  /* ---------------------------------------------------------- methods: reconciliation table */
  function mountReconciliation() {
    const el = document.getElementById("recon-table");
    if (!el) return;
    U.dataTable(el, [
      { key: "year", label: "Year" },
      { key: "national", label: "National", num: true, fmt: fmt.int },
      { key: "sumOfStates", label: "Sum of 8 states", num: true, fmt: fmt.int },
      { key: "gap", label: "Gap", num: true, fmt: fmt.int },
      { key: "gapPct", label: "Gap %", num: true, fmt: (v) => fmt.pct(v, 2) },
    ], D.state.reconciliation, "National hospitalisations vs the sum of state T1 totals");
  }

  /* ---------------------------------------------------------- nav */
  /* Section nav: highlight the section currently in view. */
  function mountNav() {
    const links = Array.from(document.querySelectorAll(".site-nav a[href^='#']"));
    const targets = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
    if (targets.length) {
      const io = new IntersectionObserver((items) => {
        items.forEach((it) => {
          if (!it.isIntersecting) return;
          links.forEach((a) => {
            const on = a.getAttribute("href") === "#" + it.target.id;
            a.classList.toggle("active", on);
            if (on) {
              a.setAttribute("aria-current", "true");
              const ul = a.closest("ul"); // keep the active chart visible in the horizontally scrolling sub-nav
              if (ul) ul.scrollLeft = Math.max(0, a.offsetLeft - 24);
            }
            else a.removeAttribute("aria-current");
          });
        });
      }, { rootMargin: "-40% 0px -55% 0px" });
      targets.forEach((t) => io.observe(t));
    }
    const bar = document.getElementById("progress");
    if (!bar) return;
    const onScroll = () => {
      const h = document.documentElement;
      bar.style.transform = `scaleX(${Math.min(1, h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight))})`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function boot() {
    bindStats();
    mountCharts();
    mountStateSelector();
    mountReconciliation();
    mountNav();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
