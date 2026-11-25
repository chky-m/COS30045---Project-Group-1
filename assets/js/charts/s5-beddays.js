/* S5 - Bed days per hospitalisation by state (comparable period only)
 * Question: How does hospital-resource use per case differ across jurisdictions?
 * Data:     STORY_DATA.state.bedDays ({state, bedDaysPerCase1521 (H2 2015-H2 2021),
 *           bedDaysPerCase1520 (H2 2015-H1 2020)}), national.bedDaysNational1520 (reference line)
 * Only the period after the 1 July 2015 bed-day rule change is used. Not "length of stay".
 */
(function () {
  const { fmt, C } = U;

  function render(el, D, opts) {
    const sel = opts.selectedState;
    const W = opts.width, narrow = U.isNarrow(W);
    const data = D.state.bedDays.slice().sort((a, b) => b.bedDaysPerCase1521 - a.bedDaysPerCase1521);
    const nat = D.national.bedDaysNational1520;

    U.legend(el, [
      { label: "Jul 2015–Dec 2021", color: C.navy, shape: "dot" },
      { label: "Jul 2015–Jun 2020 (same window as national)", color: C.navy, shape: "ring" },
      { label: `National, Jul 2015–Jun 2020: ${fmt.dec(nat.bedDaysPerCase, 2)}`, color: "#6B7280", shape: "dash" },
    ]);

    const rowH = 34, lab = 54;
    const m = { top: 40, right: narrow ? 16 : 40, bottom: 58 };
    const H = m.top + rowH * data.length + m.bottom;
    const ih = rowH * data.length;
    const svg = U.svg(el, W, H,
      `Dot plot of bed days per hospitalisation by state of usual residence, July 2015 to December 2021. ` +
      `${data.map((d) => `${d.state} ${fmt.dec(d.bedDaysPerCase1521, 1)}`).join(", ")}. ` +
      `National reference ${fmt.dec(nat.bedDaysPerCase, 1)} for July 2015 to June 2020.`);
    const x = d3.scaleLinear().domain([3, 7]).range([lab, W - m.right]);
    const g = svg.append("g").attr("transform", `translate(0,${m.top})`);

    U.axisTitle(g, 0, -22, "State or territory (usual residence)", { anchor: "start" });
    U.axisTitle(g, (lab + W - m.right) / 2, ih + 34, "Bed days per hospitalisation (deaths in hospital excluded)");
    g.append("g").attr("class", "grid").attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(narrow ? 4 : 8).tickSize(-ih).tickFormat("")).call((s) => s.select(".domain").remove());
    U.styleAxis(g.append("g").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x).ticks(narrow ? 4 : 8)));
    g.append("text").attr("class", "annot").attr("x", x(3)).attr("y", ih + 50).text("Axis starts at 3 to separate the dots.");

    // national reference line
    g.append("line").attr("x1", x(nat.bedDaysPerCase)).attr("x2", x(nat.bedDaysPerCase)).attr("y1", -8).attr("y2", ih)
      .attr("stroke", "#6B7280").attr("stroke-dasharray", "5 3").attr("stroke-width", 1.5);
    g.append("text").attr("class", "annot").attr("x", x(nat.bedDaysPerCase) + 4).attr("y", -8)
      .text(`National ${fmt.dec(nat.bedDaysPerCase, 2)}`);

    const row = g.append("g").selectAll("g").data(data).join("g").attr("class", "bar-row")
      .attr("transform", (d, i) => `translate(0,${i * rowH})`)
      .classed("dim", (d) => sel && d.state !== sel).classed("selected", (d) => d.state === sel);
    row.append("text").attr("class", "row-label").attr("y", rowH / 2 + 4).text((d) => d.state);
    row.append("line").attr("x1", lab).attr("x2", (d) => x(Math.min(d.bedDaysPerCase1521, d.bedDaysPerCase1520)))
      .attr("y1", rowH / 2).attr("y2", rowH / 2).attr("stroke", C.grid).attr("stroke-width", 1);
    row.append("circle").attr("cx", (d) => x(d.bedDaysPerCase1520)).attr("cy", rowH / 2).attr("r", 6.5)
      .attr("fill", "#fff").attr("stroke", C.navy).attr("stroke-width", 1.5);
    row.append("circle").attr("cx", (d) => x(d.bedDaysPerCase1521)).attr("cy", rowH / 2).attr("r", (d) => (d.state === sel ? 7 : 5.5))
      .attr("fill", C.navy).attr("stroke", (d) => (d.state === sel ? C.ink : "#fff")).attr("stroke-width", 1.5);
    // label the solid dot on the side away from its ring so the value is not misread as the ring's
    // a page-coloured box behind each label keeps the dashed national line from running through it
    const ringRight = (d) => d.bedDaysPerCase1520 > d.bedDaysPerCase1521;
    row.append("text").attr("class", "value-label small").attr("y", rowH / 2 + 4)
      .attr("text-anchor", (d) => (ringRight(d) ? "end" : "start"))
      .attr("x", (d) => (ringRight(d) ? x(d.bedDaysPerCase1521) - 10 : x(Math.max(d.bedDaysPerCase1521, d.bedDaysPerCase1520)) + 12))
      .text((d) => fmt.dec(d.bedDaysPerCase1521, 2))
      .each(function () { U.textBg(d3.select(this)); });
    row.append("rect").attr("width", W).attr("height", rowH).attr("fill", "transparent").style("cursor", "pointer")
      .on("click", (ev, d) => U.state.set(d.state))
      .on("pointermove pointerdown", (ev, d) => U.tip.show(ev, `<div class="tt-title">${U.STATE_NAMES[d.state]}</div>` +
        U.tip.row("Bed days per hospitalisation", fmt.dec(d.bedDaysPerCase1521, 2)) +
        U.tip.row("Bed days", fmt.int(d.bedDays1521)) + U.tip.row("Hospitalisations", fmt.int(d.cases1521)) +
        U.tip.row("Jul 2015–Jun 2020 only", fmt.dec(d.bedDaysPerCase1520, 2)) +
        `<div class="tt-note">Jul 2015–Dec 2021 unless stated. Not length of stay.</div>`))
      .on("pointerleave", (ev) => U.tip.hide(ev));
  }

  function table(D) {
    return {
      caption: "Bed days per hospitalisation by state, after the 1 July 2015 bed-day rule change",
      columns: [
        { key: "state", label: "State" },
        { key: "cases1521", label: "Hospitalisations (H2 2015–H2 2021)", num: true, fmt: fmt.int },
        { key: "bedDays1521", label: "Bed days", num: true, fmt: fmt.int },
        { key: "bedDaysPerCase1521", label: "Bed days per hospitalisation", num: true, fmt: (v) => fmt.dec(v, 2) },
        { key: "bedDaysPerCase1520", label: "Same, Jul 2015–Jun 2020", num: true, fmt: (v) => fmt.dec(v, 2) },
      ],
      rows: D.state.bedDays.slice().sort((a, b) => b.bedDaysPerCase1521 - a.bedDaysPerCase1521),
    };
  }

  Charts.s5 = { render, table };
})();
