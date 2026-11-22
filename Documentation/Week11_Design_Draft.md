# Week 11 Draft: Visualisation, Interaction and Website Design

*Team Loong · COS30045 · Draft content for Design Book sections 3.1–3.3, the prototype figures, and the coding plan. Figures are in `Documentation/figures/`.*

---

## 3.1 Website Design

### Concept
The site is a single-page **data story**: *"Who ends up in hospital?"* It runs from the big picture to the detail:

1. **Overview** sets out why this matters, who the site is for, and its purpose.
2. **The three datasets** follow, each telling its own story with 4–5 charts.
3. **Takeaways** and **Methods** close the page.

We chose one scrolling page over separate pages because the datasets are parts of one argument. National totals raise questions that the state and First Nations data then answer. Transition sentences between sections carry the reader from one dataset to the next.

### Audience and purpose (from section 1)
| Audience | What they need |
|---|---|
| Policymakers and agencies (BITRE, state and territory transport and health agencies) | Where the burden is concentrated, so they can prioritise interventions |
| Road-safety researchers | Comparable, documented views, with every data limitation kept in view |
| General public | An accessible picture of road-trauma trends and the groups most affected |

The site has three purposes:
- **Prioritise:** show where the hospitalised-injury burden falls.
- **Inform:** raise public awareness.
- **Be transparent:** keep reporting breaks, unpublished values and missing death data visible.

The audience and purpose are stated once, in the Overview. Each dataset section then tells a different story:

| Section | Story question | Charts |
|---|---|---|
| Dataset 1: National | How big is the problem, and who is hurt worst? | N1–N5 |
| Dataset 2: State & Territory | Does the national story hold in every state? | S1–S5 |
| Dataset 3: First Nations | How do First Nations people's hospitalisations differ? | F1–F4 |

### Layout and navigation (Figure 1, Figure 2)
- **Sticky navigation bar:**
  - An **Overview** button, then a "Datasets" group (National · State & Territory · First Nations) and Takeaways.
  - The link for the section in view is highlighted while scrolling (scroll-spy), and a thin progress bar shows how far through the story the reader is.
- **Hero:** title, a one-paragraph thesis, and three key-stat cards:
  - +16.1% national growth
  - "1 in 4" deaths in hospital were pedestrians
  - +90.2% First Nations growth
- **Overview:** why it matters, three audience cards, three purpose bullets, and three dataset cards that link to each section.
- **Chart block:** every chart uses the same structure (Figure 1B):
  1. Kicker (e.g. *N3 · National · Severity*)
  2. **Headline stating the finding**, not just the topic
  3. One-sentence description, including how to interact
  4. Toggles (only where useful) and legend
  5. The D3 chart
  6. "View data table" (an accessible alternative)
  7. **Why it matters**
  8. **Caveat** box
- **Takeaways:** five numbered finding cards, plus a dark "What this data can't tell us" panel.
- **Methods:** measures, reporting breaks, and a national-vs-state reconciliation table.

### Visual style
| Element | Choice | Reason |
|---|---|---|
| Headlines | Source Serif 4 (serif) | Editorial, report-like tone; strong hierarchy |
| Body and chart text | Inter (sans-serif), 17px body | Legible at small sizes; tabular figures in tables and axes |
| Background | Warm off-white `#FBFAF7` | Softer than pure white for long reading |
| Reading width | 720px for text, 1040px for wide charts | Comfortable line length; wide charts get room |
| Text contrast | All body text ≥ 4.5:1 (main ink 16.5:1) | WCAG AA |

### Responsive design (Figure 1C, Figure 4)
- Every chart re-draws to its container width (`ResizeObserver`, debounced). On narrow screens it uses fewer ticks and shorter labels.
- Grids collapse to one column below 860px: the stat cards, the audience and dataset cards, and S1's map and bars, which stack.
- The S4 heatmap scrolls sideways inside its own container instead of shrinking, and a hint says so.
- The state picker becomes a single horizontally scrolling row of chips.

---

