/* utils.js - shared helpers for every chart.
 *
 * Exposes window.U:
 *   U.fmt            number formatters (thousands, %, signed %, decimals)
 *   U.ROAD_USER_COLORS / U.C   one colour per road user + semantic colours (Visualisation_Blueprint §8)
 *   U.tip            a single shared tooltip (hover on desktop, tap-to-show on touch)
 *   U.svg            creates an accessible <svg role="img" aria-label=...>
 *   U.breakMarker    dashed vertical rule with a ⚠ label (series breaks)
 *   U.note           12px italic annotation text
 *   U.hatch          diagonal-hatch <pattern> for break-affected marks
 *   U.legend         HTML legend (swatches + labels), optionally as toggle buttons
 *   U.dataTable      "View data table" contents
 *   U.state          linked selected-state store for S1-S5
 *   U.relax          nudges direct labels apart so they don't overlap
 *   U.inkOn          picks dark or white text for a given fill colour
 *   U.debounce
 */
(function () {
  "use strict";
  if (!window.d3) return; // main.js shows the "Charts need D3" message
  const U = {};

  /* ------------------------------------------------------------ formatters */
  const MINUS = "−";
  const comma = d3.format(",");
  U.fmt = {
    int: (v) => (v == null ? "n/a" : comma(Math.round(v)).replace("-", MINUS)),
    pct: (v, d = 1) => (v == null ? "n/a" : d3.format(`.${d}f`)(v).replace("-", MINUS) + "%"),
    signed: (v, d = 1) =>
      v == null ? "n/a" : (v > 0 ? "+" : v < 0 ? MINUS : "") + d3.format(`.${d}f`)(Math.abs(v)) + "%",
    dec: (v, d = 1) => (v == null ? "n/a" : d3.format(`.${d}f`)(v)),
    k: (v) => (Math.abs(v) >= 1000 ? d3.format(".1f")(v / 1000) + "k" : comma(v)),
  };

  /* ------------------------------------------------------------ colours */
  // Okabe-Ito based; each road user keeps the same colour in every chart.
  // The state "Car occupant" (driver, passenger or unknown) shares the car-driver blue.
  U.ROAD_USER_COLORS = {
    "Car driver": "#0072B2",
    "Car occupant": "#0072B2",
    "Car passenger": "#56B4E9",
    Motorcyclist: "#E69F00",
    "Pedal cyclist": "#009E73",
    Pedestrian: "#D55E00",
    Other: "#8C8C8C",
  };
  U.C = {
    navy: "#1F3A5F",      // hospitalisations, single series, highlight
    crimson: "#A1283B",   // deaths / severity only
    context: "#C8CCD2",   // non-selected / context
    annot: "#6B7280",     // annotations & break markers (blueprint §8; 4.8:1 on white)
    ink: "#1A1D23",
    ink2: "#4A5160",
    grid: "#E4E6EA",
    male: "#3F4E8C",
    female: "#C46A9B",
    np: "#EEF0F2",        // "Not published" cells
  };
  // S1: growth (bad outcome) is warm; the legend says so explicitly.
  U.divergingColor = (maxAbs) =>
    d3.scaleDiverging().domain([-maxAbs, 0, maxAbs]).interpolator((t) => d3.interpolateRgbBasis(["#2166AC", "#F7F7F7", "#B2182B"])(t));

  U.inkOn = (fill) => {
    const c = d3.rgb(fill);
    const lum = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const L = 0.2126 * lum(c.r) + 0.7152 * lum(c.g) + 0.0722 * lum(c.b);
    // crossover where dark and white text give equal contrast is L ~ 0.179
    return L > 0.179 ? U.C.ink : "#FFFFFF";
  };

  /* ------------------------------------------------------------ svg + annotations */
  U.svg = (el, w, h, label) =>
    d3.select(el).append("svg")
      .attr("viewBox", `0 0 ${w} ${h}`)
      .attr("width", w).attr("height", h)
      .attr("role", "img")
      .attr("aria-label", label);

  U.hatch = (svg, id, color = "#6B7280", bg = "none") => {
    let defs = svg.select("defs");
    if (defs.empty()) defs = svg.append("defs");
    const p = defs.append("pattern").attr("id", id).attr("patternUnits", "userSpaceOnUse")
      .attr("width", 6).attr("height", 6).attr("patternTransform", "rotate(45)");
    if (bg !== "none") p.append("rect").attr("width", 6).attr("height", 6).attr("fill", bg);
    p.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 6)
      .attr("stroke", color).attr("stroke-width", 1.6).attr("stroke-opacity", 0.75);
    return `url(#${id})`;
  };

  /** Dashed vertical rule with a small "⚠ label". `lines` may be a string or an array (multi-line). */
  U.breakMarker = (g, x, y0, y1, lines, { anchor = "start", dx = 4, dy = 0, warn = true } = {}) => {
    const m = g.append("g").attr("class", "break-marker");
    m.append("line").attr("x1", x).attr("x2", x).attr("y1", y0).attr("y2", y1)
      .attr("stroke", U.C.annot).attr("stroke-dasharray", "4 3").attr("stroke-width", 1);
    if (lines) {
      const arr = Array.isArray(lines) ? lines : [lines];
      const t = m.append("text").attr("class", "annot").attr("x", x + (anchor === "end" ? -dx : dx))
        .attr("y", y0 + 11 + dy).attr("text-anchor", anchor);
      arr.forEach((s, i) => t.append("tspan").attr("x", x + (anchor === "end" ? -dx : dx))
        .attr("dy", i ? 13 : 0).text((i === 0 && warn ? "⚠ " : "") + s));
    }
    return m;
  };

  /** Put a page-coloured box behind a text node so rules and lines never run through it. */
  U.textBg = (textSel, pad = 2) => {
    const n = textSel.node();
    if (!n || !n.getBBox) return;
    let b;
    try { b = n.getBBox(); } catch (e) { return; }
    if (!b.width) return;
    d3.select(n.parentNode).insert("rect", () => n).attr("class", "text-bg")
      .attr("x", b.x - pad).attr("y", b.y - 1).attr("width", b.width + pad * 2).attr("height", b.height + 2)
      .attr("fill", "#FBFAF7").attr("rx", 2);
  };

  /** Italic annotation text; `lines` string or array. */
  U.note = (g, x, y, lines, anchor = "start", cls = "annot") => {
    const arr = Array.isArray(lines) ? lines : [lines];
    const t = g.append("text").attr("class", cls).attr("x", x).attr("y", y).attr("text-anchor", anchor);
    arr.forEach((s, i) => t.append("tspan").attr("x", x).attr("dy", i ? 13 : 0).text(s));
    return t;
  };

  /** Axis title. Default: centred text (x-axis titles under the axis). `anchor: "start"` for a
   *  category (y) title above row labels; `rotate: true` for a vertical title beside a y-axis. */
  U.axisTitle = (g, x, y, text, { anchor = "middle", rotate = false } = {}) => {
    const t = g.append("text").attr("class", "axis-title").attr("text-anchor", anchor).text(text);
    return rotate ? t.attr("transform", `translate(${x},${y}) rotate(-90)`) : t.attr("x", x).attr("y", y);
  };

  /** Recessive axis styling helper. */
  U.styleAxis = (sel) => {
    sel.attr("class", "axis");
    sel.select(".domain").remove();
    return sel;
  };

  /** Anchor the first and last tick labels inward so they never hang outside the chart box. */
  U.clampTicks = (axisSel) => {
    const t = axisSel.selectAll(".tick text");
    const n = t.size();
    t.attr("text-anchor", (d, i) => (i === 0 ? "start" : i === n - 1 ? "end" : "middle"));
    return axisSel;
  };

  /** After a chart is drawn: wrap any axis or panel title that is wider than the chart, and
   *  nudge it back inside, so long titles never run off the edge on a narrow screen. */
  U.fitText = (svgNode) => {
    if (!svgNode) return;
    const box = svgNode.getBoundingClientRect();
    if (!box.width) return;
    const pad = 2;
    svgNode.querySelectorAll("text.axis-title, text.panel-title").forEach((t) => {
      if (t.getAttribute("transform") && /rotate/.test(t.getAttribute("transform"))) return;
      let r = t.getBoundingClientRect();
      if (r.left >= box.left - 0.5 && r.right <= box.right + 0.5) return;
      const words = t.textContent.split(/\s+/);
      const x = +t.getAttribute("x") || 0;
      // room available, in px (viewBox width = rendered width for these charts)
      const avail = box.width - 2 * pad;
      const lines = [];
      let cur = "";
      const probe = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      t.textContent = "";
      t.appendChild(probe);
      words.forEach((w) => {
        const tryLine = cur ? cur + " " + w : w;
        probe.textContent = tryLine;
        if (probe.getComputedTextLength() > avail && cur) { lines.push(cur); cur = w; } else cur = tryLine;
      });
      lines.push(cur);
      t.textContent = "";
      lines.forEach((ln, i) => {
        const ts = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
        ts.setAttribute("x", x);
        ts.setAttribute("dy", i ? "1.2em" : 0);
        ts.textContent = ln;
        t.appendChild(ts);
      });
      // shift the whole title back inside the chart box if it still hangs over an edge
      r = t.getBoundingClientRect();
      let dx = 0;
      if (r.left < box.left + pad) dx = box.left + pad - r.left;
      else if (r.right > box.right - pad) dx = box.right - pad - r.right;
      if (dx) t.querySelectorAll("tspan").forEach((ts) => ts.setAttribute("x", x + dx));
      // a wrapped title adds a line: make the svg taller so the new line is not cut off
      const over = t.getBoundingClientRect().bottom - svgNode.getBoundingClientRect().bottom;
      if (over > 0) {
        const vb = svgNode.viewBox.baseVal, add = Math.ceil(over) + 4;
        svgNode.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.width} ${vb.height + add}`);
        svgNode.setAttribute("height", +svgNode.getAttribute("height") + add);
      }
    });
  };

  /** Keyboard access for a drawn chart (G5, G7): Tab focuses the chart, arrow keys step
   *  through its marks and show the same tooltip and fade as hover, Enter or Space selects
   *  (same as a click), Escape clears. It reuses each chart's own pointer handlers, so mouse,
   *  touch and keyboard always behave the same. Wide hover overlays (line charts) are stepped
   *  through at their x-axis ticks. */
  U.keynav = (svg) => {
    if (!svg || svg.dataset.keynav) return;
    svg.dataset.keynav = "1";
    svg.setAttribute("tabindex", "0");
    const hint = " Keyboard: arrow keys step through the values, Enter selects, Escape clears.";
    svg.setAttribute("aria-label", (svg.getAttribute("aria-label") || "") + hint);
    const hovers = (n) => (n.__on || []).some((o) => o.type === "pointermove" || o.type === "mouseover" || o.type === "mousemove");
    const stops = () => {
      const box = svg.getBoundingClientRect();
      const out = [];
      svg.querySelectorAll("*").forEach((n) => {
        if (!hovers(n)) return;
        const r = n.getBoundingClientRect();
        if (!r.width && !r.height) return;
        if (r.width > box.width * 0.4 && r.height > box.height * 0.25) {
          // a plot-sized hover overlay (line charts): stop at each x-axis tick inside it
          const xs = new Set();
          svg.querySelectorAll(".tick").forEach((t) => {
            const m = /translate\(\s*([-\d.]+)[ ,]+0\s*\)/.exec(t.getAttribute("transform") || "");
            if (!m || t.closest("[transform*='rotate']")) return;
            const label = t.querySelector("text");
            if (!label || !label.textContent.trim()) return; // grid lines have no label
            const tr = label.getBoundingClientRect(), cx = Math.round(tr.left + tr.width / 2);
            if (cx >= r.left - 1 && cx <= r.right + 1) xs.add(cx);
          });
          [...xs].sort((p, q) => p - q).forEach((cx) => out.push({ n, x: cx, y: r.top + r.height / 2 }));
        } else out.push({ n, x: r.left + r.width / 2, y: r.top + r.height / 2 });
      });
      // reading order, and one stop per position (a mark and its hit area share one stop)
      out.sort((p, q) => (Math.abs(p.y - q.y) > 6 ? p.y - q.y : p.x - q.x));
      return out.filter((p, k) => !k || Math.abs(p.x - out[k - 1].x) > 3 || Math.abs(p.y - out[k - 1].y) > 3);
    };
    let i = -1, cur = null;
    const fire = (type, s) => s && s.n.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: s.x, clientY: s.y, pointerType: "mouse" }));
    const clear = () => { fire("pointerleave", cur); fire("mouseout", cur); U.tip.hide(); cur = null; i = -1; };
    svg.addEventListener("keydown", (ev) => {
      const k = ev.key;
      if (k === "Escape") { clear(); if (U.state.selected) U.state.clear(); return; }
      if ((k === "Enter" || k === " ") && cur) { ev.preventDefault(); fire("pointerdown", cur); cur.n.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: cur.x, clientY: cur.y })); return; }
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[k];
      if (step == null && k !== "Home" && k !== "End") return;
      ev.preventDefault();
      const all = stops();
      if (!all.length) return;
      if (cur) { fire("pointerleave", cur); fire("mouseout", cur); }
      i = k === "Home" ? 0 : k === "End" ? all.length - 1 : Math.max(0, Math.min(all.length - 1, i + step));
      cur = all[i];
      fire("pointermove", cur);
      fire("mouseover", cur);
    });
    svg.addEventListener("blur", clear);
  };

  /** Push label positions apart (1-D) so they keep at least `gap` px between them. */
  U.relax = (items, gap = 13, min = -Infinity, max = Infinity) => {
    const a = items.slice().sort((p, q) => p.y - q.y);
    for (let iter = 0; iter < 60; iter++) {
      let moved = false;
      for (let i = 1; i < a.length; i++) {
        const d = a[i].y - a[i - 1].y;
        if (d < gap) {
          const s = (gap - d) / 2;
          a[i].y += s; a[i - 1].y -= s; moved = true;
        }
      }
      a.forEach((p) => { p.y = Math.max(min, Math.min(max, p.y)); });
      if (!moved) break;
    }
    return items;
  };

  /* ------------------------------------------------------------ legend + table */
  /**
   * items: [{key, label, color, shape:"swatch"|"line"|"dot"|"ring"|"hatch"|"dash"}]
   * If onToggle is given, items render as buttons with aria-pressed (keyboard accessible).
   */
  U.legend = (el, items, { onToggle = null, active = null, label = "Legend" } = {}) => {
    const wrap = d3.select(el).append("div").attr("class", "legend").attr("role", onToggle ? "group" : null)
      .attr("aria-label", label);
    items.forEach((it) => {
      const node = onToggle
        ? wrap.append("button").attr("type", "button").attr("class", "legend-item legend-btn")
            .attr("aria-pressed", active === it.key ? "true" : "false")
            .on("click", () => onToggle(it.key))
        : wrap.append("span").attr("class", "legend-item");
      node.append("span").attr("class", `key key-${it.shape || "swatch"}`)
        .style("--c", it.color || U.C.navy).attr("aria-hidden", "true");
      node.append("span").text(it.label);
    });
    return wrap;
  };

  U.dataTable = (el, columns, rows, caption) => {
    el.innerHTML = "";
    const t = d3.select(el).append("table").attr("class", "data-table");
    if (caption) t.append("caption").text(caption);
    t.append("thead").append("tr").selectAll("th").data(columns).join("th")
      .attr("scope", "col").attr("class", (c) => (c.num ? "num" : null)).text((c) => c.label);
    t.append("tbody").selectAll("tr").data(rows).join("tr").selectAll("td")
      .data((r) => columns.map((c) => ({ c, v: c.fmt ? c.fmt(r[c.key], r) : r[c.key] })))
      .join("td").attr("class", (d) => (d.c.num ? "num" : null)).text((d) => (d.v == null ? "n/a" : d.v));
  };

  /* ------------------------------------------------------------ tooltip */
  const tipEl = document.createElement("div");
  tipEl.className = "rc-tooltip";
  // decorative for assistive tech: SVG aria-labels and the data tables are the accessible path
  tipEl.setAttribute("aria-hidden", "true");
  tipEl.hidden = true;
  document.addEventListener("DOMContentLoaded", () => document.body.appendChild(tipEl));
  let lastPointer = "mouse";
  U.tip = {
    show(event, html) {
      if (!tipEl.isConnected) document.body.appendChild(tipEl);
      lastPointer = event.pointerType || (event.type && event.type.startsWith("touch") ? "touch" : "mouse");
      tipEl.innerHTML = html;
      tipEl.hidden = false;
      const pad = 14, vw = window.innerWidth, vh = window.innerHeight;
      const r = tipEl.getBoundingClientRect();
      let x = event.clientX + pad, y = event.clientY + pad;
      if (x + r.width > vw - 8) x = Math.max(8, event.clientX - r.width - pad);
      if (y + r.height > vh - 8) y = Math.max(8, event.clientY - r.height - pad);
      tipEl.style.left = x + "px";
      tipEl.style.top = y + "px";
    },
    hide(event) {
      // On touch, keep the tooltip until the reader taps elsewhere (tap-to-show).
      if (event && (event.pointerType === "touch" || lastPointer === "touch") && event.type === "pointerleave") return;
      tipEl.hidden = true;
    },
    row: (k, v, swatch) =>
      `<div class="tt-row">${swatch ? `<span class="tt-sw" style="background:${swatch}"></span>` : ""}<span>${k}</span><b>${v}</b></div>`,
  };
  document.addEventListener("pointerdown", (e) => {
    if (!e.target.closest || !e.target.closest("svg")) tipEl.hidden = true;
  });
  window.addEventListener("scroll", () => { if (lastPointer !== "touch") tipEl.hidden = true; }, { passive: true });

  /* ------------------------------------------------------------ linked state selection (S1-S5) */
  const listeners = [];
  U.state = {
    selected: null,
    set(s) {
      this.selected = this.selected === s ? null : s;
      listeners.forEach((fn) => fn(this.selected));
    },
    clear() { this.selected = null; listeners.forEach((fn) => fn(null)); },
    on(fn) { listeners.push(fn); },
  };
  U.STATE_NAMES = {
    NSW: "New South Wales", Vic: "Victoria", Qld: "Queensland", WA: "Western Australia",
    SA: "South Australia", Tas: "Tasmania", ACT: "Australian Capital Territory", NT: "Northern Territory",
  };

  /* ------------------------------------------------------------ misc */
  U.debounce = (fn, ms = 150) => {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  };
  /** Date at the middle of a half-year ("H1" -> 1 Apr, "H2" -> 1 Oct). */
  U.halfDate = (year, half) => new Date(year, half === "H1" || half === "Jan-Jun" ? 3 : 9, 1);
  U.isNarrow = (w) => w < 560;

  window.U = U;
  window.Charts = window.Charts || {};
})();
