/* S1 - State growth: tile-grid map + ranked bars
 * Question: Which jurisdictions grew fastest, once known series breaks are accounted for?
 * Data:     STORY_DATA.state.windows ({state, window, from, to, pctChange, breakFlag})
 * Options:  opts.window = "2018-2021" (default, all comparable) | "2012-2016" | "2011-2021"
 *           opts.selectedState (linked across S1-S5; click a tile or bar to select)
 * Never shows raw-count choropleths or per-capita values (QA guardrail 6).
 */
(function () {
  const { fmt, C } = U;
  // approximate geographic tile positions [col, row]
  const TILES = { NT: [1, 0], Qld: [2, 0], WA: [0, 1], SA: [1, 1], NSW: [2, 1], ACT: [3, 2], Vic: [2, 2], Tas: [2, 3] };
  const NOTE = {
    "2018-2021": "No state changed its counting rules during this window.",
    "2012-2016": "Before the NSW change. ⚠ Victoria straddles its own Jul 2012 change (2012 includes Jan–Jun under the old rules).",
    "2011-2021": "Headline decade. ⚠ NSW and Victoria cross reporting changes, so their figures are hatched.",
  };

  function render(el, D, opts) {
    const win = opts.window || "2018-2021", sel = opts.selectedState;
    const W = opts.width, narrow = U.isNarrow(W);
    const data = D.state.windows.filter((d) => d.window === win).sort((a, b) => b.pctChange - a.pctChange);
    // colour limit per window (legend shows it), never below +/-20% so small changes stay pale
    const lim = Math.max(20, Math.ceil(d3.max(data, (d) => Math.abs(d.pctChange)) / 10) * 10);
    const color = U.divergingColor(lim);

    d3.select(el).append("p").attr("class", "chart-note").text(NOTE[win]);

    const stacked = W < 720;
    const mapW = stacked ? Math.min(W, 360) : Math.round(W * 0.4);
    const barsW = stacked ? W : W - mapW - 32;
    const tile = Math.floor(Math.min(84, (mapW - 12) / 4));
    const mapH = tile * 4 + 70;
    const rowH = 30, barsH = 34 + rowH * data.length + 48;
    const H = stacked ? mapH + 24 + barsH : Math.max(mapH, barsH);
    const top = data[0];
    const svg = U.svg(el, W, H,
      `Tile map and ranked bars of the percentage change in hospitalisations by state of usual residence, ${win}. ` +
      `${data.map((d) => `${d.state} ${fmt.signed(d.pctChange)}${d.breakFlag ? " (crosses a reporting change)" : ""}`).join(", ")}. ` +
      `Counts, not population rates.`);
    const hatch = U.hatch(svg, "s1-hatch", "#1A1D23");

    // ---- tile map
    const gm = svg.append("g").attr("transform", `translate(${stacked ? (W - tile * 4) / 2 : 0},8)`);
    const tiles = gm.selectAll("g").data(data).join("g").attr("class", "tile")
      .attr("transform", (d) => `translate(${TILES[d.state][0] * tile},${TILES[d.state][1] * tile})`)
      .classed("selected", (d) => d.state === sel).classed("dim", (d) => sel && d.state !== sel);
    tiles.append("rect").attr("x", 2).attr("y", 2).attr("width", tile - 4).attr("height", tile - 4).attr("rx", 6)
      .attr("fill", (d) => color(d.pctChange)).attr("stroke", (d) => (d.state === sel ? C.ink : "#fff")).attr("stroke-width", (d) => (d.state === sel ? 3 : 1));
    tiles.filter((d) => d.breakFlag).append("rect").attr("x", 2).attr("y", 2).attr("width", tile - 4).attr("height", tile - 4).attr("rx", 6)
      .attr("fill", hatch).attr("pointer-events", "none");
    tiles.append("text").attr("class", "tile-label").attr("x", tile / 2).attr("y", tile / 2 - 3).attr("text-anchor", "middle")
      .attr("fill", (d) => U.inkOn(color(d.pctChange))).text((d) => d.state + (d.breakFlag ? " ⚠" : ""));
    tiles.append("text").attr("class", "tile-value").attr("x", tile / 2).attr("y", tile / 2 + 14).attr("text-anchor", "middle")
      .attr("fill", (d) => U.inkOn(color(d.pctChange))).text((d) => fmt.signed(d.pctChange, 0));
    // colour legend
    const lg = gm.append("g").attr("transform", `translate(0,${tile * 4 + 14})`);
    const lw = tile * 4, steps = 40;
    d3.range(steps).forEach((i) => lg.append("rect").attr("x", (i * lw) / steps).attr("width", lw / steps + 0.5).attr("height", 10)
      .attr("fill", color(color.domain()[0] + (i / (steps - 1)) * (color.domain()[2] - color.domain()[0]))));
    lg.append("text").attr("class", "annot").attr("y", 24).text(fmt.signed(color.domain()[0], 0) + " fewer");
    lg.append("text").attr("class", "annot").attr("x", lw / 2).attr("y", 24).attr("text-anchor", "middle").text("0");
    lg.append("text").attr("class", "annot").attr("x", lw).attr("y", 24).attr("text-anchor", "end").text("more " + fmt.signed(color.domain()[2], 0));
    lg.append("text").attr("class", "annot").attr("y", 40).text("Warm = more hospitalisations (growth).");

    // ---- ranked bars
    const bx = stacked ? 0 : mapW + 32, by = stacked ? mapH + 24 : 0;
    const gb = svg.append("g").attr("transform", `translate(${bx},${by})`);
    const lab = 52, padR = 52;
    const ext = d3.extent(data, (d) => d.pctChange);
    // leave room left of negative bars for their value labels
    const x = d3.scaleLinear().domain([Math.min(0, ext[0]), Math.max(0, ext[1])]).nice().range([lab + (ext[0] < 0 ? 48 : 0), barsW - padR]);
    const gy = 34;
    U.axisTitle(gb, 0, 14, "State or territory (usual residence)", { anchor: "start" });
    U.axisTitle(gb, (lab + barsW - padR) / 2, gy + rowH * data.length + 40, `% change in hospitalisations, ${win.replace("-", "–")}`);
    gb.append("g").attr("class", "grid").attr("transform", `translate(0,${gy + rowH * data.length})`)
      .call(d3.axisBottom(x).ticks(narrow ? 3 : 6).tickSize(-rowH * data.length).tickFormat("")).call((s) => s.select(".domain").remove());
    U.styleAxis(gb.append("g").attr("transform", `translate(0,${gy + rowH * data.length})`)
      .call(d3.axisBottom(x).ticks(narrow ? 3 : 6).tickFormat((d) => (d ? fmt.signed(d, 0) : "0%"))));
    gb.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", gy - 4).attr("y2", gy + rowH * data.length).attr("stroke", "#9AA1AC");
    const bars = gb.append("g").selectAll("g").data(data).join("g").attr("class", "bar-row")
      .attr("transform", (d, i) => `translate(0,${gy + i * rowH})`)
      .classed("dim", (d) => sel && d.state !== sel).classed("selected", (d) => d.state === sel);
    bars.append("text").attr("class", "row-label").attr("x", 0).attr("y", rowH / 2 + 4).text((d) => d.state + (d.breakFlag ? " ⚠" : ""));
    bars.append("rect").attr("x", (d) => x(Math.min(0, d.pctChange))).attr("y", 5).attr("height", rowH - 10)
      .attr("width", (d) => Math.max(1, Math.abs(x(d.pctChange) - x(0)))).attr("rx", 3)
      .attr("fill", (d) => color(d.pctChange)).attr("stroke", (d) => (d.state === sel ? C.ink : d3.color(color(d.pctChange)).darker(0.6))).attr("stroke-width", (d) => (d.state === sel ? 2 : 0.75));
    bars.filter((d) => d.breakFlag).append("rect").attr("x", (d) => x(Math.min(0, d.pctChange))).attr("y", 5).attr("height", rowH - 10)
      .attr("width", (d) => Math.abs(x(d.pctChange) - x(0))).attr("fill", hatch).attr("pointer-events", "none");
    bars.append("text").attr("class", "value-label small").attr("y", rowH / 2 + 4)
      .attr("x", (d) => (d.pctChange >= 0 ? x(d.pctChange) + 6 : x(d.pctChange) - 6)).attr("text-anchor", (d) => (d.pctChange >= 0 ? "start" : "end"))
      .text((d) => fmt.signed(d.pctChange));
    bars.append("rect").attr("width", barsW).attr("height", rowH).attr("fill", "transparent");

    // shared interaction for tiles + bars
    [tiles, bars].forEach((s) => s.style("cursor", "pointer")
      .on("click", (ev, d) => U.state.set(d.state))
      .on("pointermove pointerdown", (ev, d) => U.tip.show(ev, `<div class="tt-title">${U.STATE_NAMES[d.state]}</div>` +
        U.tip.row(win.slice(0, 4), fmt.int(d.from)) + U.tip.row(win.slice(5), fmt.int(d.to)) + U.tip.row("Change", fmt.signed(d.pctChange)) +
        (d.breakFlag ? `<div class="tt-note">⚠ Crosses a reporting change: not a like-for-like comparison.</div>` : "") +
        `<div class="tt-note">Click to highlight across S1–S5.</div>`))
      .on("pointerleave", (ev) => U.tip.hide(ev)));
  }

  function table(D, opts) {
    const win = (opts && opts.window) || "2018-2021";
    return {
      caption: `Hospitalisations by state of usual residence, ${win}`,
      columns: [
        { key: "state", label: "State" },
        { key: "from", label: win.slice(0, 4), num: true, fmt: fmt.int },
        { key: "to", label: win.slice(5), num: true, fmt: fmt.int },
        { key: "pctChange", label: "% change", num: true, fmt: (v) => fmt.signed(v) },
        { key: "breakFlag", label: "Crosses reporting change", fmt: (v) => (v ? "Yes" : "No") },
      ],
      rows: D.state.windows.filter((d) => d.window === win).sort((a, b) => b.pctChange - a.pctChange),
    };
  }

  Charts.s1 = { render, table, defaults: { window: "2018-2021" } };
})();
