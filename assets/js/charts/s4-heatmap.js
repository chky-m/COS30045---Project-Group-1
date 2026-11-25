/* S4 - State mix heatmap
 * Question: How does the road-user, crash-type (counterparty) and age mix differ between jurisdictions?
 * Data:     STORY_DATA.state.roadUserMix | state.counterpartyMix | state.ageMix
 *           (shareOfT1 = share of the state's T1 total; "Not published" row = n.p. remainder)
 * Options:  opts.mode = "roadUser" | "counterparty" | "age"; opts.sortBy = category or null
 * State categories only: never placed beside national categories (QA M6).
 */
(function () {
  const { fmt, C } = U;
  const SHORT = {
    "Car, pick-up truck or van": "Car, pick-up or van",
    "Non-collision transport accident": "Non-collision",
    "Fixed or stationary object": "Fixed object",
    "Car occupant": "Car occupant*",
  };
  const AGE_FLAG = new Set(["ACT", "Tas", "NT"]);

  function cfg(D, mode) {
    if (mode === "counterparty") return { rows: D.state.counterpartyMix, order: D.state.counterpartyOrder };
    if (mode === "age") return { rows: D.state.ageMix, order: D.state.ageOrder };
    return { rows: D.state.roadUserMix, order: D.state.roadUserOrder };
  }

  function render(el, D, opts) {
    const mode = opts.mode || "roadUser", sel = opts.selectedState;
    const W = opts.width, narrow = U.isNarrow(W);
    const { rows, order } = cfg(D, mode);
    const cols = order.concat(["Not published"]);
    if (opts.sortBy && !cols.includes(opts.sortBy)) opts.sortBy = null;
    const cell = (s, c) => rows.find((d) => d.state === s && d.category === c);
    const cov = (s) => rows.find((d) => d.state === s && d.category === "_coverage");
    let states = D.state.states.slice();
    if (opts.sortBy && cols.includes(opts.sortBy)) states.sort((a, b) => cell(b, opts.sortBy).shareOfT1 - cell(a, opts.sortBy).shareOfT1);

    const note = d3.select(el).append("p").attr("class", "chart-note");
    note.text("Share of each state's total hospitalisations (Table 1), 2011–2021 pooled. " +
      (mode === "roadUser" ? "*State category merges car driver, passenger and unknown position. " : "") +
      (mode === "age" ? "⚠ ACT, Tas and NT: youngest and oldest age shares are understated (n.p. cells). " : "") +
      "Use Sort by to reorder the rows.");

    // sort controls as real buttons (keyboard accessible), above the grid
    const sortBar = d3.select(el).append("div").attr("class", "sort-bar").attr("role", "group").attr("aria-label", "Sort rows by column");
    sortBar.append("span").attr("class", "sort-label").text("Sort by:");
    [{ k: null, l: "State order" }].concat(cols.map((c) => ({ k: c, l: SHORT[c] || c }))).forEach((o) => {
      sortBar.append("button").attr("type", "button").attr("class", "chip").attr("aria-pressed", String((opts.sortBy || null) === o.k))
        .text(o.l).on("click", () => { opts.sortBy = o.k; opts.rerender(); });
    });

    const labW = 64, minCell = 76;
    const Wc = Math.max(W, labW + cols.length * minCell);
    if (Wc > W) d3.select(el).append("p").attr("class", "chart-note scroll-hint").text("Scroll sideways for more columns, including Not published →");
    const scroller = d3.select(el).append("div").attr("class", "scroll-x");
    const cw = (Wc - labW) / cols.length, ch = 40, headH = (narrow ? 56 : 46) + 22;
    const H = headH + ch * states.length + 6;
    const vmax = d3.max(rows.filter((d) => order.includes(d.category)), (d) => d.shareOfT1);
    const color = d3.scaleSequential([0, vmax], d3.interpolateRgb("#FFFFFF", C.navy));
    const act = cell("ACT", "Pedal cyclist"), nt = cell("NT", "Non-collision transport accident");
    const svg = U.svg(scroller.node(), Wc, H,
      `Heatmap of the ${mode === "age" ? "age" : mode === "counterparty" ? "crash counterparty" : "road-user"} mix of hospitalisations by state of usual residence, as a share of each state's total, 2011 to 2021. ` +
      (mode === "roadUser" && act ? `ACT pedal cyclists are ${fmt.pct(act.shareOfT1)} of ACT cases. ` : "") +
      (mode === "counterparty" && nt ? `Non-collision accidents are ${fmt.pct(nt.shareOfT1)} of NT cases. ` : "") +
      `Unpublished values are shown in a separate Not published column, never as zero.`);
    const hatch = U.hatch(svg, "s4-np", "#B8BDC5", C.np);

    // axis titles: categories across the top, states down the side
    const xTitle = { roadUser: "Road user", counterparty: "What the crash involved (counterparty)", age: "Age group" }[mode];
    U.axisTitle(svg, labW + (Wc - labW) / 2, 14, `${xTitle}: % of the state's hospitalisations`);
    U.axisTitle(svg, 0, headH - 8, "State", { anchor: "start" });

    // column headers (wrap to two lines)
    const hd = svg.append("g").selectAll("text").data(cols).join("text").attr("class", (c) => "col-head" + (opts.sortBy === c ? " sorted" : ""))
      .attr("x", (c, i) => labW + i * cw + cw / 2).attr("y", headH - 26).attr("text-anchor", "middle");
    hd.each(function (c) {
      const words = (SHORT[c] || c).split(" ");
      const lines = words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")] : [words[0]];
      if (cw > 100 && words.length <= 3) lines.splice(0, lines.length, words.join(" "));
      lines.forEach((l, i) => d3.select(this).append("tspan").attr("x", labW + cols.indexOf(c) * cw + cw / 2).attr("dy", i ? 13 : (lines.length === 1 ? 13 : 0)).text(l));
    });

    const row = svg.append("g").attr("transform", `translate(0,${headH})`).selectAll("g").data(states).join("g")
      .attr("transform", (s, i) => `translate(0,${i * ch})`).attr("class", "heat-row")
      .classed("dim", (s) => sel && s !== sel).classed("selected", (s) => s === sel);
    row.append("text").attr("class", "row-label").attr("x", 0).attr("y", ch / 2 + 4)
      .text((s) => s + (mode === "age" && AGE_FLAG.has(s) ? " ⚠" : ""));
    const cells = row.selectAll("g").data((s) => cols.map((c) => ({ s, c, d: cell(s, c) }))).join("g")
      .attr("transform", (o, i) => `translate(${labW + i * cw},0)`);
    cells.append("rect").attr("x", 1).attr("y", 1).attr("width", cw - 2).attr("height", ch - 2).attr("rx", 3)
      .attr("fill", (o) => (o.c === "Not published" ? (o.d.shareOfT1 > 0 ? hatch : C.np) : color(o.d.shareOfT1)))
      .attr("stroke", (o) => (o.s === sel ? C.ink : "none")).attr("stroke-width", 1.5);
    cells.append("text").attr("class", "cell-label").attr("x", cw / 2).attr("y", ch / 2 + 4).attr("text-anchor", "middle")
      .attr("fill", (o) => (o.c === "Not published" ? C.ink2 : U.inkOn(color(o.d.shareOfT1))))
      .text((o) => (o.c === "Not published" && !o.d.shareOfT1 ? "–" : fmt.pct(o.d.shareOfT1)));
    cells.style("cursor", "pointer")
      .on("click", (ev, o) => U.state.set(o.s))
      .on("pointermove pointerdown", (ev, o) => {
        const cv = cov(o.s);
        U.tip.show(ev, `<div class="tt-title">${U.STATE_NAMES[o.s]}: ${o.c}</div>` +
          U.tip.row("Share of state total", fmt.pct(o.d.shareOfT1)) +
          U.tip.row("Hospitalisations", fmt.int(o.d.hospitalisations)) +
          (o.c === "Not published" ? U.tip.row("n.p. cells in this table", fmt.int(cv.npRecords)) : "") +
          (o.c === "Not published" ? `<div class="tt-note">Cases withheld for small numbers: missing, not zero.</div>` : "") +
          (mode === "age" && AGE_FLAG.has(o.s) ? `<div class="tt-note">⚠ Youngest and oldest groups understated (n.p. cells).</div>` : ""));
      })
      .on("pointerleave", (ev) => U.tip.hide(ev));
  }

  function table(D, opts) {
    const mode = (opts && opts.mode) || "roadUser";
    const { rows, order } = cfg(D, mode);
    const cols = order.concat(["Not published"]);
    return {
      caption: `State ${mode === "age" ? "age" : mode === "counterparty" ? "counterparty" : "road-user"} mix, % of each state's total, 2011–2021`,
      columns: [{ key: "state", label: "State" }].concat(cols.map((c) => ({ key: c, label: c, num: true, fmt: (v) => fmt.pct(v) }))),
      rows: D.state.states.map((s) => {
        const r = { state: s };
        cols.forEach((c) => { r[c] = rows.find((d) => d.state === s && d.category === c).shareOfT1; });
        return r;
      }),
    };
  }

  Charts.s4 = { render, table, defaults: { mode: "roadUser", sortBy: null } };
})();
