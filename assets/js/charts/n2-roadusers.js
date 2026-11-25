/* N2 - Road-user trends
 * Question: Which road users account for the growth in hospitalisations?
 * Data:     STORY_DATA.national.roadUserByYear (hospitalisations, index2011),
 *           national.roadUserCovid (H1 2019 -> H1 2020 change, shown in the tooltip)
 * Options:  opts.mode = "index" | "count"; opts.focus = road user highlighted (default cyclists)
 */
(function () {
  const { fmt, C, ROAD_USER_COLORS: RC } = U;

  function render(el, D, opts) {
    const mode = opts.mode || "index";
    const order = D.national.roadUserOrder;
    let focus = opts.focus || "Pedal cyclist";
    const W = opts.width, narrow = U.isNarrow(W);
    const covid = Object.fromEntries(D.national.roadUserCovid.map((d) => [d.roadUser, d]));
    const val = (d) => (mode === "index" ? d.index2011 : d.hospitalisations);

    const series = order.map((u) => ({ key: u, values: D.national.roadUserByYear.filter((d) => d.roadUser === u) }));

    // legend as toggle buttons (choose which line is highlighted)
    U.legend(el, order.map((u) => ({ key: u, label: u, color: RC[u], shape: "line" })), {
      active: focus, label: "Highlight a road user",
      onToggle: (k) => { opts.focus = k; opts.rerender(); },
    });

    const labelW = narrow ? 86 : 118;
    const m = { top: 30, right: labelW, bottom: 46, left: narrow ? 40 : 52 };
    const ih = Math.round(Math.max(260, Math.min(380, W * 0.44)));
    const H = m.top + ih + m.bottom, iw = W - m.left - m.right;
    const cyc = series.find((s) => s.key === "Pedal cyclist").values;
    const svg = U.svg(el, W, H,
      `Line chart of national hospitalisations by road user, 2011 to 2021, ${mode === "index" ? "indexed to 2011 equals 100" : "as counts"}. ` +
      `Pedal cyclists rose ${fmt.signed(cyc[cyc.length - 1].index2011 - 100)} (${fmt.int(cyc[0].hospitalisations)} to ${fmt.int(cyc[cyc.length - 1].hospitalisations)}), the fastest of any group. ` +
      `Pedestrians fell, mostly in 2020 and 2021.`);
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

    const x = d3.scaleLinear().domain([2011, 2021]).range([0, iw]);
    const all = series.flatMap((s) => s.values.map(val));
    const y = mode === "index"
      ? d3.scaleLinear().domain([Math.min(70, d3.min(all) - 5), d3.max(all) + 8]).nice().range([ih, 0])
      : d3.scaleLinear().domain([0, d3.max(all) * 1.08]).nice().range([ih, 0]);

    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(6).tickSize(-iw).tickFormat("")).call((s) => s.select(".domain").remove());
    U.styleAxis(g.append("g").call(d3.axisLeft(y).ticks(6).tickFormat(mode === "index" ? d3.format("d") : d3.format("~s"))));
    U.styleAxis(g.append("g").attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(x).tickValues(narrow ? [2011, 2013, 2015, 2017, 2019, 2021] : d3.range(2011, 2022))
        .tickFormat((d) => (narrow ? `'${String(d).slice(2)}` : d)).tickSizeOuter(0)));
    g.append("text").attr("class", "axis-title").attr("x", -m.left + 4).attr("y", -14)
      .text(mode === "index" ? "Index (2011 = 100)" : "Hospitalisations per year");
    U.axisTitle(g, iw / 2, ih + 38, "Year");
    if (mode === "index") {
      g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", y(100)).attr("y2", y(100)).attr("stroke", "#9AA1AC").attr("stroke-width", 1);
    }
    // series-break markers
    [[2012.5, "Vic"], [2017.42, "NSW"]].forEach(([yr, s]) =>
      U.breakMarker(g, x(yr), 0, ih, `${s} change`, { anchor: "start", dy: -2 }));

    const line = d3.line().x((d) => x(d.year)).y((d) => y(val(d)));
    const lines = g.append("g").selectAll("path").data(series).join("path")
      .attr("class", "draw").attr("fill", "none").attr("stroke-linejoin", "round").attr("d", (s) => line(s.values));
    const labels = g.append("g");

    function paint(active) {
      lines.attr("stroke", (s) => (s.key === active ? RC[s.key] : C.context))
        .attr("stroke-width", (s) => (s.key === active ? 3 : 1.5));
      lines.filter((s) => s.key === active).raise();
      // direct end labels, nudged apart
      const items = series.map((s) => ({ s, y: y(val(s.values[s.values.length - 1])) }));
      U.relax(items, 14, 6, ih);
      labels.selectAll("text").data(items).join("text")
        .attr("x", iw + 6).attr("y", (d) => d.y + 4)
        .attr("class", (d) => "end-label" + (d.s.key === active ? " active" : ""))
        .text((d) => {
          const v = val(d.s.values[d.s.values.length - 1]);
          const name = narrow ? d.s.key.replace("Pedal cyclist", "Cyclist").replace("Car passenger", "Car pass.").replace("Motorcyclist", "Motorcycl.") : d.s.key;
          return `${name} ${mode === "index" ? Math.round(v) : fmt.k(v)}`;
        });
    }
    paint(focus);

    // hover: nearest series at the nearest year
    const ring = g.append("circle").attr("r", 6).attr("fill", "none").attr("stroke-width", 2).attr("hidden", true);
    g.append("rect").attr("class", "hit").attr("width", iw).attr("height", ih).attr("fill", "transparent")
      .on("pointermove pointerdown", (ev) => {
        const [px, py] = d3.pointer(ev);
        const yr = Math.max(2011, Math.min(2021, Math.round(x.invert(px))));
        let best = null;
        series.forEach((s) => {
          const d = s.values.find((v) => v.year === yr);
          const dist = Math.abs(y(val(d)) - py);
          if (!best || dist < best.dist) best = { s, d, dist };
        });
        paint(best.s.key);
        ring.attr("cx", x(yr)).attr("cy", y(val(best.d))).attr("stroke", RC[best.s.key]).attr("hidden", null);
        const cv = covid[best.s.key];
        U.tip.show(ev, `<div class="tt-title"><span class="tt-sw" style="background:${RC[best.s.key]}"></span>${best.s.key}, ${yr}</div>` +
          U.tip.row("Hospitalisations", fmt.int(best.d.hospitalisations)) +
          U.tip.row("Index (2011 = 100)", fmt.dec(best.d.index2011, 1)) +
          `<div class="tt-note">Jan–Jun 2020 vs Jan–Jun 2019: <b>${fmt.signed(cv.pctChange)}</b> (${fmt.int(cv.h1_2019)} → ${fmt.int(cv.h1_2020)})</div>`);
      })
      .on("pointerleave", (ev) => { paint(focus); ring.attr("hidden", true); U.tip.hide(ev); });
  }

  function table(D) {
    const years = d3.range(2011, 2022);
    const rows = D.national.roadUserOrder.map((u) => {
      const r = { roadUser: u };
      D.national.roadUserByYear.filter((d) => d.roadUser === u).forEach((d) => { r[d.year] = d.hospitalisations; });
      return r;
    });
    return {
      caption: "National hospitalisations by road user and year",
      columns: [{ key: "roadUser", label: "Road user" }].concat(years.map((y) => ({ key: y, label: String(y), num: true, fmt: fmt.int }))),
      rows,
    };
  }

  Charts.n2 = { render, table, defaults: { mode: "index", focus: "Pedal cyclist" } };
})();
