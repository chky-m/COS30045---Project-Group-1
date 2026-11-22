/* N5 - Remoteness of usual residence
 * Question: Does the injury profile differ by where patients live?
 * Data:     STORY_DATA.national.remotenessRoadUser (road-user mix, 2011-2021),
 *           national.remoteness (deathsPer1000 2011-2019, bedDaysPerCase1520 Jul 2015-Jun 2020)
 * Note:     the "Missing" residence group stays visible as its own row (QA m3).
 */
(function () {
  const { fmt, C, ROAD_USER_COLORS: RC } = U;
  const LABEL = { "Major Cities": "Major cities", Regional: "Regional", Remote: "Remote", Missing: "Residence unknown" };

  function render(el, D, opts) {
    const W = opts.width, narrow = U.isNarrow(W);
    const order = D.national.roadUserOrder;
    const areas = ["Major Cities", "Regional", "Remote", "Missing"];
    const sev = Object.fromEntries(D.national.remoteness.map((d) => [d.category, d]));
    const rows = areas.map((a) => {
      let x0 = 0;
      const segs = order.map((u) => {
        const r = D.national.remotenessRoadUser.find((d) => d.remoteness === a && d.roadUser === u);
        const s = { area: a, roadUser: u, n: r.hospitalisations, share: r.share, x0 };
        x0 += r.share;
        return s;
      });
      return { area: a, segs, sev: sev[a] };
    });

    U.legend(el, order.map((u) => ({ label: u, color: RC[u] })));

    const labelH = 18, barH = narrow ? 26 : 30, rowH = labelH + barH + 18;
    const statW = narrow ? 92 : 220, bdX = 128;
    const m = { top: 34, right: 8, bottom: 8, left: 0 };
    const iw = W - m.left - m.right, bw = iw - statW - 16;
    const axisY = (rows.length - 1) * rowH + 8 + labelH + barH + 6;
    const H = m.top + axisY + 48;
    const mc = sev["Major Cities"], rg = sev.Regional;
    const svg = U.svg(el, W, H,
      `100 percent stacked bars of the road-user mix of hospitalisations by remoteness of the patient's usual residence, with deaths in hospital per 1,000 cases beside each bar. ` +
      `Cyclists are ${fmt.pct(rows[0].segs.find((s) => s.roadUser === "Pedal cyclist").share)} of major-city cases but ${fmt.pct(rows[2].segs.find((s) => s.roadUser === "Pedal cyclist").share)} of remote cases. ` +
      `Regional residents: ${fmt.dec(rg.deathsPer1000)} deaths per 1,000 versus ${fmt.dec(mc.deathsPer1000)} for major cities.`);
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
    const x = d3.scaleLinear().domain([0, 100]).range([0, bw]);

    U.axisTitle(g, 0, -16, "Usual residence of patient", { anchor: "start" });
    U.styleAxis(g.append("g").attr("transform", `translate(0,${axisY})`).call(d3.axisBottom(x).ticks(narrow ? 4 : 5).tickFormat((v) => v + "%")));
    U.axisTitle(g, bw / 2, axisY + 36, narrow ? "Road-user mix, 2011–2021 (%)" : "Road-user mix of hospitalisations, 2011–2021 (%)");
    const sx = bw + 16;
    g.append("text").attr("class", "panel-title sev").attr("x", sx).attr("y", -16).text(narrow ? "Deaths/1,000" : "Deaths per 1,000");
    if (!narrow) g.append("text").attr("class", "panel-title").attr("x", sx + bdX).attr("y", -16).text("Bed days/case");
    g.append("text").attr("class", "annot").attr("x", sx).attr("y", -3).text(narrow ? "2011–19" : "2011–2019");
    if (!narrow) g.append("text").attr("class", "annot").attr("x", sx + bdX).attr("y", -3).text("Jul 2015–Jun 2020");

    const row = g.append("g").selectAll("g").data(rows).join("g").attr("transform", (d, i) => `translate(0,${i * rowH + 8})`);
    row.append("text").attr("class", (d) => "row-label" + (d.area === "Missing" ? " muted" : "")).attr("x", 0).attr("y", 12)
      .text((d) => LABEL[d.area] + (d.area === "Missing" ? ` (${fmt.pct(d.sev.shareCases2011_2019)} of cases, ${fmt.pct(d.sev.shareDeaths2011_2019)} of deaths)` : ""));
    const seg = row.append("g").attr("transform", `translate(0,${labelH})`).selectAll("g").data((d) => d.segs).join("g");
    seg.append("rect").attr("x", (d) => x(d.x0) + 1).attr("width", (d) => Math.max(0, x(d.share) - 2)).attr("height", barH)
      .attr("fill", (d) => RC[d.roadUser]).attr("rx", 2)
      .attr("fill-opacity", (d) => (d.area === "Missing" ? 0.55 : 1));
    seg.filter((d) => x(d.share) > (narrow ? 30 : 36)).append("text").attr("class", "seg-label")
      .attr("x", (d) => x(d.x0 + d.share / 2)).attr("y", barH / 2 + 4).attr("text-anchor", "middle")
      .attr("fill", (d) => U.inkOn(RC[d.roadUser])).text((d) => Math.round(d.share) + "%");
    seg.on("pointermove pointerdown", (ev, d) => {
      seg.classed("dim", (o) => o.roadUser !== d.roadUser);
      U.tip.show(ev, `<div class="tt-title"><span class="tt-sw" style="background:${RC[d.roadUser]}"></span>${d.roadUser}</div>` +
        U.tip.row("Usual residence", LABEL[d.area]) + U.tip.row("Hospitalisations", fmt.int(d.n)) + U.tip.row("Share of this group", fmt.pct(d.share)));
    }).on("pointerleave", (ev) => { seg.classed("dim", false); U.tip.hide(ev); });

    // severity column
    const st = row.append("g").attr("transform", `translate(${sx},${labelH + barH / 2 + 6})`);
    st.append("text").attr("class", "stat-num sev").text((d) => fmt.dec(d.sev.deathsPer1000));
    st.append("text").attr("class", "stat-sub").attr("x", narrow ? 44 : 46).text((d) => `n=${fmt.int(d.sev.deaths2011_2019)}`);
    if (!narrow) st.append("text").attr("class", "stat-num").attr("x", bdX).text((d) => fmt.dec(d.sev.bedDaysPerCase1520));
    else st.append("text").attr("class", "stat-sub").attr("y", 15).text((d) => `${fmt.dec(d.sev.bedDaysPerCase1520)} bed days`);
  }

  function table(D) {
    const order = D.national.roadUserOrder;
    const sev = Object.fromEntries(D.national.remoteness.map((d) => [d.category, d]));
    const rows = ["Major Cities", "Regional", "Remote", "Missing"].map((a) => {
      const r = { area: LABEL[a], rate: sev[a].deathsPer1000, bd: sev[a].bedDaysPerCase1520 };
      order.forEach((u) => { r[u] = D.national.remotenessRoadUser.find((d) => d.remoteness === a && d.roadUser === u).share; });
      return r;
    });
    return {
      caption: "Road-user mix (% of hospitalisations, 2011–2021) and severity by remoteness of usual residence",
      columns: [{ key: "area", label: "Usual residence" }]
        .concat(order.map((u) => ({ key: u, label: u, num: true, fmt: (v) => fmt.pct(v) })))
        .concat([{ key: "rate", label: "Deaths per 1,000", num: true, fmt: (v) => fmt.dec(v) },
          { key: "bd", label: "Bed days per case", num: true, fmt: (v) => fmt.dec(v, 2) }]),
      rows,
    };
  }

  Charts.n5 = { render, table };
})();