## 3.2 Visualisation Design

### Design principles
1. **One question per chart.** The headline answers it.
2. **Counts, not invented rates.** There are no population denominators, so no per-capita figures. Severity is shown per 1,000 cases.
3. **Show the limitations on the chart itself:**
   - Reporting changes appear as dashed rules or hatching, labelled ⚠: Victoria July 2012, NSW June 2017, bed days July 2015.
   - Unpublished (n.p.) values stay visible as "Not published", never as zero.
   - Rates based on fewer than 30 deaths are greyed out.
4. **Direct labelling** (end labels, value labels, segment percentages), so readers don't have to look back at a legend.
5. **Every axis has a title**, and bar and line scales start at zero. Exceptions are marked: the index chart is anchored at 100, and the S5 axis starts at 3, which the chart states.

### Colour system (shared across all 14 charts)
| Meaning | Colour |
|---|---|
| Hospitalisations / single series | Navy `#1F3A5F` |
| Deaths in hospital / severity | Crimson `#A1283B` (only ever used for deaths) |
| Car driver (and the state "car occupant" group) · Car passenger | `#0072B2` · `#56B4E9` |
| Motorcyclist · Pedal cyclist · Pedestrian · Other | `#E69F00` · `#009E73` · `#D55E00` · `#8C8C8C` |
| First Nations · non-Indigenous | Purple `#7B3294` · grey `#6B7280` |
| Growth (S1) | Diverging blue → white → red (warm = more hospitalisations) |
| Share (S4) | Sequential white → navy |
| Reporting breaks / annotations | Dashed grey `#6B7280`, with hatching on affected areas |

The road-user colours come from the **Okabe-Ito colour-blind-safe palette**. Each road user keeps the same colour in every chart, so a reader who learns "green = cyclists" in N2 can read S3, S4 and F4 without the legend.

### Chart designs
**Dataset 1: National** (Figures 3a–3e)

| # | Question | Idiom and encoding | Why this idiom |
|---|---|---|---|
| N1 | How did hospitalisations change, 2011–2021? | **Line chart**: half-yearly (or annual) counts, with break markers. A second panel shows deaths in hospital per 1,000 cases, 2011–2019. | Position on a common scale is the most accurate way to read a trend; half-years reveal the early-2020 dip and the reporting breaks |
| N2 | Which road users grew fastest? | **Multi-line chart** indexed to 2011 = 100. Cyclists are highlighted and other lines muted until focused. | Indexing puts groups of very different size on one scale; highlighting avoids a "spaghetti" chart |
| N3 | Who is over-represented among deaths? | **Dumbbell chart**: share of cases (navy dot) vs share of deaths (crimson dot), sorted by the gap | The length of the line *is* the mismatch, which makes "7% of cases → 26% of deaths" visible at a glance |
| N4 | Who is hospitalised, and how does severity change with age? | **Diverging bars**: male left, female right, by age, with a **dot strip** of deaths per 1,000 | A population-pyramid layout compares the sexes directly; the linked strip adds severity without overloading the bars |
| N5 | Does the injury mix differ by where patients live? | **100% stacked bars** of road-user mix by remoteness, plus death-rate and bed-day columns | Part-to-whole comparison across four groups; numbers beside the bars avoid a second chart |

**Dataset 2: State & Territory** (Figures 3f–3j)

| # | Question | Idiom and encoding | Why this idiom |
|---|---|---|---|
| S1 | Which states grew most over comparable windows? | **Tile-grid map** coloured by % change, plus **ranked bars**. The window toggle covers 2018–21, 2012–16 and 2011–21. | The tiles give geographic context without the size distortion of a choropleth. The ranked bars give exact comparison. A raw-count map would just show population size |
| S2 | Where are the reporting breaks? | **Small multiples**: eight half-yearly lines, with breaks hatched and an own-scale/shared-scale toggle | Each state's shape is readable, and the NSW and Victoria step changes stand out |
| S3 | Did cyclist hospitalisations rise everywhere? | **Ranked horizontal bars** of % change, 2011→2021, with counts beside them | A simple, accurate length comparison; the counts flag small bases |
| S4 | How do state injury profiles differ? | **Heatmap**: state × category share, with a road user / counterparty / age toggle and a "Not published" column | Compact for 8 × 6 values; colour shows the pattern and printed values give precision |
| S5 | How many bed days does each hospitalisation use? | **Dot plot** with a national reference line, July 2015 – December 2021 only | Dots suit a measure whose axis need not start at zero; the reference line answers "above or below average?" |

