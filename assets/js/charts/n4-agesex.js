/* N4 - Age and sex
 * Question: Who carries the volume of hospitalisations, and who carries the severity?
 * Data:     STORY_DATA.national.ageSex (male/female hospitalisations 2011-2021),
 *           national.ageSeverity (deathsPer1000 2011-2019, deaths2011_2019, bedDaysPerCase1520)
 * Layout:   diverging bars (male left, female right) + aligned dot strip of deaths per 1,000.
 */
(function () {
  const { fmt, C } = U;

  function render(el, D, opts) {
    const W = opts.width, narrow = U.isNarrow(W);
    const sev = Object.fromEntries(D.national.ageSeverity.map((d) => [d.category, d]));
    const data = D.national.ageSex.map((d) => ({ ...d, sev: sev[d.age], ratio: d.male / d.female }));

    U.legend(el, [
      { label: "Male", color: C.male },
      { label: "Female", color: C.female },
      { label: "Deaths in hospital per 1,000 cases", color: C.crimson, shape: "dot" },
    ]);

    const rowH = narrow ? 34 : 40, ageW = narrow ? 50 : 56;
    const m = { top: 40, right: narrow ? 14 : 24, bottom: 40, left: 8 };
    const iw = W - m.left - m.right;
    const stripW = Math.max(110, Math.round(iw * 0.28)), gapW = narrow ? 18 : 36;
    const barsW = iw - stripW - gapW;
    const half = (barsW - ageW) / 2;
    const H = m.top + rowH * data.length + m.bottom;
    const a75 = sev["75+"];
    const svg = U.svg(el, W, H,
      `Diverging bar chart of hospitalisations by age group and sex, 2011 to 2021, with a dot strip of deaths in hospital per 1,000 cases. ` +
      `Males are ${fmt.pct(D.national.sexSeverity.find((d) => d.category === "Male").shareHospitalisations, 0)} of hospitalisations. People aged 75 and over are ${fmt.pct(a75.shareCases2011_2019)} of cases but ${fmt.pct(a75.shareDeaths2011_2019)} of deaths in hospital, ` +
      `at ${fmt.dec(a75.deathsPer1000)} deaths per 1,000 cases.`);
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
    const maxV = d3.max(data, (d) => Math.max(d.male, d.female));
    const xm = d3.scaleLinear().domain([0, maxV]).nice().range([half, 0]);
    const xf = d3.scaleLinear().domain([0, maxV]).nice().range([half + ageW, barsW]);
    const y = d3.scaleBand().domain(data.map((d) => d.age)).range([0, rowH * data.length]).padding(0.28);
    const xs = d3.scaleLinear().domain([0, 30]).range([barsW + gapW, iw]);
    const ih = rowH * data.length;

    // headers
    g.append("text").attr("class", "panel-title").attr("x", half).attr("y", -22).attr("text-anchor", "end").text("← Male");
    g.append("text").attr("class", "panel-title").attr("x", half + ageW).attr("y", -22).text("Female →");
    g.append("text").attr("class", "panel-title").attr("x", barsW + gapW).attr("y", -22).text(narrow ? "Deaths /1,000" : "Deaths per 1,000 cases");
    g.append("text").attr("class", "annot").attr("x", barsW + gapW).attr("y", -8).text("2011–2019");
    U.axisTitle(g, half + ageW / 2, -8, "Age group");

    // axes
    const tk = narrow ? 2 : 3;
    U.styleAxis(g.append("g").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(xm).ticks(tk).tickFormat(d3.format("~s"))));
    U.styleAxis(g.append("g").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(xf).ticks(tk).tickFormat(d3.format("~s"))));
    g.append("g").attr("class", "grid").attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(xs).ticks(3).tickSize(-ih).tickFormat("")).call((s) => s.select(".domain").remove());
    U.styleAxis(g.append("g").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(xs).ticks(3)));
    U.axisTitle(g, half + ageW / 2, ih + 32, "Hospitalisations, 2011–2021");
    U.axisTitle(g, barsW + gapW + stripW / 2, ih + 32, narrow ? "Deaths /1,000 cases" : "Deaths per 1,000 cases");

    const row = g.append("g").selectAll("g").data(data).join("g").attr("class", "age-row");
    row.append("rect").attr("class", "row-bg").attr("x", -m.left).attr("width", W).attr("y", (d) => y(d.age) - (rowH - y.bandwidth()) / 2)
      .attr("height", rowH).attr("fill", "transparent");
    row.append("rect").attr("x", (d) => xm(d.male)).attr("y", (d) => y(d.age)).attr("width", (d) => half - xm(d.male) - 1)
      .attr("height", y.bandwidth()).attr("rx", 3).attr("fill", C.male);
    row.append("rect").attr("x", half + ageW + 1).attr("y", (d) => y(d.age)).attr("width", (d) => xf(d.female) - half - ageW - 1)
      .attr("height", y.bandwidth()).attr("rx", 3).attr("fill", C.female);
    row.append("text").attr("class", "row-label center").attr("x", half + ageW / 2).attr("y", (d) => y(d.age) + y.bandwidth() / 2 + 4)
      .attr("text-anchor", "middle").text((d) => d.age);
    // dot strip
    row.append("line").attr("x1", xs(0)).attr("x2", (d) => xs(d.sev.deathsPer1000)).attr("y1", (d) => y(d.age) + y.bandwidth() / 2)
      .attr("y2", (d) => y(d.age) + y.bandwidth() / 2).attr("stroke", "#E3C3C9").attr("stroke-width", 2);
    row.append("circle").attr("cx", (d) => xs(d.sev.deathsPer1000)).attr("cy", (d) => y(d.age) + y.bandwidth() / 2).attr("r", 6)
      .attr("fill", C.crimson).attr("stroke", "#fff").attr("stroke-width", 1.5);
    row.append("text").attr("class", "value-label small").attr("y", (d) => y(d.age) + y.bandwidth() / 2 + 4)
      .attr("x", (d) => (xs(d.sev.deathsPer1000) > iw - 28 ? xs(d.sev.deathsPer1000) - 10 : xs(d.sev.deathsPer1000) + 10))
      .attr("text-anchor", (d) => (xs(d.sev.deathsPer1000) > iw - 28 ? "end" : "start"))
      .text((d) => fmt.dec(d.sev.deathsPer1000));

    row.on("pointermove pointerdown", function (ev, d) {
      row.classed("dim", (o) => o !== d);
      U.tip.show(ev, `<div class="tt-title">Age ${d.age}</div>` +
        U.tip.row("Male", fmt.int(d.male), C.male) + U.tip.row("Female", fmt.int(d.female), C.female) +
        U.tip.row("Male : female", `${fmt.dec(d.ratio, 2)} : 1`) +
        U.tip.row("Deaths per 1,000 cases", fmt.dec(d.sev.deathsPer1000), C.crimson) +
        U.tip.row("Deaths in hospital (n)", fmt.int(d.sev.deaths2011_2019)) +
        U.tip.row("Bed days per case*", fmt.dec(d.sev.bedDaysPerCase1520, 1)) +
        `<div class="tt-note">Counts 2011–2021; deaths 2011–2019; *bed days Jul 2015–Jun 2020.</div>`);
    }).on("pointerleave", (ev) => { row.classed("dim", false); U.tip.hide(ev); });
  }

  function table(D) {
    const sev = Object.fromEntries(D.national.ageSeverity.map((d) => [d.category, d]));
    return {
      caption: "Hospitalisations by age and sex (2011–2021) and severity by age (deaths 2011–2019)",
      columns: [
        { key: "age", label: "Age" },
        { key: "male", label: "Male (2011–2021)", num: true, fmt: fmt.int },
        { key: "female", label: "Female (2011–2021)", num: true, fmt: fmt.int },
        { key: "share", label: "% of cases (2011–2019)", num: true, fmt: (v) => fmt.pct(v) },
        { key: "shareD", label: "% of deaths (2011–2019)", num: true, fmt: (v) => fmt.pct(v) },
        { key: "rate", label: "Deaths per 1,000 (2011–2019)", num: true, fmt: (v) => fmt.dec(v) },
        { key: "bd", label: "Bed days per case (Jul 2015–Jun 2020)", num: true, fmt: (v) => fmt.dec(v, 2) },
      ],
      rows: D.national.ageSex.map((d) => ({ ...d, share: sev[d.age].shareCases2011_2019, shareD: sev[d.age].shareDeaths2011_2019,
        rate: sev[d.age].deathsPer1000, bd: sev[d.age].bedDaysPerCase1520 })),
    };
  }

  Charts.n4 = { render, table };
})();
