# Website: Hospitalised Injuries from Road Crashes in Australia, 2011–2021

COS30045 Data Visualisation · Team Loong (Pham Tien Dat, Tran Trung Tin)

Open `index.html` (double-click, or use VS Code Live Server). It needs no build step, and D3 is bundled.

## Structure

```
Website/
  index.html            the whole site (one page)
  assets/
    css/style.css
    js/d3.v7.min.js  js/utils.js  js/main.js  js/charts/*.js   (one file per chart; f-mix.js draws F2–F4)
    data/story-data.js  generated chart data (do not edit)
  scripts/build_data.py regenerates assets/data/story-data.js from the processed CSVs
```

## Page layout

The nav bar has an **Overview** button, then one link per dataset. Each dataset's charts follow its link.

| Section | Contents |
|---|---|
| Overview | Key figures, why this matters, audience, purpose, the three datasets |
| National | N1 Trend · N2 Road users · N3 Severity · N4 Age & sex · N5 Remoteness |
| State & Territory | S1 Growth · S2 Half-yearly · S3 Cyclists · S4 Injury profiles · S5 Bed days, with a state highlight that is linked across all five charts |
| First Nations | F1 Trend · F2 Age · F3 Usual residence · F4 Road user & crash type |
| Takeaways | Five key findings, and what the data can't tell us |
| Methods | Measures, reporting breaks, and national-vs-states reconciliation |

## Regenerate the data

```
python3 Website/scripts/build_data.py
```

This reads `DataVisualisation_Analysis_and_Preprocessing/Dataset/Processed/`. Numbers in the page text are filled from the data through `data-stat` attributes, so the text updates with it. The validated figures are in `../Documentation/Analysis_Findings.md`.
