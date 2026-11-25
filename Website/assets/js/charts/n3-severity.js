/* N3 - Volume vs severity
 * Question: Are the groups hospitalised most often the ones that die in hospital most often?
 * Data:     STORY_DATA.national.roadUserSeverity | national.counterpartySeverity
 *           (shareCases2011_2019, shareDeaths2011_2019, deaths2011_2019, deathsPer1000,
 *            bedDaysPerCase1520, lowN = fewer than 30 deaths -> greyed and flagged)
 * Options:  opts.mode = "roadUser" | "counterparty"
 */
(function () {
  const { fmt, C, ROAD_USER_COLORS: RC } = U;

  function rows(D, mode) {
    const src = mode === "counterparty" ? D.national.counterpartySeverity : D.national.roadUserSeverity;
    return src.map((d) => ({ ...d, gap: d.shareDeaths2011_2019 - d.shareCases2011_2019 }))
      .sort((a, b) => (a.lowN - b.lowN) || (b.gap - a.gap));
  }

  function render(el, D, opts) {
    const mode = opts.mode || "roadUser";
    const W = opts.width, narrow = U.isNarrow(W);
    const data = rows(D, mode);

    U.legend(el, [
      { label: "Share of hospitalised cases", color: C.navy, shape: "dot" },
      { label: "Share of deaths in hospital", color: C.crimson, shape: "dot" },
      { label: "Fewer than 30 deaths (unstable, greyed)", color: "#A9AFB8", shape: "ring" },
    ]);

    const rowH = 46;
    const m = { top: 26, right: narrow ? 16 : 40, bottom: 50, left: 12 };
    const H = m.top + rowH * data.length + m.bottom, iw = W - m.left - m.right;
    const ped = D.national.roadUserSeverity.find((d) => d.category === "Pedestrian");
    const svg = U.svg(el, W, H,
      `Dumbbell chart comparing each ${mode === "counterparty" ? "crash counterparty" : "road user"}'s share of hospitalised cases with its share of deaths in hospital, 2011 to 2019. ` +
      `Pedestrians are ${fmt.pct(ped.shareCases2011_2019)} of cases but ${fmt.pct(ped.shareDeaths2011_2019)} of deaths in hospital.`);
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
    const maxV = d3.max(data, (d) => Math.max(d.shareCases2011_2019, d.shareDeaths2011_2019));
    const x = d3.scaleLinear().domain([0, Math.ceil(maxV / 10) * 10]).range([0, iw]);

    g.append("g").attr("class", "grid").attr("transform", `translate(0,${rowH * data.length})`)
      .call(d3.axisBottom(x).ticks(narrow ? 4 : 6).tickSize(-rowH * data.length).tickFormat("")).call((s) => s.select(".domain").remove());
    U.styleAxis(g.append("g").attr("transform", `translate(0,${rowH * data.length})`)
      .call(d3.axisBottom(x).ticks(narrow ? 4 : 6).tickFormat((d) => d + "%")));
    U.axisTitle(g, 0, -10, mode === "counterparty" ? "What the crash involved (counterparty)" : "Road user", { anchor: "start" });
    U.axisTitle(g, iw / 2, rowH * data.length + 40, "Share of national total, 2011–2019 (%)");

    const row = g.append("g").selectAll("g").data(data).join("g").attr("class", "dumbbell-row")
      .attr("transform", (d, i) => `translate(0,${i * rowH})`);
    // label sits above each dumbbell so long counterparty names never collide
    row.append("text").attr("class", (d) => "row-label" + (d.lowN ? " muted" : "")).attr("x", mode === "roadUser" ? 6 : 0).attr("y", 15)
      .text((d) => d.category + (d.lowN ? `  • ${d.deaths2011_2019} deaths (n < 30)` : ""));
    if (mode === "roadUser") {
      row.append("rect").attr("x", -3).attr("y", 5).attr("width", 4).attr("height", 12).attr("rx", 1)
        .attr("fill", (d) => RC[d.category] || RC.Other);
    }
    const cy = 32;
    row.append("line").attr("x1", (d) => x(d.shareCases2011_2019)).attr("x2", (d) => x(d.shareDeaths2011_2019))
      .attr("y1", cy).attr("y2", cy).attr("stroke", (d) => (d.lowN ? "#D5D9DE" : "#9AA1AC")).attr("stroke-width", 2.5);
    row.append("circle").attr("cx", (d) => x(d.shareCases2011_2019)).attr("cy", cy).attr("r", 6)
      .attr("fill", (d) => (d.lowN ? "#fff" : C.navy)).attr("stroke", (d) => (d.lowN ? "#A9AFB8" : "#fff")).attr("stroke-width", 2);
    row.append("circle").attr("cx", (d) => x(d.shareDeaths2011_2019)).attr("cy", cy).attr("r", 6)
      .attr("fill", (d) => (d.lowN ? "#fff" : C.crimson)).attr("stroke", (d) => (d.lowN ? "#A9AFB8" : "#fff")).attr("stroke-width", 2);
    // value labels for the rows that matter (non-greyed with a visible gap)
    row.filter((d) => !d.lowN && Math.abs(d.gap) >= 3).each(function (d) {
      const r = d3.select(this);
      const left = Math.min(d.shareCases2011_2019, d.shareDeaths2011_2019);
      const right = Math.max(d.shareCases2011_2019, d.shareDeaths2011_2019);
      r.append("text").attr("class", "value-label small").attr("x", x(left) - 10).attr("y", cy + 4).attr("text-anchor", "end")
        .text(fmt.pct(left));
      r.append("text").attr("class", "value-label small").attr("x", x(right) + 10).attr("y", cy + 4).attr("text-anchor", "start")
        .text(fmt.pct(right));
    });
    row.append("rect").attr("x", -m.left).attr("y", 0).attr("width", W).attr("height", rowH).attr("fill", "transparent")
      .on("pointermove pointerdown", function (ev, d) {
        row.classed("dim", (o) => o !== d);
        U.tip.show(ev, `<div class="tt-title">${d.category}</div>` +
          U.tip.row("Share of cases", fmt.pct(d.shareCases2011_2019), C.navy) +
          U.tip.row("Share of deaths in hospital", fmt.pct(d.shareDeaths2011_2019), C.crimson) +
          U.tip.row("Deaths in hospital (n)", fmt.int(d.deaths2011_2019)) +
          U.tip.row("Cases (n)", fmt.int(d.cases2011_2019)) +
          U.tip.row("Deaths per 1,000 cases", fmt.dec(d.deathsPer1000, 1)) +
          U.tip.row("Bed days per case*", fmt.dec(d.bedDaysPerCase1520, 1)) +
          (d.lowN ? `<div class="tt-note">⚠ Fewer than 30 deaths: rate is unstable.</div>` : "") +
          `<div class="tt-note">*Jul 2015–Jun 2020, deaths excluded. Not length of stay.</div>`);
      })
      .on("pointerleave", (ev) => { row.classed("dim", false); U.tip.hide(ev); });
  }

  function table(D, opts) {
    const mode = (opts && opts.mode) || "roadUser";
    return {
      caption: `Severity by ${mode === "counterparty" ? "counterparty" : "road user"}, 2011–2019 (bed days: Jul 2015–Jun 2020)`,
      columns: [
        { key: "category", label: mode === "counterparty" ? "Counterparty" : "Road user" },
        { key: "cases2011_2019", label: "Cases", num: true, fmt: fmt.int },
        { key: "shareCases2011_2019", label: "% of cases", num: true, fmt: (v) => fmt.pct(v) },
        { key: "deaths2011_2019", label: "Deaths in hospital", num: true, fmt: fmt.int },
        { key: "shareDeaths2011_2019", label: "% of deaths", num: true, fmt: (v) => fmt.pct(v) },
        { key: "deathsPer1000", label: "Deaths per 1,000", num: true, fmt: (v) => fmt.dec(v, 1) },
        { key: "bedDaysPerCase1520", label: "Bed days per case", num: true, fmt: (v) => fmt.dec(v, 2) },
      ],
      rows: rows(D, mode),
    };
  }

  Charts.n3 = { render, table, defaults: { mode: "roadUser" } };
})();
