/* F4 - First Nations vs non-Indigenous: did the road-user (or crash-type) mix shift 2011 -> 2021?
 * Data:  STORY_DATA.firstNations.{roadUserMix, counterpartyMix} rows {population, year, category, hospitalisations, share}
 * Chart: 100% stacked horizontal bars, one per population and year (four bars). The focus category
 *        (the headline's) sits first, on the 0% edge, so its 2011 and 2021 widths share a baseline.
 *        Light bands join each category's 2011 and 2021 segments, so a widening slice is easy to see.
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
      label: (c) => c,
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
    const S = SCHEMES[scheme], F = D.firstNations;
    // focus category first so it starts at 0%, the rest in the data's own order
    const cats = [S.focus, ...F[S.order].filter((c) => c !== S.focus)];
    const get = (p, yr, c) => F[S.key].find((d) => d.population === p && d.year === yr && d.category === c);
    const series = [];
    POPS.forEach((p) => cats.forEach((c) => {
      const v = YEARS.map((yr) => { const r = get(p, yr, c); return { year: yr, share: r.share, n: r.hospitalisations }; });
      series.push({ pop: p, cat: c, v, change: v[1].share - v[0].share });
    }));
    // one bar per population and year, with each segment's start and end
    const bars = [];
    POPS.forEach((p) => YEARS.forEach((yr, k) => {
      let acc = 0;
      const segs = cats.map((c) => {
        const s = series.find((o) => o.pop === p && o.cat === c);
        const seg = { s, cat: c, pop: p, year: yr, share: s.v[k].share, n: s.v[k].n, x0: acc };
        acc += s.v[k].share;
        seg.x1 = acc;
        return seg;
      });
      // shares are rounded in the source: scale so each bar ends exactly at 100%
      segs.forEach((g) => { g.x0 *= 100 / acc; g.x1 *= 100 / acc; });
      bars.push({ pop: p, year: yr, k, segs });
    }));
    return { S, cats, series, bars };
  }

  function render(el, D, opts, scheme) {
    const W = opts.width, narrow = U.isNarrow(W);
    const { S, cats, series, bars } = build(D, scheme);
    U.legend(el, cats.map((c) => ({ label: S.label(c), color: S.colors[c], shape: "swatch" })));

    const yearW = 44, barH = narrow ? 30 : 36, bandH = narrow ? 22 : 26, groupTitle = 26, groupGap = 22;
    const m = { top: 6, right: narrow ? 8 : 12, bottom: 48, left: yearW };
    const iw = W - m.left - m.right;
    const groupH = groupTitle + barH * 2 + bandH;
    const plotH = POPS.length * groupH + (POPS.length - 1) * groupGap;
    const H = m.top + plotH + m.bottom;
    const x = d3.scaleLinear().domain([0, 100]).range([0, iw]);

    const fnF = series.find((s) => s.pop === FN && s.cat === S.focus);
    const niF = series.find((s) => s.pop === NI && s.cat === S.focus);
    const svg = U.svg(el, W, H,
      `100% stacked bar chart of the ${S.title.replace(" (%)", "").replace(/^Share/, "share")}, 2011 and 2021, for First Nations and non-Indigenous people. ` +
      `${S.label(S.focus)}: First Nations ${fmt.pct(fnF.v[0].share)} to ${fmt.pct(fnF.v[1].share)}; non-Indigenous ${fmt.pct(niF.v[0].share)} to ${fmt.pct(niF.v[1].share)}.`);
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

    g.append("g").attr("class", "grid").attr("transform", `translate(0,${plotH})`)
      .call(d3.axisBottom(x).tickValues([0, 25, 50, 75, 100]).tickSize(-plotH).tickFormat("")).call((s) => s.select(".domain").remove());
    U.clampTicks(U.styleAxis(g.append("g").attr("transform", `translate(0,${plotH})`)
      .call(d3.axisBottom(x).tickValues([0, 25, 50, 75, 100]).tickFormat((d) => d + "%"))));
    U.axisTitle(g, iw / 2, plotH + 38, S.title.replace(" (%)", "") + ", 2011 and 2021 (%)");

    const barY = (b) => POPS.indexOf(b.pop) * (groupH + groupGap) + groupTitle + (b.k ? barH + bandH : 0);

    POPS.forEach((p, i) => {
      g.append("text").attr("class", "panel-title").attr("x", -yearW).attr("y", i * (groupH + groupGap) + 16)
        .attr("fill", U.C.ink).text(POP_LABEL[p]);
    });

    // bands joining each category's 2011 segment to its 2021 segment
    const bandData = [];
    POPS.forEach((p) => {
      const [a, b] = bars.filter((r) => r.pop === p);
      a.segs.forEach((sa, j) => bandData.push({ s: sa.s, cat: sa.cat, a: sa, b: b.segs[j], y0: barY(a) + barH, y1: barY(b) }));
    });
    const band = g.append("g").selectAll("path").data(bandData).join("path").attr("class", "f4-band")
      .attr("d", (d) => {
        const m0 = (d.y0 + d.y1) / 2;
        return `M${x(d.a.x0)},${d.y0} C${x(d.a.x0)},${m0} ${x(d.b.x0)},${m0} ${x(d.b.x0)},${d.y1}` +
          ` L${x(d.b.x1)},${d.y1} C${x(d.b.x1)},${m0} ${x(d.a.x1)},${m0} ${x(d.a.x1)},${d.y0} Z`;
      })
      .attr("fill", (d) => S.colors[d.cat]).attr("fill-opacity", (d) => (d.cat === S.focus ? 0.35 : 0.14));

    // year labels and the bars themselves
    const bar = g.append("g").selectAll("g").data(bars).join("g").attr("transform", (b) => `translate(0,${barY(b)})`);
    bar.append("text").attr("class", "row-label").attr("x", -8).attr("y", barH / 2 + 4).attr("text-anchor", "end").text((b) => b.year);
    const seg = bar.selectAll("g").data((b) => b.segs).join("g").attr("class", "f4-seg");
    seg.append("rect").attr("x", (d) => x(d.x0)).attr("width", (d) => Math.max(0, x(d.x1) - x(d.x0)))
      .attr("y", 0).attr("height", barH).attr("fill", (d) => S.colors[d.cat])
      .attr("stroke", "#FBFAF7").attr("stroke-width", 1.5);
    // value inside the segment when it fits; the focus segment's label is bold
    seg.filter((d) => x(d.x1) - x(d.x0) >= (narrow ? 30 : 34)).append("text")
      .attr("class", "value-label small").attr("x", (d) => (x(d.x0) + x(d.x1)) / 2).attr("y", barH / 2 + 4)
      .attr("text-anchor", "middle").style("pointer-events", "none").style("stroke", "none")
      .style("font-weight", (d) => (d.cat === S.focus ? 700 : 600))
      .attr("fill", (d) => U.inkOn(S.colors[d.cat]))
      .text((d) => Math.round(d.share) + "%");
    // outline the focus segment so the eye goes to it first
    seg.filter((d) => d.cat === S.focus).append("rect").attr("x", (d) => x(d.x0) + 1).attr("y", 1)
      .attr("width", (d) => Math.max(0, x(d.x1) - x(d.x0) - 2)).attr("height", barH - 2)
      .attr("fill", "none").attr("stroke", U.C.ink).attr("stroke-width", 1.5).style("pointer-events", "none");

    const ch = (c) => (c >= 0 ? "+" : "−") + Math.abs(c).toFixed(1) + " pts";
    seg.on("pointermove pointerdown", (ev, d) => {
      seg.classed("dim", (o) => o.cat !== d.cat);
      band.attr("fill-opacity", (o) => (o.cat === d.cat ? 0.4 : 0.05));
      const s = d.s, peer = series.find((o) => o.pop !== s.pop && o.cat === s.cat);
      U.tip.show(ev, `<div class="tt-title"><span class="tt-sw" style="background:${S.colors[s.cat]}"></span>${S.label(s.cat)} · ${POP_LABEL[s.pop]}</div>` +
        U.tip.row("2011", `${fmt.pct(s.v[0].share)} (${fmt.int(s.v[0].n)})`) +
        U.tip.row("2021", `${fmt.pct(s.v[1].share)} (${fmt.int(s.v[1].n)})`) +
        U.tip.row("Change", ch(s.change)) +
        U.tip.row(`${POP_LABEL[peer.pop]} change`, ch(peer.change)) +
        (S.note(s.cat) ? `<div class="tt-note">${S.note(s.cat)}</div>` : ""));
    }).on("pointerleave", (ev) => {
      seg.classed("dim", false);
      band.attr("fill-opacity", (o) => (o.cat === S.focus ? 0.35 : 0.14));
      U.tip.hide(ev);
    });
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
