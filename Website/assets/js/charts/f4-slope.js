/* F4 - First Nations vs non-Indigenous: did the road-user (or crash-type) mix shift 2011 -> 2021?
 * Data:  STORY_DATA.firstNations.{roadUserMix, counterpartyMix} rows {population, year, category, hospitalisations, share}
 * Chart: slopegraph, one panel per population (side by side; stacked on narrow screens), shared
 *        0-60% scale so slopes compare across panels. One line per category, direct labels at both ends.
 *        Toggle: road user | what the crash involved.
 */
(function () {
  const { fmt, ROAD_USER_COLORS: RC } = U;
  const FN = "First Nations people", NI = "Non-Indigenous";
  const POPS = [FN, NI];
  const POP_LABEL = { [FN]: "First Nations people", [NI]: "Non-Indigenous people" };
  const YEARS = [2011, 2021];

  const SCHEMES = {
    roadUser: {
      key: "roadUserMix", order: "roadUserOrder", noun: "road user",
      title: "Share of hospitalisations by road user (%)",
      colors: RC, focus: "Motorcyclist",
      label: (c) => (c === "Other" ? "Other" : c),
      note: (c) => (c === "Other" ? "Total minus the four main groups: bus, heavy vehicle, van and other or unknown road users, including cells not published." : ""),
    },
    counterparty: {
      key: "counterpartyMix", order: "counterpartyOrder", noun: "crash type",
      title: "Share of hospitalisations by what the crash involved (%)",
      colors: { "Car, pick-up truck or van": "#0072B2", "Non-collision transport accident": "#CC79A7", "Fixed or stationary object": "#8C6D31", Other: "#8C8C8C" },
      focus: "Non-collision transport accident",
      label: (c) => ({ "Car, pick-up truck or van": "Car, pick-up or van", "Non-collision transport accident": "Non-collision", "Fixed or stationary object": "Fixed object" }[c] || c),
      note: () => "",
    },
  };

  function build(D, scheme) {
    const S = SCHEMES[scheme], F = D.firstNations, cats = F[S.order];
    const get = (p, yr, c) => F[S.key].find((d) => d.population === p && d.year === yr && d.category === c);
    const series = [];
    POPS.forEach((p) => cats.forEach((c) => {
      const v = YEARS.map((yr) => { const r = get(p, yr, c); return { year: yr, share: r.share, n: r.hospitalisations }; });
      series.push({ pop: p, cat: c, v, change: v[1].share - v[0].share });
    }));
    return { S, cats, series };
  }

  function render(el, D, opts, scheme) {
    const W = opts.width, narrow = U.isNarrow(W);
    const { S, cats, series } = build(D, scheme);
    U.legend(el, cats.map((c) => ({ label: S.label(c), color: S.colors[c], shape: "line" })));

    // layout: two panels side by side, or stacked on narrow screens
    const cols = narrow ? 1 : 2, colGap = 40;
    const pw = (W - colGap * (cols - 1)) / cols;
    const leftLab = 44, rightLab = narrow ? 150 : 158;
    const slopeW = Math.max(90, pw - leftLab - rightLab);
    const ph = narrow ? 230 : 280, panelTop = 30, rowGap = 24;
    const rows = Math.ceil(POPS.length / cols);
    const m = { top: 8, bottom: 30 };
    const H = m.top + rows * (panelTop + ph + 24) + (rows - 1) * rowGap + m.bottom;
    const y = d3.scaleLinear().domain([0, 60]).range([ph, 0]);

    const fnF = series.find((s) => s.pop === FN && s.cat === S.focus);
    const niF = series.find((s) => s.pop === NI && s.cat === S.focus);
    const svg = U.svg(el, W, H,
      `Slopegraph of the ${S.title.replace(" (%)", "").replace(/^Share/, "share")}, 2011 to 2021, one panel for First Nations people and one for non-Indigenous people. ` +
      `${S.label(S.focus)}: First Nations ${fmt.pct(fnF.v[0].share)} to ${fmt.pct(fnF.v[1].share)}; non-Indigenous ${fmt.pct(niF.v[0].share)} to ${fmt.pct(niF.v[1].share)}.`);
    const root = svg.append("g").attr("transform", `translate(0,${m.top})`);

    POPS.forEach((p, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const ox = col * (pw + colGap), oy = row * (panelTop + ph + 24 + rowGap);
      const g = root.append("g").attr("transform", `translate(${ox},${oy})`);
      g.append("text").attr("class", "panel-title").attr("x", 0).attr("y", 14).attr("fill", U.C.ink).text(POP_LABEL[p]);

      const pg = g.append("g").attr("transform", `translate(${leftLab},${panelTop})`);
      const x0 = 0, x1 = slopeW;
      // year rails
      YEARS.forEach((yr, k) => {
        const xx = k ? x1 : x0;
        pg.append("line").attr("class", "rail").attr("x1", xx).attr("x2", xx).attr("y1", 0).attr("y2", ph)
          .attr("stroke", U.C.context).attr("stroke-width", 1);
        pg.append("text").attr("class", "row-label").attr("x", xx).attr("y", ph + 18).attr("text-anchor", "middle").text(yr);
      });

      const ss = series.filter((s) => s.pop === p);
      const lg = pg.append("g").selectAll("g").data(ss).join("g").attr("class", "slope");
      lg.append("line").attr("x1", x0).attr("x2", x1)
        .attr("y1", (s) => y(s.v[0].share)).attr("y2", (s) => y(s.v[1].share))
        .attr("stroke", (s) => S.colors[s.cat]).attr("stroke-width", (s) => (s.cat === S.focus ? 3.5 : 2.25))
        .attr("stroke-linecap", "round");
      lg.selectAll("circle").data((s) => s.v.map((v, k) => ({ s, v, k }))).join("circle")
        .attr("cx", (d) => (d.k ? x1 : x0)).attr("cy", (d) => y(d.v.share)).attr("r", (d) => (d.s.cat === S.focus ? 5 : 4))
        .attr("fill", (d) => S.colors[d.s.cat]).attr("stroke", "#fff").attr("stroke-width", 1.5);
      // invisible wide hit line (also the keyboard stop)
      lg.append("line").attr("class", "hit").attr("x1", x0).attr("x2", x1)
        .attr("y1", (s) => y(s.v[0].share)).attr("y2", (s) => y(s.v[1].share))
        .attr("stroke", "transparent").attr("stroke-width", 16).style("pointer-events", "stroke");

      // direct labels, nudged apart: value on the left, name + value on the right
      const L = U.relax(ss.map((s) => ({ s, y: y(s.v[0].share) })), 14, 4, ph);
      const R = U.relax(ss.map((s) => ({ s, y: y(s.v[1].share) })), 14, 4, ph);
      const labs = pg.append("g");
      labs.selectAll("text.l").data(L).join("text").attr("class", "end-label l")
        .attr("x", x0 - 9).attr("y", (d) => d.y + 4).attr("text-anchor", "end").text((d) => Math.round(d.s.v[0].share) + "%");
      labs.selectAll("text.r").data(R).join("text").attr("class", (d) => "end-label r" + (d.s.cat === S.focus ? " active" : ""))
        .attr("x", x1 + 9).attr("y", (d) => d.y + 4).text((d) => `${Math.round(d.s.v[1].share)}% ${S.label(d.s.cat)}`);

    });

    const all = root.selectAll("g.slope"), labels = root.selectAll("text.end-label");
    all.on("pointermove pointerdown mouseover", (ev, s) => {
      all.classed("dim", (o) => o.cat !== s.cat);
      labels.style("opacity", (d) => (d.s.cat === s.cat ? 1 : 0.35));
      const peer = series.find((o) => o.pop !== s.pop && o.cat === s.cat);
      const ch = (c) => (c >= 0 ? "+" : "−") + Math.abs(c).toFixed(1) + " pts";
      U.tip.show(ev, `<div class="tt-title"><span class="tt-sw" style="background:${S.colors[s.cat]}"></span>${S.label(s.cat)} · ${POP_LABEL[s.pop]}</div>` +
        U.tip.row("2011", `${fmt.pct(s.v[0].share)} (${fmt.int(s.v[0].n)})`) +
        U.tip.row("2021", `${fmt.pct(s.v[1].share)} (${fmt.int(s.v[1].n)})`) +
        U.tip.row("Change", ch(s.change)) +
        U.tip.row(`${POP_LABEL[peer.pop]} change`, ch(peer.change)) +
        (S.note(s.cat) ? `<div class="tt-note">${S.note(s.cat)}</div>` : ""));
    }).on("pointerleave", (ev) => { all.classed("dim", false); labels.style("opacity", null); U.tip.hide(ev); });

    root.append("text").attr("class", "axis-title").attr("x", 0).attr("y", H - m.top - 6)
      .text(S.title.replace(" (%)", "") + ", 2011 and 2021. Both panels use the same 0–60% scale.");
  }

  function table(D, opts, scheme) {
    const { S, series } = build(D, scheme);
    return {
      caption: `${S.title.replace(" (%)", "")}: First Nations and non-Indigenous people, 2011 and 2021 (% and count)`,
      columns: [{ key: "who", label: "Population" }, { key: "cat", label: S.noun[0].toUpperCase() + S.noun.slice(1) },
        { key: "a", label: "2011", num: true }, { key: "b", label: "2021", num: true }, { key: "c", label: "Change (pts)", num: true }],
      rows: series.map((s) => ({
        who: POP_LABEL[s.pop], cat: S.label(s.cat),
        a: `${fmt.pct(s.v[0].share)} (${fmt.int(s.v[0].n)})`, b: `${fmt.pct(s.v[1].share)} (${fmt.int(s.v[1].n)})`,
        c: (s.change >= 0 ? "+" : "−") + Math.abs(s.change).toFixed(1),
      })),
    };
  }

  Charts.f4 = {
    render: (el, D, o) => render(el, D, o, o.mode),
    table: (D, o) => table(D, o, o.mode),
    defaults: { mode: "roadUser" },
  };
})();