**Dataset 3: First Nations** (Figures 3k–3n)

| # | Question | Idiom and encoding | Why this idiom |
|---|---|---|---|
| F1 | How did the two groups' counts change? | **Two-line index chart** (2011 = 100), with a toggle to the First Nations share | The groups differ about 20-fold in size, so indexing is the only fair way to compare growth on one axis |
| F2 | How does the age mix differ? | **100% stacked bars**, population × year (2011 and 2021), sequential purple by age | Shows both the gap between groups and the change over time in one view |
| F3 | Where do patients usually live? | Same idiom, by remoteness (known residence only) | Consistent with F2, so readers learn the chart once |
| F4 | Which road users and crash types? | Same idiom, with a road user / crash-type toggle | Re-uses the road-user colours from N2 and S4 |

**Rejected alternatives:**
- **Pie charts:** too hard to compare across groups.
- **Choropleth of raw counts:** it mostly shows population size.
- **Stacking the states to make the national total:** the states fall 1.2–2.5% short of the national figure.
- **A single combined dashboard:** each dataset uses different category schemes, so they are never mixed in one chart.

---

## 3.3 Interaction Design

The interaction is **guided, not exploratory-first**: the page tells the story in order, and the interactions let readers check and extend it.

### Global interactions
| Interaction | Behaviour |
|---|---|
| Section navigation | Nav links scroll smoothly to each dataset; scroll-spy highlights the current section; progress bar |
| Tooltips | Hover (or tap on touch screens) shows the exact values, n, comparisons and caveat notes for any mark |
| Toggle buttons | Pill buttons with `aria-pressed`, fully keyboard-operable; the chart redraws with a 300ms fade (none with reduced-motion) |
| Data tables | Every chart has a "View data table" disclosure with the exact numbers, the accessible alternative to hover |
| Responsive redraw | Charts re-render on resize instead of scaling the SVG, so text stays legible |

### Chart-specific interactions
| Chart | Interaction | Purpose |
|---|---|---|
| N1 | Half-yearly / annual toggle; crosshair tooltip with change from the previous period | See short-term dips vs the long-term trend |
| N2 | Index / counts toggle; legend buttons bring any road user to the front | Compare growth vs volume; focus on one group |
| N3 | Road user / "what the crash involved" toggle; tooltip with deaths n and bed days | Two views of severity; show small-number warnings |
| N5, F2–F4 | Hovering a segment dims the other categories; the tooltip compares with the other year and the other group | Follow one category across bars |
| **S1–S5** | **Linked state highlighting:** clicking a state (tile, bar, panel or chip in the sticky state picker) highlights it in all five state charts | Lets a state's agency follow its own jurisdiction through the section |
| S1 | Comparison-window toggle | Avoid comparisons that cross reporting breaks |
| S2 | Own-scale / shared-scale toggle; the crosshair lines up the same half-year in all eight panels | Compare shapes vs sizes |
| S4 | Category toggle; "Sort by" chips reorder the states by any column | Find which state leads each category |
| F1 | Index / First Nations share toggle; crosshair tooltip with both counts | Growth vs share of the total |

### Accessibility in interaction
- Every SVG has `role="img"` and an `aria-label` that states the chart's finding in words.
- All controls are real `<button>` elements, with a visible focus ring. Keyboard focus is kept when a chart redraws.
- Tooltips are supplementary; all their information is also in the data tables.
- Animation is minimal and respects `prefers-reduced-motion`.

---

