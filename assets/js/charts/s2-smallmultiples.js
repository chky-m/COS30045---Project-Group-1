/* S2 - Half-yearly small multiples by state
 * Question: What do half-yearly series reveal that annual totals hide (break steps, the 2020 dip,
 *           volatility in small jurisdictions)?
 * Data:     STORY_DATA.state.halfYearly ({state, year, half, period, hospitalisations})
 * Options:  opts.scale = "own" (default; each panel has its own y-scale) | "shared"
 * Shading:  NSW from Jun 2017; Victoria before Jul 2012. Annotated steps computed from the data.
 */
(function () {
  const { fmt, C } = U;

  function render(el, D, opts) {
    const scale = opts.scale || "own", sel = opts.selectedState;
    const W = opts.width, narrow = U.isNarrow(W);
    const states = D.state.states;
    const byState = d3.group(D.state.halfYearly.map((d) => ({ ...d, date: U.halfDate(d.year, d.half) })), (d) => d.state);
    const v = (s, p) => byState.get(s).find((d) => d.period === p).hospitalisations;
    const nswStep = ((v("NSW", "2018 H1") - v("NSW", "2017 H1")) / v("NSW", "2017 H1")) * 100;
    const vicStep = ((v("Vic", "2012 H2") - v("Vic", "2012 H1")) / v("Vic", "2012 H1")) * 100;

    U.legend(el, [
      { label: "Hospitalisations per half-year", color: C.navy, shape: "line" },
      { label: "Affected by a reporting change", color: "#6B7280", shape: "hatch" },
    ]);
    d3.select(el).append("p").attr("class", "chart-note")
      .text(scale === "own" ? "Each panel has its own y-scale (min–max labelled): compare shapes, not heights."
        : "All panels share one y-scale: compare sizes; small jurisdictions flatten.");

    const cols = W < 560 ? 2 : 4;
    const gapX = narrow ? 14 : 22, gapY = 26;
    const pw = (W - gapX * (cols - 1)) / cols, ph = Math.round(Math.max(110, Math.min(150, pw * 0.62)));
    const pm = { top: 34, right: 6, bottom: 18, left: 34 };
    const rowsN = Math.ceil(states.length / cols);
    const titleH = 22, footH = 30;
    const H = titleH + rowsN * (pm.top + ph + pm.bottom) + (rowsN - 1) * gapY + footH;
    const svg = U.svg(el, W, H,
      `Eight small line charts of half-yearly hospitalisations by state of usual residence, 2011 to 2021, ${scale === "own" ? "each with its own scale" : "on a shared scale"}. ` +
      `NSW steps down after its June 2017 counting change (Jan–Jun 2018 ${fmt.signed(nswStep)} on Jan–Jun 2017). ` +
      `Victoria drops ${fmt.signed(vicStep)} from the first to the second half of 2012 after its counting change.`);
    const hatch = U.hatch(svg, "s2-hatch", "#9AA1AC");
    const iw = pw - pm.left - pm.right;
    const x = d3.scaleTime().domain([new Date(2011, 0, 1), new Date(2022, 0, 1)]).range([0, iw]);
    const sharedMax = d3.max(D.state.halfYearly, (d) => d.hospitalisations);
    const crosshairs = [];

    U.axisTitle(svg, 0, 14, "Hospitalisations per half-year, by state of usual residence (y-axis in each panel)", { anchor: "start" });
    U.axisTitle(svg, W / 2, H - 8, "Half-year, 2011–2021");
    states.forEach((s, i) => {
      const data = byState.get(s);
      const cx = (i % cols) * (pw + gapX), cy = titleH + Math.floor(i / cols) * (pm.top + ph + pm.bottom + gapY);
      const p = svg.append("g").attr("class", "panel").attr("transform", `translate(${cx},${cy})`)
        .classed("dim", sel && sel !== s).classed("selected", sel === s);
      const g = p.append("g").attr("transform", `translate(${pm.left},${pm.top})`);
      const ext = d3.extent(data, (d) => d.hospitalisations);
      const y = scale === "own"
        ? d3.scaleLinear().domain([ext[0] * 0.92, ext[1] * 1.05]).range([ph, 0])
        : d3.scaleLinear().domain([0, sharedMax * 1.05]).range([ph, 0]);

      if (sel === s) p.append("rect").attr("x", -6).attr("y", 2).attr("width", pw + 10).attr("height", pm.top + ph + pm.bottom + 4)
        .attr("rx", 8).attr("fill", "none").attr("stroke", C.ink).attr("stroke-width", 1.5);
      p.append("text").attr("class", "panel-title").attr("x", pm.left - 30).attr("y", 18).text(s);
      p.append("text").attr("class", "annot").attr("x", pw - 2).attr("y", 18).attr("text-anchor", "end")
        .text(scale === "own" ? `${fmt.int(ext[0])}–${fmt.int(ext[1])}` : "shared scale");

      // break shading
      const shade = (d0, d1) => g.append("rect").attr("x", x(d0)).attr("width", x(d1) - x(d0)).attr("height", ph).attr("fill", hatch).attr("opacity", 0.7);
      if (s === "NSW") shade(new Date(2017, 5, 1), new Date(2022, 0, 1));
      if (s === "Vic") shade(new Date(2011, 0, 1), new Date(2012, 6, 1));

      g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(3).tickSize(-iw).tickFormat("")).call((q) => q.select(".domain").remove());
      U.styleAxis(g.append("g").call(d3.axisLeft(y).ticks(3).tickFormat(d3.format("~s"))));
      U.styleAxis(g.append("g").attr("transform", `translate(0,${ph})`)
        .call(d3.axisBottom(x).tickValues([new Date(2011, 0, 1), new Date(2016, 0, 1), new Date(2021, 0, 1)]).tickFormat(d3.timeFormat("%Y")).tickSizeOuter(0)));
      g.append("path").datum(data).attr("fill", "none").attr("stroke", C.navy).attr("stroke-width", sel === s ? 2.5 : 1.75)
        .attr("d", d3.line().x((d) => x(d.date)).y((d) => y(d.hospitalisations)));

      // step annotations
      if (s === "NSW" && scale === "own") {
        const d = data.find((q) => q.period === "2018 H1");
        g.append("circle").attr("cx", x(d.date)).attr("cy", y(d.hospitalisations)).attr("r", 3.5).attr("fill", C.navy);
        U.note(g, x(d.date) - 4, y(d.hospitalisations) + 18, narrow ? [fmt.signed(nswStep)] : [`H1 2018 ${fmt.signed(nswStep)}`, "vs H1 2017"], "end");
      }
      if (s === "Vic" && scale === "own") {
        const d = data.find((q) => q.period === "2012 H2");
        g.append("circle").attr("cx", x(d.date)).attr("cy", y(d.hospitalisations)).attr("r", 3.5).attr("fill", C.navy);
        U.note(g, x(d.date) + 8, y(d.hospitalisations) + (narrow ? -6 : 4), narrow ? [fmt.signed(vicStep)] : [`H2 2012 ${fmt.signed(vicStep)}`, "vs H1 2012"], "start");
      }

      const ch = g.append("g").attr("hidden", true);
      ch.append("line").attr("class", "crosshair").attr("y1", 0).attr("y2", ph);
      ch.append("circle").attr("r", 4).attr("fill", C.navy).attr("stroke", "#fff").attr("stroke-width", 1.5);
      crosshairs.push({ s, ch, y, data });

      const bis = d3.bisector((d) => d.date).center;
      g.append("rect").attr("class", "hit").attr("width", iw).attr("height", ph).attr("fill", "transparent").style("cursor", "pointer")
        .on("pointermove pointerdown", (ev) => {
          const [px] = d3.pointer(ev);
          const idx = bis(data, x.invert(px));
          crosshairs.forEach((c) => {
            const d = c.data[idx];
            c.ch.attr("hidden", null);
            c.ch.select("line").attr("x1", x(d.date)).attr("x2", x(d.date));
            c.ch.select("circle").attr("cx", x(d.date)).attr("cy", c.y(d.hospitalisations));
          });
          const d = data[idx], prev = data[idx - 2];
          U.tip.show(ev, `<div class="tt-title">${U.STATE_NAMES[s]}, ${d.half} ${d.year}</div>` +
            U.tip.row("Hospitalisations", fmt.int(d.hospitalisations)) +
            (prev ? U.tip.row("vs same half a year earlier", fmt.signed(((d.hospitalisations - prev.hospitalisations) / prev.hospitalisations) * 100)) : "") +
            (s === "NSW" && d.date > new Date(2017, 5, 1) ? `<div class="tt-note">⚠ After the NSW counting change (Jun 2017).</div>` : "") +
            (s === "Vic" && d.date < new Date(2012, 6, 1) ? `<div class="tt-note">⚠ Before the Vic counting change (Jul 2012).</div>` : ""));
        })
        .on("pointerleave", (ev) => { crosshairs.forEach((c) => c.ch.attr("hidden", true)); U.tip.hide(ev); })
        .on("click", () => U.state.set(s));
    });
  }

  function table(D) {
    const periods = D.state.halfYearly.filter((d) => d.state === "NSW").map((d) => d.period);
    const rows = periods.map((p) => {
      const r = { period: p };
      D.state.halfYearly.filter((d) => d.period === p).forEach((d) => { r[d.state] = d.hospitalisations; });
      return r;
    });
    return {
      caption: "Half-yearly hospitalisations by state of usual residence",
      columns: [{ key: "period", label: "Half-year" }].concat(D.state.states.map((s) => ({ key: s, label: s, num: true, fmt: fmt.int }))),
      rows,
    };
  }

  Charts.s2 = { render, table, defaults: { scale: "own" } };
})();
