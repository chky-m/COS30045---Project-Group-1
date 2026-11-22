# Week 11 Draft: Visualisation, Interaction and Website Design

*Team Loong · COS30045 · Draft for Design Book sections 3.1–3.3 and the coding plan. Each design is drawn as a flowchart (Mermaid, which renders on GitHub and in VS Code's Markdown preview).*

---

## 3.1 Website Design

### Site structure
The site is a single scrolling page that tells one story, *"Who ends up in hospital?"*. The Overview states the audience and purpose once. Each dataset then tells its own story with 4–5 charts.

```mermaid
flowchart TD
    NAV["Sticky nav bar (always visible)<br/>Overview · National · State &amp; Territory · First Nations · Takeaways<br/>each link jumps to its section · current section highlighted"]
    NAV --> HERO

    subgraph OV["OVERVIEW"]
        HERO["Hero<br/>title · thesis · 3 key stats<br/>+16.1% · 1 in 4 · +90.2%"] --> WHY["Why this matters"]
        WHY --> AUD["Audience<br/>policymakers · researchers · public"]
        AUD --> PUR["Purpose<br/>prioritise · inform · be transparent"]
        PUR --> CARDS["3 dataset cards<br/>one story question each"]
    end

    CARDS --> NAT
    subgraph NAT["DATASET 1 · NATIONAL"]
        NQ(["Story: how big is the problem,<br/>and who is hurt worst?"]) --> N1["N1 Trend"] --> N2["N2 Road users"] --> N3["N3 Severity"] --> N4["N4 Age &amp; sex"] --> N5["N5 Remoteness"]
    end

    NAT -->|"transition sentence"| ST
    subgraph ST["DATASET 2 · STATE &amp; TERRITORY"]
        SQ(["Story: does the national story<br/>hold in every state?"]) --> SP["Sticky state picker"] --> S1["S1 Growth"] --> S2["S2 Half-yearly"] --> S3["S3 Cyclists"] --> S4["S4 Injury profiles"] --> S5["S5 Bed days"]
    end

    ST -->|"transition sentence"| FN
    subgraph FN["DATASET 3 · FIRST NATIONS"]
        FQ(["Story: how do First Nations people's<br/>hospitalisations differ?"]) --> F1["F1 Trend"] --> F2["F2 Age"] --> F3["F3 Usual residence"] --> F4["F4 Road user &amp; crash type"]
    end

    FN --> TK["TAKEAWAYS<br/>5 key findings · what the data can't tell us"]
    TK --> ME["METHODS<br/>measures · reporting breaks · national vs states"]
```

### Chart block layout
All 14 charts use the same block, so readers learn how to read the page once.

```mermaid
flowchart TD
    K["Kicker<br/>e.g. N3 · National · Severity"] --> H["Headline<br/>states the finding"]
    H --> D["Description<br/>what you see + how to interact"]
    D --> T{"Has a useful<br/>alternative view?"}
    T -->|yes| TG["Toggle buttons"] --> L["Legend"]
    T -->|no| L
    L --> C["D3 chart<br/>x + y axis titles · tooltips"]
    C --> DT["View data table<br/>accessible alternative"]
    DT --> W["Why it matters"]
    W --> CV["Caveat box<br/>limits of this chart"]
```

### Responsive layout

```mermaid
flowchart TD
    R["Container width changes"] --> W{"Width"}
    W -->|"≥ 860px"| DESK["Desktop<br/>3-column cards · S1 map beside bars"]
    W -->|"560–860px"| TAB["Tablet<br/>cards stack · S1 map above bars"]
    W -->|"< 560px"| MOB["Phone<br/>fewer ticks · short labels · state chips in one scrolling row · S4 heatmap scrolls sideways"]
    DESK --> RD["Chart re-drawn to the new width<br/>(not scaled, so text stays legible)"]
    TAB --> RD
    MOB --> RD
```

**Style:**
- **Fonts:** Source Serif 4 for headlines, Inter for body and chart text.
- **Background and widths:** warm off-white background; text column 720px, wide charts 1040px.
- **Contrast:** all text at least 4.5:1.

---

## 3.2 Visualisation Design

### How each chart was designed

```mermaid
flowchart TD
    Q["Story question"] --> DATA["Measure from the processed data<br/>count · share · index · per 1,000 cases"]
    DATA --> CHK{"Valid comparison?"}
    CHK -->|"crosses a reporting break"| BRK["Mark it: ⚠ dashed rule / hatching<br/>or use a comparable window"]
    CHK -->|"needs population data"| CNT["Use counts or shares instead<br/>(no per-capita rates)"]
    CHK -->|"unpublished values"| NP["Keep them visible as 'Not published'<br/>(never zero)"]
    CHK -->|"OK"| IDIOM
    BRK --> IDIOM
    CNT --> IDIOM
    NP --> IDIOM
    IDIOM["Choose the chart type<br/>trend → line · rank → bars · gap → dumbbell<br/>part of whole → 100% stacked · matrix → heatmap"] --> ENC["Encode<br/>position first · shared colour system<br/>direct labels · axis titles"]
    ENC --> HEAD["Headline = the answer"]
```

### Dataset 1: National

```mermaid
flowchart LR
    subgraph Q["Question"]
        q1["How did hospitalisations change?"]
        q2["Which road users grew fastest?"]
        q3["Who is over-represented among deaths?"]
        q4["Who is hospitalised, and does severity change with age?"]
        q5["Does the injury mix differ by where people live?"]
    end
    subgraph C["Chart"]
        c1["N1 Line chart<br/>+ deaths-per-1,000 panel"]
        c2["N2 Multi-line, index 2011 = 100<br/>cyclists highlighted"]
        c3["N3 Dumbbell<br/>share of cases vs share of deaths"]
        c4["N4 Diverging bars male | female<br/>+ dot strip of deaths per 1,000"]
        c5["N5 100% stacked bars<br/>+ death-rate and bed-day columns"]
    end
    subgraph F["Finding"]
        f1["+16.1%, flat since 2017"]
        f2["Cyclists +51.4%"]
        f3["Pedestrians: 7% of cases, 26% of deaths"]
        f4["2 in 3 male · 75+: 6% of cases, 29% of deaths"]
        f5["Remote: more passengers, fewer cyclists"]
    end
    q1 --> c1 --> f1
    q2 --> c2 --> f2
    q3 --> c3 --> f3
    q4 --> c4 --> f4
    q5 --> c5 --> f5
```

### Dataset 2: State & Territory

```mermaid
flowchart LR
    subgraph Q["Question"]
        q1["Which states grew most?"]
        q2["Where are the reporting breaks?"]
        q3["Did cyclist cases rise everywhere?"]
        q4["How do state injury profiles differ?"]
        q5["How many bed days per hospitalisation?"]
    end
    subgraph C["Chart"]
        c1["S1 Tile-grid map + ranked bars<br/>% change in a comparable window"]
        c2["S2 Small multiples<br/>8 half-yearly lines, breaks hatched"]
        c3["S3 Ranked bars<br/>% change 2011→2021"]
        c4["S4 Heatmap<br/>state × category share + 'Not published'"]
        c5["S5 Dot plot<br/>+ national reference line"]
    end
    subgraph F["Finding"]
        f1["Qld fastest since 2018"]
        f2["NSW fall = counting change"]
        f3["Up in every state, ACT +123.5%"]
        f4["ACT cyclists 33% · NT non-collision 44%"]
        f5["ACT and Qld about 4 days vs about 5.8"]
    end
    q1 --> c1 --> f1
    q2 --> c2 --> f2
    q3 --> c3 --> f3
    q4 --> c4 --> f4
    q5 --> c5 --> f5
```

### Dataset 3: First Nations

```mermaid
flowchart LR
    subgraph Q["Question"]
        q1["How did the two groups' counts change?"]
        q2["How does the age mix differ?"]
        q3["Where do patients usually live?"]
        q4["Which road users and crash types?"]
    end
    subgraph C["Chart"]
        c1["F1 Two-line index chart<br/>2011 = 100 · toggle to First Nations share"]
        c2["F2 100% stacked bars<br/>group × year (2011, 2021)"]
        c3["F3 Same chart type<br/>by remoteness"]
        c4["F4 Same chart type<br/>road user · crash-type toggle"]
    end
    subgraph F["Finding"]
        f1["First Nations +90.2% vs +14.9%"]
        f2["47.9% under 26 vs 28.2%"]
        f3["23.0% remote vs 1.7%"]
        f4["Motorcyclists 16.0% → 23.4%"]
    end
    q1 --> c1 --> f1
    q2 --> c2 --> f2
    q3 --> c3 --> f3
    q4 --> c4 --> f4
```

### Colour system

```mermaid
flowchart LR
    CS["Shared colour system"] --> M["Measures<br/>navy = hospitalisations<br/>crimson = deaths in hospital only"]
    CS --> RU["Road users: Okabe-Ito colour-blind-safe<br/>car driver blue · passenger light blue · motorcyclist orange<br/>cyclist green · pedestrian vermilion · other grey"]
    CS --> G["Groups<br/>First Nations purple · non-Indigenous grey"]
    CS --> SC["Scales<br/>S1 diverging blue → red · S4 white → navy"]
    CS --> A["Annotations<br/>dashed grey rules + hatching = reporting change"]
```

---

## 3.3 Interaction Design

### Reader journey

```mermaid
flowchart TD
    START(["Reader opens the page"]) --> HERO["Hero: thesis + 3 key stats"]
    HERO --> CH{"How do they continue?"}
    CH -->|"scroll"| SEQ["Guided story, in order"]
    CH -->|"nav link"| JUMP["Jump to a dataset"]
    CH -->|"dataset card"| JUMP
    SEQ --> BLOCK["Chart block"]
    JUMP --> BLOCK
    BLOCK --> ACT{"Reader action"}
    ACT -->|"hover / tap a mark"| TIP["Tooltip: exact value, n, comparison, caveat"]
    ACT -->|"click a toggle"| VIEW["Alternative view<br/>e.g. index ↔ counts"]
    ACT -->|"open data table"| TAB["Exact numbers"]
    ACT -->|"click a state (S1–S5)"| LINK["State highlighted in all 5 state charts"]
    ACT -->|"keep scrolling"| NEXT["Next chart · nav highlights current section"]
    TIP --> NEXT
    VIEW --> NEXT
    TAB --> NEXT
    LINK --> NEXT
    NEXT --> END(["Takeaways · what the data can't tell us"])
```

### Toggle interaction (N1, N2, N3, S1, S2, S4, F1, F4)

```mermaid
sequenceDiagram
    actor U as Reader
    participant B as Toggle button
    participant M as main.js
    participant C as Chart module
    U->>B: click / Enter / Space
    B->>M: option value (e.g. mode = "counts")
    M->>M: update chart options · set aria-pressed
    M->>C: render(element, data, options)
    C-->>U: redrawn SVG (300ms fade, none with reduced-motion)
    M->>C: table(data, options)
    C-->>U: data table updated to match
```

### Linked state highlighting (S1–S5)

```mermaid
flowchart LR
    A1["Click a tile or bar in S1"] --> SET["U.state.set(state)"]
    A2["Click a panel in S2"] --> SET
    A3["Click a bar or row in S3 / S5"] --> SET
    A4["Click a chip in the sticky state picker"] --> SET
    SET --> STORE[("Shared selected state")]
    STORE --> NOTIFY["Notify listeners"]
    NOTIFY --> R1["S1 redraw: other states dimmed"]
    NOTIFY --> R2["S2 redraw: panel outlined"]
    NOTIFY --> R3["S3 / S5 redraw: row emphasised"]
    NOTIFY --> R4["S4 redraw: row emphasised"]
    NOTIFY --> R5["Picker: chip pressed · Clear button shown"]
    SET -->|"click the same state again"| CLR["Clear the selection"]
```

### Chart-specific interactions

| Chart | Interaction |
|---|---|
| N1 | Half-yearly / annual toggle · crosshair tooltip with the change from the previous period |
| N2 | Index / counts toggle · legend buttons bring any road user to the front |
| N3 | Road user / "what the crash involved" toggle · tooltip with deaths n |
| N5, F2–F4 | Hovering a segment dims other categories · tooltip compares the other year and the other group |
| S1 | Comparison-window toggle: 2018–21, 2012–16, 2011–21 |
| S2 | Own / shared y-scale toggle · crosshair lines up the same half-year in all 8 panels |
| S4 | Category toggle · "Sort by" chips reorder the states |
| F1 | Index / First Nations share toggle · crosshair tooltip |

**Accessibility:**
- Every chart has `role="img"` and an `aria-label` that states its finding.
- All controls are keyboard-operable buttons using `aria-pressed`.
- Focus is kept when a chart redraws.
- The data tables repeat everything that tooltips show.

---

## Plan for coding

### Data pipeline

```mermaid
flowchart LR
    subgraph RAW["Raw (BITRE xlsx)"]
        R1["National<br/>117,919 rows"]
        R2["State &amp; Territory<br/>5 tables"]
        R3["First Nations<br/>5 half-year blocks"]
    end
    subgraph KN["KNIME preprocessing"]
        K1["Filter Traffic<br/>missing values → 0 or kept missing"]
        K2["Extract 5 tables<br/>n.p. → missing + flag"]
        K3["Remove duplicate age block<br/>n.p. → missing + flag"]
    end
    subgraph CSV["Processed CSVs"]
        C1["national_…_processed.csv<br/>86,140 rows"]
        C2["Table1–Table5 CSVs"]
        C3["t2–t5 CSVs"]
    end
    R1 --> K1 --> C1
    R2 --> K2 --> C2
    R3 --> K3 --> C3
    C1 --> PY["scripts/build_data.py<br/>Python standard library<br/>aggregate · shares · index · windows · checks"]
    C2 --> PY
    C3 --> PY
    PY --> JS[("assets/data/story-data.js<br/>window.STORY_DATA ≈ 134 KB")]
```

**Why the data loads through a `<script>` tag rather than `d3.csv()`:**
- The page works when opened directly from disk, where `fetch` is blocked.
- The browser never parses the 86k-row file.
- Re-running the script updates every chart and every number in the page text.

### Page loading and chart mounting

```mermaid
flowchart TD
    HTML["index.html loads scripts in order"] --> D3["d3.v7.min.js"]
    D3 --> DATA["story-data.js<br/>window.STORY_DATA"]
    DATA --> UT["utils.js<br/>shared constants and helpers → window.U"]
    UT --> MODS["charts/*.js<br/>each registers Charts.id = { render, table, defaults }"]
    MODS --> MAIN["main.js boot()"]
    MAIN --> S["Fill data-stat text<br/>(numbers in the prose)"]
    MAIN --> MC["Mount each div.chart[data-chart]"]
    MAIN --> TGL["Wire the toggle buttons"]
    MAIN --> SS["Build the state picker"]
    MAIN --> NV["Nav scroll-spy + progress bar"]
    MC --> RO["ResizeObserver (debounced)<br/>re-render on width change"]
    MC --> RENDER["Charts[id].render(el, data, opts)"]
    RENDER --> SVG["Accessible SVG"]
    MC --> TBL["Charts[id].table() → data table"]
```

### Shared constants and helpers (`utils.js`)

```mermaid
flowchart LR
    U["window.U"] --> COL["Colours<br/>ROAD_USER_COLORS · C (navy, crimson, …)"]
    U --> FMT["fmt<br/>thousands · % · signed % · true minus"]
    U --> NAMES["STATE_NAMES"]
    U --> DRAW["Drawing<br/>svg · axisTitle · styleAxis · breakMarker · hatch · note · textBg"]
    U --> UI["UI<br/>legend · dataTable · tip (tooltip)"]
    U --> ST["state<br/>linked selection store"]
    U --> UTIL["Utilities<br/>relax (labels) · inkOn (text colour) · debounce · isNarrow"]
    COL --> ALL["Used by all 14 chart modules"]
    FMT --> ALL
    DRAW --> ALL
    UI --> ALL
    ST --> SCH["S1–S5"]
    NAMES --> SCH
```

### Status and next steps

```mermaid
flowchart TD
    subgraph DONE["Done"]
        d1["Data pipeline"]
        d2["14 charts + interactions"]
        d3["Accessibility basics<br/>ARIA · keyboard · contrast · axis titles"]
        d4["Figures checked against the CSVs"]
    end
    subgraph NEXT["Week 12"]
        n1["Usability test with 3–5 users<br/>task-based questions"]
        n2["Test on real phones and tablets"]
        n3["Keyboard access to tooltips"]
    end
    subgraph FINAL["Week 13"]
        x1["Refine from feedback"]
        x2["Deploy to GitHub Pages"]
        x3["Finish the Design Book"]
    end
    DONE --> NEXT --> FINAL
```
