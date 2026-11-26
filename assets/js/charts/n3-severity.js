/* N3 - Volume vs severity
 * Question: Are the groups hospitalised most often the ones that die in hospital most often?
 * Data:     STORY_DATA.national.roadUserSeverity | national.counterpartySeverity
 *           (shareCases2011_2019, shareDeaths2011_2019, deaths2011_2019, deathsPer1000,
 *            bedDaysPerCase1520, lowN = fewer than 30 deaths -> greyed and flagged)
 * Options:  opts.mode = "roadUser" | "counterparty"
 */
(function () {
  const { fmt, C, ROAD_USER_COLORS: RC } = U;

  // Three groups, each sorted by the size of the mismatch: over-represented in deaths,
  // under-represented, then the unstable (fewer than 30 deaths) rows.
  const GROUPS = [
    { key: "more", title: "More of the deaths than of the cases" },
    { key: "fewer", title: "Fewer of the deaths than of the cases" },
    { key: "lowN", title: "Fewer than 30 deaths: too few to compare reliably" },
  ];
  const groupOf = (d) => (d.lowN ? "lowN" : d.gap > 0 ? "more" : "fewer");

  function rows(D, mode) {
    const src = mode === "counterparty" ? D.national.counterpartySeverity : D.national.roadUserSeverity;
    const order = { more: 0, fewer: 1, lowN: 2 };
    return src.map((d) => ({ ...d, gap: d.shareDeaths2011_2019 - d.shareCases2011_2019 }))
      .map((d) => ({ ...d, group: groupOf(d) }))
      .sort((a, b) => (order[a.group] - order[b.group]) || (Math.abs(b.gap) - Math.abs(a.gap)));
  }

  // text width without needing the svg to be in the layout yet
  const ctx = document.createElement("canvas").getContext("2d");
  function textW(s, weight = 600, size = 13) {
    ctx.font = `${weight} ${size}px ${getComputedStyle(document.body).fontFamily || "sans-serif"}`;
    return ctx.measureText(s).width;
  }
  function wrapWords(s, maxW) {
    const lines = [];
    let cur = "";
    s.split(/\s+/).forEach((w) => {
      const t = cur ? cur + " " + w : w;
      if (cur && textW(t) > maxW) { lines.push(cur); cur = w; } else cur = t;
    });
    lines.push(cur);
    return lines;
  }

  const MORE_LINE = "#D79AA4";   // light crimson: deaths share is higher
  const FEWER_LINE = "#9DB0C8";  // light navy: deaths share is lower
  const LOWN = "#A9AFB8";

  function render(el, D, opts) {
    const mode = opts.mode || "roadUser";
    const W = opts.width, narrow = U.isNarrow(W);
    const data = rows(D, mode);

    U.legend(el, [
      { label: "Share of hospitalised cases", color: C.navy, shape: "ring" },
      { label: "Share of deaths in hospital", color: C.crimson, shape: "dot" },
      { label: "Fewer than 30 deaths (unstable, greyed)", color: LOWN, shape: "ring" },
    ]);

    // Row names sit to the left of their dumbbell on wide screens (wrapped if long),
    // and above it on narrow screens.
    const swatch = mode === "roadUser" ? 10 : 0;
    const labelMax = Math.min(210, W * 0.32);
    data.forEach((d) => {
      d.lines = narrow ? [d.category] : wrapWords(d.category, labelMax - swatch);
      d.nLines = d.lines.length + (d.lowN && !narrow ? 1 : 0);
    });
    const labelW = narrow ? 0 : swatch + d3.max(data, (d) => d3.max(d.lines, (l) => textW(l))) + 14;
    const rowH = narrow ? 46 : Math.max(34, d3.max(data, (d) => d.nLines) * 16 + 12);
    const headH = 30;
    const cy = narrow ? 32 : rowH / 2;

    // y positions, with a header before each non-empty group
    let y = 0;
    const heads = [];
    GROUPS.forEach((grp) => {
      const members = data.filter((d) => d.group === grp.key);
      if (!members.length) return;
      heads.push({ ...grp, y });
      y += headH;
      members.forEach((d) => { d.y = y; y += rowH; });
    });
    const plotH = y;

    // gutter: values near 0% are printed to the left of their dot and need room before the names
    const gutter = 40;
    const m = { top: 26, right: narrow ? 44 : 56, bottom: 50, left: 12 + labelW + gutter };
    const H = m.top + plotH + m.bottom, iw = W - m.left - m.right;
    const ped = D.national.roadUserSeverity.find((d) => d.category === "Pedestrian");
    const svg = U.svg(el, W, H,
      `Dumbbell chart comparing each ${mode === "counterparty" ? "crash counterparty" : "road user"}'s share of hospitalised cases with its share of deaths in hospital, 2011 to 2019, ` +
      `grouped into those with more of the deaths than of the cases and those with fewer. ` +
      `Pedestrians are ${fmt.pct(ped.shareCases2011_2019)} of cases but ${fmt.pct(ped.shareDeaths2011_2019)} of deaths in hospital.`);
    const defs = svg.append("defs");
    const arrowId = (k) => `n3-arrow-${mode}-${k}`;
    [["more", MORE_LINE], ["fewer", FEWER_LINE], ["lowN", "#D5D9DE"]].forEach(([k, c]) => {
      defs.append("marker").attr("id", arrowId(k)).attr("viewBox", "0 0 10 10").attr("refX", 9).attr("refY", 5)
        .attr("markerWidth", 5).attr("markerHeight", 5).attr("orient", "auto-start-reverse")
        .append("path").attr("d", "M0,0 L10,5 L0,10 z").attr("fill", c);
    });

    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
    const maxV = d3.max(data, (d) => Math.max(d.shareCases2011_2019, d.shareDeaths2011_2019));
    const x = d3.scaleLinear().domain([0, Math.ceil(maxV / 10) * 10]).range([0, iw]);

    g.append("g").attr("class", "grid").attr("transform", `translate(0,${plotH})`)
      .call(d3.axisBottom(x).ticks(narrow ? 4 : 6).tickSize(-plotH).tickFormat("")).call((s) => s.select(".domain").remove());
    U.styleAxis(g.append("g").attr("transform", `translate(0,${plotH})`)
      .call(d3.axisBottom(x).ticks(narrow ? 4 : 6).tickFormat((d) => d + "%")));
    U.axisTitle(g, -(labelW + gutter), -10, mode === "counterparty" ? "What the crash involved (counterparty)" : "Road user", { anchor: "start" });
    U.axisTitle(g, iw / 2, plotH + 40, "Share of national total, 2011–2019 (%)");

    // group headers: a page-coloured band so the grid does not run through them
    const head = g.append("g").selectAll("g").data(heads).join("g").attr("transform", (h) => `translate(0,${h.y})`);
    head.append("rect").attr("x", -(labelW + gutter)).attr("y", 2).attr("width", labelW + gutter + iw).attr("height", headH - 6).attr("fill", "#FBFAF7");
    head.append("line").attr("x1", -(labelW + gutter)).attr("x2", iw).attr("y1", headH - 4).attr("y2", headH - 4)
      .attr("stroke", (h) => (h.key === "more" ? C.crimson : h.key === "fewer" ? C.navy : LOWN)).attr("stroke-width", 1.5);
    head.append("text").attr("class", "row-label").attr("x", -(labelW + gutter)).attr("y", headH - 10)
      .attr("fill", (h) => (h.key === "more" ? C.crimson : h.key === "fewer" ? C.navy : "#5E6573"))
      .style("text-transform", "uppercase").style("letter-spacing", "0.04em").style("font-size", "11.5px")
      .text((h) => h.title);

    const row = g.append("g").selectAll("g").data(data).join("g").attr("class", "dumbbell-row")
      .attr("transform", (d) => `translate(0,${d.y})`);

    // row name
    const lx = -(labelW + gutter) + swatch;
    row.append("text").attr("class", (d) => "row-label" + (d.lowN ? " muted" : ""))
      .attr("x", lx).attr("y", (d) => (narrow ? 15 : cy + 4 - (d.nLines - 1) * 8))
      .each(function (d) {
        const t = d3.select(this);
        d.lines.forEach((l, i) => t.append("tspan").attr("x", lx).attr("dy", i ? 16 : 0).text(l));
        if (d.lowN) t.append("tspan").attr("class", "muted").style("font-weight", 400)
          .attr("x", narrow ? null : lx).attr("dy", narrow ? 0 : 16).text(narrow ? `  • ${d.deaths2011_2019} deaths` : `${d.deaths2011_2019} deaths`);
      });
    if (mode === "roadUser") {
      row.append("rect").attr("x", -(labelW + gutter)).attr("y", narrow ? 5 : cy - 6).attr("width", 4).attr("height", 12).attr("rx", 1)
        .attr("fill", (d) => RC[d.category] || RC.Other);
    }
    // line from cases to deaths, with an arrowhead pointing at the deaths dot
    const R = 6;
    row.append("line")
      .attr("x1", (d) => x(d.shareCases2011_2019))
      .attr("x2", (d) => {
        const a = x(d.shareCases2011_2019), b = x(d.shareDeaths2011_2019);
        const dir = Math.sign(b - a);
        return Math.abs(b - a) > 2 * R + 8 ? b - dir * (R + 2) : b;
      })
      .attr("y1", cy).attr("y2", cy)
      .attr("stroke", (d) => (d.lowN ? "#D5D9DE" : d.gap > 0 ? MORE_LINE : FEWER_LINE)).attr("stroke-width", 3)
      .attr("marker-end", (d) => (Math.abs(x(d.shareDeaths2011_2019) - x(d.shareCases2011_2019)) > 2 * R + 8 ? `url(#${arrowId(d.group)})` : null));
    // cases: open navy ring; deaths: filled crimson dot (shape and colour both differ)
    row.append("circle").attr("cx", (d) => x(d.shareCases2011_2019)).attr("cy", cy).attr("r", R - 1)
      .attr("fill", "#fff").attr("stroke", (d) => (d.lowN ? LOWN : C.navy)).attr("stroke-width", 2.5);
    row.append("circle").attr("cx", (d) => x(d.shareDeaths2011_2019)).attr("cy", cy).attr("r", R)
      .attr("fill", (d) => (d.lowN ? LOWN : C.crimson)).attr("stroke", "#fff").attr("stroke-width", 1.5);

    // every row gets both values, each on the outer side of its dot and in its dot's colour
    row.each(function (d) {
      const r = d3.select(this);
      const casesLeft = d.shareCases2011_2019 <= d.shareDeaths2011_2019;
      const put = (v, onLeft, color) => r.append("text").attr("class", "value-label small")
        .attr("x", x(v) + (onLeft ? -(R + 5) : R + 5)).attr("y", cy + 4).attr("text-anchor", onLeft ? "end" : "start")
        .attr("fill", d.lowN ? "#5E6573" : color).text(fmt.pct(v));
      put(d.shareCases2011_2019, casesLeft, C.navy);
      put(d.shareDeaths2011_2019, !casesLeft, C.crimson);
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
