/* N1 - Trend
 * Question: How did road-crash hospitalisations change 2011-2021, and which movements are
 *           reporting changes rather than real change?
 * Data:     STORY_DATA.national.halfYearly (default), national.yearly (annual toggle),
 *           national.yearly[].deathsPer1000 (secondary panel, 2011-2019 only)
 * Options:  opts.mode = "half" | "annual"
 */
(function () {
  const { fmt, C } = U;

  const MARKERS = [
    { date: new Date(2012, 6, 1), label: "Jul 2012: Vic counting change" },
    { date: new Date(2017, 5, 1), label: "Jun 2017: NSW counting change" },
    { date: new Date(2020, 6, 1), label: "Jul 2020: death fields end", anchor: "end" },
  ];

  function series(D, mode) {
    if (mode === "annual") {
      return D.national.yearly.map((d, i, a) => ({
        date: new Date(d.year, 6, 1), label: String(d.year), value: d.hospitalisations,
        prev: i ? a[i - 1].hospitalisations : null, prevLabel: i ? String(a[i - 1].year) : null,
      }));
    }
    const hy = D.national.halfYearly;
    return hy.map((d, i) => ({
      date: U.halfDate(d.year, d.half), label: `${d.half === "H1" ? "Jan–Jun" : "Jul–Dec"} ${d.year}`,
      value: d.hospitalisations,
      prev: i >= 2 ? hy[i - 2].hospitalisations : null,
      prevLabel: i >= 2 ? `same half of ${hy[i - 2].year}` : null,
    }));
  }

  function render(el, D, opts) {
    const mode = opts.mode || "half";
    const W = opts.width, narrow = U.isNarrow(W);
    const m = { top: 62, right: narrow ? 12 : 24, bottom: 46, left: narrow ? 44 : 56 };
    const h1 = Math.round(Math.max(240, Math.min(360, W * 0.42)));
    const gap = 92, h2 = 120;
    const H = m.top + h1 + gap + h2 + m.bottom;
    const iw = W - m.left - m.right;
    const data = series(D, mode);
    const win = Object.fromEntries(D.national.windows.map((d) => [d.window, d]));
    const yr = (y) => D.national.yearly.find((d) => d.year === y);
    // pooled deaths per 1,000 cases either side of the NSW Jun 2017 change (cases = hospitalisations + died, pre-Jul 2020)
    const pooled = (a, b) => {
      const ys = D.national.yearly.filter((d) => d.year >= a && d.year <= b && d.diedCases != null);
      return (d3.sum(ys, (d) => d.diedCases) / d3.sum(ys, (d) => d.hospitalisations + d.diedCases)) * 1000;
    };
    const avgA = pooled(2011, 2016), avgB = pooled(2017, 2019);

    const svg = U.svg(el, W, H,
      `Line chart of national road-crash hospitalisations, ${mode === "annual" ? "annual" : "half-yearly"}, 2011 to 2021. ` +
      `Up ${fmt.signed(win["2011-2021"].pctChange)} from ${fmt.int(win["2011-2021"].from)} in 2011 to ${fmt.int(win["2011-2021"].to)} in 2021, ` +
      `flat since 2018 (${fmt.signed(win["2018-2021"].pctChange)}). Dip in the first half of 2020 coincides with COVID-19 restrictions. ` +
      `A second panel shows deaths in hospital per 1,000 cases, from ${fmt.dec(yr(2011).deathsPer1000)} in 2011 to ${fmt.dec(yr(2019).deathsPer1000)} in 2019, an indicative and uneven series: ` +
      `the 2011–2016 average is ${fmt.dec(avgA)} and the 2017–2019 average ${fmt.dec(avgB)}, with the largest step coinciding with the NSW counting change in June 2017.`);

    const x = d3.scaleTime().domain([new Date(2011, 0, 1), new Date(2022, 0, 1)]).range([0, iw]);
    const y = d3.scaleLinear().domain([0, d3.max(data, (d) => d.value) * 1.1]).nice().range([h1, 0]);
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

    // grid + axes
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-iw).tickFormat(""))
      .call((s) => s.select(".domain").remove());
    U.styleAxis(g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(narrow ? d3.format("~s") : d3.format(","))));
    U.styleAxis(g.append("g").attr("transform", `translate(0,${h1})`)
      .call(d3.axisBottom(x).ticks(d3.timeYear.every(narrow ? 2 : 1)).tickFormat(d3.timeFormat(narrow ? "'%y" : "%Y")).tickSizeOuter(0)));
    g.append("text").attr("class", "axis-title").attr("x", -m.left + 4).attr("y", -m.top + 12)
      .text(mode === "annual" ? "Hospitalisations per year" : "Hospitalisations per half-year");
    U.axisTitle(g, iw / 2, h1 + 36, mode === "annual" ? "Year" : "Half-year (Jan–Jun, Jul–Dec)");

    // break markers (labels stacked in the top margin)
    MARKERS.forEach((mk, i) => {
      const mx = x(mk.date);
      const mg = g.append("g");
      mg.append("line").attr("x1", mx).attr("x2", mx).attr("y1", -24).attr("y2", h1)
        .attr("stroke", C.annot).attr("stroke-dasharray", "4 3");
      const anchor = mk.anchor || (mx > iw * 0.5 ? "end" : "start");
      U.textBg(mg.append("text").attr("class", "annot").attr("x", mx + (anchor === "end" ? -4 : 4))
        .attr("y", -30 + i * 13).attr("text-anchor", anchor)
        .text("⚠ " + (narrow ? mk.label.replace(" counting change", " change") : mk.label)));
    });

    // line
    const line = d3.line().x((d) => x(d.date)).y((d) => y(d.value));
    g.append("path").datum(data).attr("class", "draw").attr("fill", "none").attr("stroke", C.navy)
      .attr("stroke-width", 2.25).attr("stroke-linejoin", "round").attr("d", line);
    g.append("g").selectAll("circle").data(data).join("circle")
      .attr("cx", (d) => x(d.date)).attr("cy", (d) => y(d.value)).attr("r", mode === "annual" ? 4 : 3)
      .attr("fill", C.navy).attr("stroke", "#fff").attr("stroke-width", 1.5);

    // COVID annotation on the 2020 (H1) point
    const dip = data.find((d) => (mode === "annual" ? d.label === "2020" : d.label === "Jan–Jun 2020"));
    const dx = x(dip.date), dy = y(dip.value);
    // angled leader so it never sits on the Jul 2020 rule (annual 2020 point is at mid-year)
    g.append("line").attr("x1", dx - 3).attr("x2", dx - 16).attr("y1", dy + 6).attr("y2", dy + 32).attr("stroke", C.annot);
    const hv = (p) => D.national.halfYearly.find((d) => d.period === p).hospitalisations;
    const covidPct = fmt.signed(((hv("2020 H1") - hv("2019 H1")) / hv("2019 H1")) * 100);
    const covidLines = mode === "annual"
      ? (narrow ? ["2020 dip coincides", "with COVID-19 restrictions"] : ["2020 dip coincides with COVID-19 restrictions"])
      : (narrow ? [`H1 2020 dip (${covidPct})`, "coincides with COVID-19", "restrictions"]
                : [`Jan–Jun 2020 dip (${covidPct} vs Jan–Jun 2019)`, "coincides with COVID-19 restrictions"]);
    U.textBg(U.note(g, dx - 18, dy + 46, covidLines, "end"));

    // endpoint label
    const last = data[data.length - 1], first = data[0];
    g.append("text").attr("class", "value-label").attr("x", x(first.date)).attr("y", y(first.value) + 20)
      .attr("text-anchor", "start").text(fmt.int(first.value));
    U.textBg(g.append("text").attr("class", "value-label").attr("x", x(last.date) + 4).attr("y", y(last.value) + 20)
      .attr("text-anchor", "end").text(fmt.int(last.value)));

    // hover layer: crosshair + tooltip
    const cross = g.append("line").attr("class", "crosshair").attr("y1", 0).attr("y2", h1).attr("hidden", true);
    const dot = g.append("circle").attr("r", 6).attr("fill", "none").attr("stroke", C.navy).attr("stroke-width", 2).attr("hidden", true);
    const bis = d3.bisector((d) => d.date).center;
    g.append("rect").attr("class", "hit").attr("width", iw).attr("height", h1).attr("fill", "transparent")
      .on("pointermove pointerdown", (ev) => {
        const [px] = d3.pointer(ev);
        const d = data[bis(data, x.invert(px))];
        cross.attr("x1", x(d.date)).attr("x2", x(d.date)).attr("hidden", null);
        dot.attr("cx", x(d.date)).attr("cy", y(d.value)).attr("hidden", null);
        const ch = d.prev ? ((d.value - d.prev) / d.prev) * 100 : null;
        U.tip.show(ev, `<div class="tt-title">${d.label}</div>` +
          U.tip.row("Hospitalisations", fmt.int(d.value)) +
          (ch != null ? U.tip.row(`vs ${d.prevLabel}`, fmt.signed(ch)) : ""));
      })
      .on("pointerleave", (ev) => { cross.attr("hidden", true); dot.attr("hidden", true); U.tip.hide(ev); });

    // ---- secondary panel: deaths in hospital per 1,000 cases (2011-2019)
    const g2 = svg.append("g").attr("transform", `translate(${m.left},${m.top + h1 + gap})`);
    const dd = D.national.yearly.filter((d) => d.deathsPer1000 != null)
      .map((d) => ({ date: new Date(d.year, 6, 1), year: d.year, v: d.deathsPer1000, n: d.diedCases }));
    const y2 = d3.scaleLinear().domain([0, 9]).range([h2, 0]);
    g2.append("text").attr("class", "panel-title").attr("x", -m.left + 4).attr("y", -26)
      .text("Deaths in hospital per 1,000 cases");
    g2.append("text").attr("class", "annot").attr("x", -m.left + 4).attr("y", -11)
      .text("Indicative; uneven series. Full years 2011–2019 only.");
    g2.append("g").attr("class", "grid").call(d3.axisLeft(y2).ticks(3).tickSize(-iw).tickFormat(""))
      .call((s) => s.select(".domain").remove());
    U.styleAxis(g2.append("g").call(d3.axisLeft(y2).ticks(3)));
    U.axisTitle(g2, iw / 2, h2 + 36, "Year");
    U.styleAxis(g2.append("g").attr("transform", `translate(0,${h2})`)
      .call(d3.axisBottom(x).ticks(d3.timeYear.every(narrow ? 2 : 1)).tickFormat(d3.timeFormat(narrow ? "'%y" : "%Y")).tickSizeOuter(0)));
    // the same Vic / NSW break rules continue through this panel
    MARKERS.slice(0, 2).forEach((mk) => g2.append("line").attr("x1", x(mk.date)).attr("x2", x(mk.date)).attr("y1", 0).attr("y2", h2)
      .attr("stroke", C.annot).attr("stroke-dasharray", "4 3"));
    g2.append("path").datum(dd).attr("fill", "none").attr("stroke", C.crimson).attr("stroke-width", 2)
      .attr("d", d3.line().x((d) => x(d.date)).y((d) => y2(d.v)));
    // period averages either side of the NSW change (labels above the dotted average line)
    const xN = x(MARKERS[1].date);
    [[x(new Date(2011, 0, 1)), xN, avgA, "2011–16 avg"], [xN, x(new Date(2020, 0, 1)), avgB, "2017–19 avg"]].forEach(([a, b, v, l]) => {
      g2.insert("line", "path").attr("x1", a + 2).attr("x2", b - 2).attr("y1", y2(v)).attr("y2", y2(v))
        .attr("stroke", C.crimson).attr("stroke-opacity", 0.55).attr("stroke-dasharray", "2 3").attr("stroke-width", 1.5);
      U.textBg(g2.append("text").attr("class", "annot").attr("x", (a + b) / 2).attr("y", y2(v) - 8).attr("text-anchor", "middle")
        .text(`${narrow ? "avg" : l} ${fmt.dec(v)}`));
    });
    const pts = g2.append("g").selectAll("g").data(dd).join("g").attr("transform", (d) => `translate(${x(d.date)},${y2(d.v)})`);
    pts.append("circle").attr("r", 3.5).attr("fill", C.crimson).attr("stroke", "#fff").attr("stroke-width", 1.5);
    pts.append("circle").attr("r", 12).attr("fill", "transparent")
      .on("pointermove pointerdown", (ev, d) => U.tip.show(ev, `<div class="tt-title">${d.year}</div>` +
        U.tip.row("Deaths per 1,000 cases", fmt.dec(d.v, 1)) + U.tip.row("Deaths in hospital (n)", fmt.int(d.n))))
      .on("pointerleave", (ev) => U.tip.hide(ev));
    // endpoint labels + "no data" note
    [dd[0], dd[dd.length - 1]].forEach((d, i) => g2.append("text").attr("class", "value-label sev")
      .attr("x", x(d.date) + (i ? 6 : 0)).attr("y", y2(d.v) - 9).attr("text-anchor", "start").text(fmt.dec(d.v, 1)));
    const x2020 = x(new Date(2020, 0, 1));
    g2.append("rect").attr("x", x2020).attr("y", 0).attr("width", iw - x2020).attr("height", h2).attr("fill", U.hatch(svg, "n1-nodata", "#B8BDC5"));
    U.note(g2, x2020 + (iw - x2020) / 2, h2 / 2 - 4, narrow ? ["no", "data"] : ["not", "available"], "middle");
  }

  function table(D, opts) {
    if (opts && opts.mode === "annual") {
      return {
        caption: "National hospitalisations by year, with deaths in hospital where available",
        columns: [
          { key: "year", label: "Year" },
          { key: "hospitalisations", label: "Hospitalisations", num: true, fmt: fmt.int },
          { key: "diedCases", label: "Deaths in hospital", num: true, fmt: (v) => (v == null ? "not available" : fmt.int(v)) },
          { key: "deathsPer1000", label: "Deaths per 1,000 cases", num: true, fmt: (v) => (v == null ? "not available" : fmt.dec(v, 2)) },
        ],
        rows: D.national.yearly,
      };
    }
    return {
      caption: "National hospitalisations by half-year, with deaths in hospital where available",
      columns: [
        { key: "period", label: "Half-year" },
        { key: "hospitalisations", label: "Hospitalisations", num: true, fmt: fmt.int },
        { key: "diedCases", label: "Deaths in hospital", num: true, fmt: (v) => (v == null ? "not available" : fmt.int(v)) },
      ],
      rows: D.national.halfYearly,
    };
  }

  Charts.n1 = { render, table, defaults: { mode: "half" } };
})();
