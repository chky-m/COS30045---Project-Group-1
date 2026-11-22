/* F1 - First Nations vs non-Indigenous hospitalisations over time
 * Question: How did road-crash hospitalisation counts change for First Nations and
 *           non-Indigenous people between 2011 and 2021?
 * Data:     STORY_DATA.firstNations.annual ({year, firstNations, nonIndigenous, fnIndex, niIndex, fnShare})
 *           annual totals = sum of the t5 counterparty table (matches workbook Table 1).
 * Modes:    "index" (2011 = 100, both populations) | "share" (First Nations share of the two populations combined)
 */
(function () {
  const { fmt, C } = U;
  const FN_C = "#7B3294", NI_C = "#6B7280";
  const date = (y) => new Date(y, 6, 1);

  function render(el, D, opts) {
    const W = opts.width, narrow = U.isNarrow(W), mode = opts.mode;
    const data = D.firstNations.annual;
    const first = data[0], last = data[data.length - 1];
    const peak = data.reduce((a, b) => (b.firstNations > a.firstNations ? b : a));

    U.legend(el, mode === "index"
      ? [{ label: "First Nations people", color: FN_C, shape: "line" }, { label: "Non-Indigenous people", color: NI_C, shape: "line" }]
      : [{ label: "First Nations share of hospitalisations (First Nations + non-Indigenous)", color: FN_C, shape: "line" }]);

    const m = { top: 30, right: narrow ? 64 : 120, bottom: 50, left: 44 };
    const H = narrow ? 300 : 360, iw = W - m.left - m.right, ih = H - m.top - m.bottom;
    const label = mode === "index"
      ? `Line chart of road-crash hospitalisations indexed to 2011 = 100. First Nations people rose from ${fmt.int(first.firstNations)} to ${fmt.int(last.firstNations)} (index ${fmt.dec(last.fnIndex, 0)}), non-Indigenous people from ${fmt.int(first.nonIndigenous)} to ${fmt.int(last.nonIndigenous)} (index ${fmt.dec(last.niIndex, 0)}).`
      : `Line chart of the First Nations share of hospitalisations, rising from ${fmt.pct(first.fnShare, 1)} in 2011 to ${fmt.pct(last.fnShare, 1)} in 2021.`;
    const svg = U.svg(el, W, H, label);
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

    const x = d3.scaleTime().domain([new Date(2011, 0, 1), new Date(2022, 0, 1)]).range([0, iw]);
    const series = mode === "index"
      ? [{ key: "fn", name: "First Nations people", color: FN_C, v: (d) => d.fnIndex, n: (d) => d.firstNations },
         { key: "ni", name: "Non-Indigenous people", color: NI_C, v: (d) => d.niIndex, n: (d) => d.nonIndigenous }]
      : [{ key: "fn", name: "First Nations share", color: FN_C, v: (d) => d.fnShare, n: (d) => d.firstNations }];
    const yMax = d3.max(series, (s) => d3.max(data, s.v));
    const yMin = mode === "index" ? 80 : 0;
    const y = d3.scaleLinear().domain([yMin, yMax * 1.08]).nice().range([ih, 0]);

    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-iw).tickFormat("")).call((s) => s.select(".domain").remove());
    U.styleAxis(g.append("g").attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(d3.timeYear.every(narrow ? 2 : 1)).tickFormat(d3.timeFormat("%Y"))));
    U.styleAxis(g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat((v) => (mode === "share" ? v + "%" : v))));
    g.append("text").attr("class", "axis-title").attr("x", -m.left).attr("y", -14)
      .text(mode === "index" ? "Index (2011 = 100)" : "% of First Nations + non-Indigenous hospitalisations");
    U.axisTitle(g, iw / 2, ih + 40, "Year");
    if (mode === "index") {
      g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", y(100)).attr("y2", y(100)).attr("stroke", "#9AA1AC").attr("stroke-dasharray", "2 3");
    }

    // reporting changes affect both populations
    U.breakMarker(g, x(new Date(2012, 6, 1)), 0, ih, narrow ? "Vic" : ["Jul 2012", "Vic counting change"]);
    U.breakMarker(g, x(new Date(2017, 5, 1)), 0, ih, narrow ? "NSW" : ["Jun 2017", "NSW counting change"]);

    const line = (s) => d3.line().x((d) => x(date(d.year))).y((d) => y(s.v(d)));
    series.forEach((s) => {
      g.append("path").datum(data).attr("fill", "none").attr("stroke", s.color).attr("stroke-width", s.key === "fn" ? 3 : 2.2).attr("d", line(s));
      g.append("g").selectAll("circle").data(data).join("circle").attr("cx", (d) => x(date(d.year))).attr("cy", (d) => y(s.v(d)))
        .attr("r", 3).attr("fill", s.color);
    });

    // end labels
    const ends = series.map((s) => ({ s, y: y(s.v(last)) }));
    U.relax(ends, 30, 0, ih);
    ends.forEach(({ s, y: ly }) => {
      const t = g.append("text").attr("class", "end-label active").attr("x", iw + 8).attr("y", ly + 4).attr("fill", s.color);
      t.append("tspan").attr("x", iw + 8).text(mode === "index" ? fmt.dec(s.v(last), 0) : fmt.pct(s.v(last), 1));
      if (!narrow) t.append("tspan").attr("x", iw + 8).attr("dy", 14).text(mode === "index" ? (s.key === "fn" ? "First Nations" : "Non-Indigenous") : "2021");
    });

    // peak annotation (First Nations count peaked in 2020)
    if (mode === "index") {
      const px = x(date(peak.year)), py = y(peak.fnIndex);
      const t = U.note(g, px, py - 12, narrow ? `Peak ${fmt.int(peak.firstNations)}` : `Peak: ${fmt.int(peak.firstNations)} in ${peak.year}`, narrow ? "end" : "middle");
      U.textBg(t);
    }

    // hover: vertical crosshair + tooltip for the nearest year
    const cross = g.append("line").attr("class", "crosshair").attr("y1", 0).attr("y2", ih).style("opacity", 0);
    g.append("rect").attr("width", iw).attr("height", ih).attr("fill", "transparent")
      .on("pointermove pointerdown", (ev) => {
        const [mx] = d3.pointer(ev);
        const yr = Math.max(2011, Math.min(2021, Math.round(x.invert(mx).getFullYear() + (x.invert(mx).getMonth() - 6) / 12)));
        const d = data.find((r) => r.year === yr);
        cross.attr("x1", x(date(yr))).attr("x2", x(date(yr))).style("opacity", 1);
        U.tip.show(ev, `<div class="tt-title">${yr}</div>` +
          U.tip.row("First Nations people", fmt.int(d.firstNations), FN_C) +
          U.tip.row("Non-Indigenous people", fmt.int(d.nonIndigenous), NI_C) +
          (mode === "index"
            ? U.tip.row("Index FN / non-Ind.", `${fmt.dec(d.fnIndex, 0)} / ${fmt.dec(d.niIndex, 0)}`)
            : U.tip.row("First Nations share", fmt.pct(d.fnShare, 2))) +
          (yr >= 2017 ? `<div class="tt-note">NSW counting change from Jun 2017 affects both populations.</div>` : ""));
      })
      .on("pointerleave", (ev) => { cross.style("opacity", 0); U.tip.hide(ev); });
  }

  function table(D) {
    return {
      caption: "Road-crash hospitalisations by First Nations status, 2011–2021 (counts, index 2011 = 100, First Nations share)",
      columns: [
        { key: "year", label: "Year" },
        { key: "firstNations", label: "First Nations", num: true, fmt: fmt.int },
        { key: "nonIndigenous", label: "Non-Indigenous", num: true, fmt: fmt.int },
        { key: "fnIndex", label: "FN index", num: true, fmt: (v) => fmt.dec(v, 1) },
        { key: "niIndex", label: "Non-Ind. index", num: true, fmt: (v) => fmt.dec(v, 1) },
        { key: "fnShare", label: "FN share", num: true, fmt: (v) => fmt.pct(v, 2) },
      ],
      rows: D.firstNations.annual,
    };
  }

  Charts.f1 = { render, table, defaults: { mode: "index" } };
})();