## Prototype and sketches

| Figure | File | Shows |
|---|---|---|
| 1 | `figures/wireframe.png` | Low-fidelity sketches: (A) page structure, (B) chart-block anatomy, (C) mobile layout |
| 2 | `figures/overview.png` | Working prototype: nav bar, hero and key stats |
| 3a–3e | `figures/n1.png` … `n5.png` | National charts |
| 3f–3j | `figures/s1.png` … `s5.png` | State & Territory charts |
| 3k–3n | `figures/f1.png` … `f4.png` | First Nations charts |
| 4 | `figures/mobile-n2.png` | N2 redrawn at phone width |

The prototype is fully working: open `Website/index.html`.

---

## Plan for coding

### Data to be loaded
| Source (processed in KNIME) | Used for |
|---|---|
| `national_hospitalised_injury_counts_processed.csv` (86,140 Traffic rows) | N1–N5 |
| `state-and-territory…/Table1–Table5 CSVs` | S1–S5 |
| `First-Nations…/t2–t5 CSVs` (t1 duplicates t3 and is not used) | F1–F4 |

**Pipeline:**
- `Website/scripts/build_data.py` (Python standard library only) aggregates the CSVs into one small file, `assets/data/story-data.js` (`window.STORY_DATA`, about 134 KB).
- The browser never parses the 86k-row CSV. Because the data loads through a `<script>` tag rather than `d3.csv()`, the site also works when opened directly from disk, where `fetch` is blocked.
- Re-running the script after any data change updates every chart and every number in the page text.

### Code structure
```
Website/
  index.html                 page content and chart containers (<div class="chart" data-chart="n1">)
  assets/css/style.css       all styles
  assets/js/d3.v7.min.js     D3 7.9.0 (bundled)
  assets/js/utils.js         shared constants and helpers (window.U)
  assets/js/charts/*.js      one file per chart: Charts.n1 = { render, table, defaults }
  assets/js/main.js          mounts charts, wires toggles, linked state, data-bound text, nav
  assets/data/story-data.js  generated data
  scripts/build_data.py      data pipeline
```

**Chart module contract:** each chart exposes the same three things, so `main.js` can mount any chart the same way.
- `render(el, data, opts)` draws the chart. `opts` carries the width, the toggle state, the selected state and a `rerender` callback.
- `table(data, opts)` returns the accessible data table.
- `defaults` holds the initial toggle values.

### Shared constants and helpers (`utils.js`)
| Name | Purpose |
|---|---|
| `U.ROAD_USER_COLORS`, `U.C` | The colour system above (one source of truth) |
| `U.fmt` | Number formatters: thousands, %, signed %, true minus sign |
| `U.STATE_NAMES` | State abbreviation → full name |
| `U.svg` | Creates an accessible SVG (`role`, `aria-label`) |
| `U.axisTitle`, `U.styleAxis` | Consistent axis titles and axis styling |
| `U.breakMarker`, `U.hatch`, `U.note`, `U.textBg` | Reporting-break rules, hatching and annotations |
| `U.legend`, `U.dataTable`, `U.tip` | Legends (optionally as toggle buttons), data tables, the shared tooltip |
| `U.state` | Linked state-selection store used by S1–S5 |
| `U.relax`, `U.inkOn`, `U.debounce`, `U.isNarrow` | Label collision avoidance, readable text on any fill, resize handling |

### Status and remaining work
| Task | Status |
|---|---|
| Data pipeline and all 14 charts | Done |
| Interactions (toggles, tooltips, linked states, sort, tables) | Done |
| Accessibility basics (ARIA, keyboard, contrast, axis titles) | Done |
| Independent check of every figure against the CSVs | Done (National and State); First Nations self-checked |
| Usability evaluation with 3–5 users (task-based: "Which state grew fastest since 2018?") | To do (Week 12) |
| Testing on real phones and tablets; keyboard access to tooltips | To do |
| Deploy to GitHub Pages | To do |
| Final screenshots and write-up in the Design Book | To do |
