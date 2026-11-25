/* F2-F3 - First Nations vs non-Indigenous: how the mix of hospitalisations differs
 * Question: How did First Nations and non-Indigenous patterns differ by age, usual residence, and did the mix shift between 2011 and 2021?
 * Data:     STORY_DATA.firstNations.{ageMix, remotenessMix}
 *           rows {population, year, category, hospitalisations, share}
 * Chart:    100% stacked bars, one per population x year (2011 and 2021: the years with no
 *           n.p. cells in the age table). One renderer, two chart ids:
 *             f2 age · f3 usual residence (known residence only). F4 is a slopegraph: f4-slope.js
 */
(function () {
  const { fmt } = U;
  const FN = "First Nations people", NI = "Non-Indigenous";
  const POP_LABEL = { [FN]: "First Nations people", [NI]: "Non-Indigenous people" };

  const SCHEMES = {
    age: {
      key: "ageMix", order: "ageOrder", title: "Share of hospitalisations by age group at admission (%)",
      colors: { "0-7": "#E3EAF3", "8-16": "#C0D0E4", "17-25": "#8FAACD", "26-39": "#5F83B3", "40-64": "#365C8D", "65+": "#1F3A5F" }, // one hue, light to dark (no section purple inside charts)
      label: (c) => c,
    },
    remoteness: {
      key: "remotenessMix", order: "remotenessOrder", title: "Share of hospitalisations by remoteness of usual residence (known residence, %)",
      colors: { "Major Cities": "#C9D7E8", Regional: "#6F95C2", Remote: "#1F3A5F" },
      label: (c) => (c === "Major Cities" ? "Major cities" : c),
    },
  };

  function build(D, scheme) {
    const S = SCHEMES[scheme], F = D.firstNations, cats = F[S.order];
    const rows = [];
    [FN, NI].forEach((p) => [2011, 2021].forEach((yr) => {
      let x0 = 0;
      const segs = cats.map((c) => {
        const r = F[S.key].find((d) => d.population === p && d.year === yr && d.category === c);
        const s = { pop: p, year: yr, cat: c, n: r.hospitalisations, share: r.share, x0 };
        x0 += r.share;
        return s;
      });
      rows.push({ pop: p, year: yr, segs });
    }));
    return { S, cats, rows };
  }

  function render(el, D, opts, scheme) {
    const W = opts.width, narrow = U.isNarrow(W);
    const { S, cats, rows } = build(D, scheme);
    U.legend(el, cats.map((c) => ({ label: S.label(c), color: S.colors[c] })));

    const lab = narrow ? 44 : 60, barH = narrow ? 26 : 30, gap = 8, groupGap = 34;
    const m = { top: 26, right: 8, bottom: 52 };
    const bw = W - lab - m.right;
    const H = m.top + 2 * (groupGap + 2 * (barH + gap)) + m.bottom;
    const fn21 = rows[1], ni21 = rows[3];
    const big = (r) => r.segs.reduce((a, b) => (b.share > a.share ? b : a));
    const svg = U.svg(el, W, H,
      `100 percent stacked bars comparing First Nations and non-Indigenous hospitalisations in 2011 and 2021. ${S.title}. ` +
      `2021: largest First Nations group ${S.label(big(fn21).cat)} (${fmt.pct(big(fn21).share)}); largest non-Indigenous group ${S.label(big(ni21).cat)} (${fmt.pct(big(ni21).share)}).`);
    const g = svg.append("g").attr("transform", `translate(0,${m.top})`);
    const x = d3.scaleLinear().domain([0, 100]).range([lab, lab + bw]);
    U.axisTitle(g, 0, -10, "Population and year", { anchor: "start" });

    let yPos = 0;
    const placed = [];
    [FN, NI].forEach((p) => {
      yPos += groupGap;
      g.append("text").attr("class", "panel-title").attr("x", 0).attr("y", yPos - 10)
        .attr("fill", U.C.ink).text(POP_LABEL[p]);
      rows.filter((r) => r.pop === p).forEach((r) => { placed.push({ r, y: yPos }); yPos += barH + gap; });
    });

    const row = g.append("g").selectAll("g").data(placed).join("g").attr("transform", (d) => `translate(0,${d.y})`);
    row.append("text").attr("class", "row-label").attr("x", 0).attr("y", barH / 2 + 4).text((d) => d.r.year);
    const seg = row.selectAll("g.seg").data((d) => d.r.segs).join("g").attr("class", "seg");
    seg.append("rect").attr("x", (d) => x(d.x0) + 0.5).attr("width", (d) => Math.max(0, x(d.x0 + d.share) - x(d.x0) - 1))
      .attr("height", barH).attr("rx", 2).attr("fill", (d) => S.colors[d.cat]);
    seg.filter((d) => x(d.x0 + d.share) - x(d.x0) > (narrow ? 30 : 36)).append("text").attr("class", "seg-label")
      .attr("x", (d) => x(d.x0 + d.share / 2)).attr("y", barH / 2 + 4).attr("text-anchor", "middle")
      .attr("fill", (d) => U.inkOn(S.colors[d.cat])).text((d) => Math.round(d.share) + "%");

    seg.on("pointermove pointerdown", (ev, d) => {
      seg.classed("dim", (o) => o.cat !== d.cat);
      const other = rows.find((r) => r.pop === d.pop && r.year !== d.year).segs.find((s) => s.cat === d.cat);
      const peer = rows.find((r) => r.pop !== d.pop && r.year === d.year).segs.find((s) => s.cat === d.cat);
      U.tip.show(ev, `<div class="tt-title"><span class="tt-sw" style="background:${S.colors[d.cat]}"></span>${S.label(d.cat)}</div>` +
        U.tip.row(`${POP_LABEL[d.pop]}, ${d.year}`, `${fmt.int(d.n)} (${fmt.pct(d.share)})`) +
        U.tip.row(`Same group, ${other.year}`, fmt.pct(other.share)) +
        U.tip.row(`${POP_LABEL[peer.pop]}, ${d.year}`, fmt.pct(peer.share)) +
        (scheme === "remoteness" ? `<div class="tt-note">Share of cases with a known usual residence.</div>` : ""));
    }).on("pointerleave", (ev) => { seg.classed("dim", false); U.tip.hide(ev); });

    U.styleAxis(g.append("g").attr("transform", `translate(0,${yPos + 2})`)
      .call(d3.axisBottom(x).ticks(narrow ? 4 : 5).tickFormat((v) => v + "%"))).call(U.clampTicks);
    U.axisTitle(g, lab + bw / 2, yPos + 40, S.title);
  }

  function table(D, opts, scheme) {
    const { S, cats, rows } = build(D, scheme);
    return {
      caption: `${S.title.replace(" (%)", "").replace(" (known residence, %)", " (known residence)")}: First Nations and non-Indigenous people, 2011 and 2021 (% and count)`,
      columns: [{ key: "who", label: "Population, year" }].concat(cats.map((c) => ({ key: c, label: S.label(c), num: true }))),
      rows: rows.map((r) => {
        const o = { who: `${POP_LABEL[r.pop]}, ${r.year}` };
        r.segs.forEach((s) => { o[s.cat] = `${fmt.pct(s.share)} (${fmt.int(s.n)})`; });
        return o;
      }),
    };
  }

  Charts.f2 = { render: (el, D, o) => render(el, D, o, "age"), table: (D, o) => table(D, o, "age") };
  Charts.f3 = { render: (el, D, o) => render(el, D, o, "remoteness"), table: (D, o) => table(D, o, "remoteness") };
})();
