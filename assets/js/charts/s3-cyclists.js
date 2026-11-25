/* S3 - Cyclists rose in every state
 * Question: Is the national cyclist increase a few states, or everywhere?
 * Data:     STORY_DATA.state.cyclists ({state, y2011, y2021, pctChange}) from state T2 "Pedal cyclist"
 * Chart:    ranked bars of % change 2011 -> 2021 with the two counts labelled.
 */
(function () {
  const { fmt, C, ROAD_USER_COLORS: RC } = U;
  const FLAG = new Set(["NSW", "Vic"]);

  function render(el, D, opts) {
    const sel = opts.selectedState;
    const W = opts.width, narrow = U.isNarrow(W);
    const data = D.state.cyclists.slice().sort((a, b) => b.pctChange - a.pctChange);
    const rowH = 34, lab = 54, countW = narrow ? 0 : 120;
    const m = { top: 30, right: narrow ? 52 : 58, bottom: 50 };
    const H = m.top + rowH * data.length + m.bottom;
    const svg = U.svg(el, W, H,
      `Ranked bar chart of the change in pedal-cyclist hospitalisations from 2011 to 2021 by state of usual residence. ` +
      `Every jurisdiction rose: ${data.map((d) => `${d.state} ${fmt.signed(d.pctChange)}`).join(", ")}.`);
    const x = d3.scaleLinear().domain([0, d3.max(data, (d) => d.pctChange)]).nice().range([lab, W - m.right - countW]);
    const g = svg.append("g").attr("transform", `translate(0,${m.top})`);
    const ih = rowH * data.length;

    U.axisTitle(g, 0, -12, "State or territory", { anchor: "start" });
    U.axisTitle(g, (lab + W - m.right - countW) / 2, ih + 40, "% change in pedal-cyclist hospitalisations, 2011–2021");
    if (!narrow) g.append("text").attr("class", "panel-title").attr("x", W - countW + 8).attr("y", -12).text("2011 → 2021");
    g.append("g").attr("class", "grid").attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(narrow ? 3 : 5).tickSize(-ih).tickFormat("")).call((s) => s.select(".domain").remove());
    U.styleAxis(g.append("g").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x).ticks(narrow ? 3 : 5).tickFormat((d) => (d ? "+" + d + "%" : "0%"))));

    const row = g.append("g").selectAll("g").data(data).join("g").attr("class", "bar-row")
      .attr("transform", (d, i) => `translate(0,${i * rowH})`)
      .classed("dim", (d) => sel && d.state !== sel).classed("selected", (d) => d.state === sel);
    row.append("text").attr("class", "row-label").attr("y", rowH / 2 + 4).text((d) => d.state + (FLAG.has(d.state) ? " ⚠" : ""));
    row.append("rect").attr("x", x(0)).attr("y", 7).attr("height", rowH - 14).attr("width", (d) => x(d.pctChange) - x(0)).attr("rx", 3)
      .attr("fill", RC["Pedal cyclist"]).attr("stroke", (d) => (d.state === sel ? C.ink : "none")).attr("stroke-width", 2);
    row.append("text").attr("class", "value-label small").attr("x", (d) => x(d.pctChange) + 6).attr("y", rowH / 2 + 4)
      .text((d) => fmt.signed(d.pctChange));
    if (!narrow) row.append("text").attr("class", "stat-sub").attr("x", W - countW + 8).attr("y", rowH / 2 + 4)
      .text((d) => `${fmt.int(d.y2011)} → ${fmt.int(d.y2021)}`);
    row.append("rect").attr("width", W).attr("height", rowH).attr("fill", "transparent").style("cursor", "pointer")
      .on("click", (ev, d) => U.state.set(d.state))
      .on("pointermove pointerdown", (ev, d) => U.tip.show(ev, `<div class="tt-title">${U.STATE_NAMES[d.state]}: pedal cyclists</div>` +
        U.tip.row("2011", fmt.int(d.y2011)) + U.tip.row("2021", fmt.int(d.y2021)) + U.tip.row("Change", fmt.signed(d.pctChange)) +
        (FLAG.has(d.state) ? `<div class="tt-note">⚠ ${d.state}'s counting change may affect the road-user mix.</div>` : "") +
        (d.y2011 < 100 ? `<div class="tt-note">Small base (${d.y2011} in 2011): the percentage is volatile.</div>` : "")))
      .on("pointerleave", (ev) => U.tip.hide(ev));
  }

  function table(D) {
    return {
      caption: "Pedal-cyclist hospitalisations by state of usual residence, 2011 and 2021",
      columns: [
        { key: "state", label: "State" },
        { key: "y2011", label: "2011", num: true, fmt: fmt.int },
        { key: "y2021", label: "2021", num: true, fmt: fmt.int },
        { key: "pctChange", label: "% change", num: true, fmt: (v) => fmt.signed(v) },
      ],
      rows: D.state.cyclists.slice().sort((a, b) => b.pctChange - a.pctChange),
    };
  }

  Charts.s3 = { render, table };
})();
