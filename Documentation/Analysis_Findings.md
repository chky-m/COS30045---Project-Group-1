# Analysis Findings: validated insights

*All figures are reproducible with `Website/scripts/build_data.py --report`, which uses only the Python standard library and reads the processed CSVs in `DataVisualisation_Analysis_and_Preprocessing/Dataset/Processed/`.*

**Scope:** National, State & Territory and First Nations datasets.

## Measures and definitions

| Measure | Definition | Source |
|---|---|---|
| **Hospitalisations (volume)** | National `Hospitalisations` field, which equals `Count of cases − Died_cases` (that is, it excludes deaths in care). Complete for 2011–2021. | National processed CSV, `Cause of injury = Traffic` |
| **State hospitalisations** | `count of cases excluding died in hospitals within 30 days`. This is the same concept as the national `Hospitalisations` field. | State T1–T5 CSVs |
| **Deaths per 1,000 cases** | Σ`Died_cases` ÷ Σ`Count of cases` × 1,000, for **2011–2019 only** (death data ends in June 2020). | National |
| **Share of deaths** | A group's Σ`Died_cases` as a share of all `Died_cases`, 2011–2019. | National |
| **Bed days per case** | Σ`Bed days` ÷ Σ`Hospitalisations`. **This is not comparable across the 1 July 2015 rule change.** | National, State T1 |
| **Index (2011 = 100)** | count(year) ÷ count(2011) × 100 | Derived |

## National findings

1. **The decade trend.** Hospitalisations went from 34,033 (2011) to 39,866 (2019 peak) to 39,505 (2021). That is **+16.1%** over 2011–2021 and +17.1% over 2011–2019.
   *Method: sum of `Hospitalisations` by `Calendar year`.*
2. **The COVID-19 dip is concentrated in early 2020.**
   - April 2020 had 2,357 hospitalisations, the lowest of all 132 months. The average April in other years is 3,209.
   - H1 2020 was **−11.3%** compared with H1 2019. H2 2020 was +1.8%.
   - *We say "coincides with COVID-19 restrictions". The data does not show the cause.*
3. **Cyclists are the fastest-growing group.** Cyclist hospitalisations rose from 5,391 to 8,163 (**+51.4%**), and were already +35.4% by 2019.
   - In H1 2020, cyclists were the only major group to rise (+7.2% compared with H1 2019).
   - The others fell: pedestrians −28.4%, car passengers −19.7%, car drivers −17.0% and motorcyclists −10.4%.
4. **Pedestrians: low volume, high severity.** Pedestrians are **7.3% of cases but 26.4% of deaths in care** (2011–2019).
   - Pedestrians: 21.8 deaths per 1,000 cases and 9.04 bed days per case.
   - Cyclists, for comparison: 1.9 deaths per 1,000 and 2.91 bed days.
   - The pedestrian decline is mostly in 2020–21. From 2011 to 2019 it was only −1.5%.
5. **Older people: age drives severity.**
   - **Ages 75+ are 6.3% of cases but 29.2% of deaths in care**, with 28.1 deaths per 1,000 and 9.88 bed days per case.
   - Ages 65–74 have 9.9 deaths per 1,000.
   - Ages 17–64 account for 78.3% of hospitalisations.
6. **Sex.** Males account for **64.9%** of hospitalisations. The male-to-female ratio is 2.47 at ages 8–16 and 1.45 at ages 0–7, and it is even (1.00) at ages 75+.
7. **What the crash involved (counterparty), 2011–2019.**
   - Heavy vehicle or bus: 3.0% of cases but **10.0% of deaths**, at 20.4 deaths per 1,000.
   - Fixed object: 8.9 per 1,000.
   - Non-collision: 2.7 per 1,000.
   - Train: 57.2 per 1,000, **but based on only 17 deaths**, so do not headline it.
8. **Remoteness (the patient's usual residence, not the crash location).**
   - Regional residents: 6.9 deaths per 1,000 and 5.48 bed days per case.
   - Major cities: 5.5 deaths per 1,000 and 4.61 bed days per case.
   - Cyclists are 21.2% of major-city cases but 8.2% of remote cases.
   - Car passengers are 11.9% of major-city cases and 21.1% of remote cases.
9. **Seasonality is mild.** Per day, there are about 95 hospitalisations in January, July and August, compared with about 106 in March, April, October and November. Treat this as secondary.
10. **Deaths in care.** These fell from 261 (2011) to 194 (2019), and from 7.6 to 4.8 deaths per 1,000 cases. The path is not a straight line: 2016 had 268 deaths. Present this as an indicative trend only.

## State and Territory findings

11. **NSW's decline is mainly a counting change.**
    - NSW went from 11,474 (2016) to 9,794 (2018), a −14.6% step.
    - The half-yearly figures put the drop in H1 2018, which was −12.2% against H1 2017. It follows the June 2017 change to emergency department admission policy.
    - Within periods that are comparable: +8.1% for 2011–2016 and −8.1% for 2018–2021.
12. **Victoria's series break.**
    - H1 2012 had 4,669 and H2 2012 had 3,429 (−26.6%). This coincides with the exclusion of emergency-department-only cases from 1 July 2012.
    - From 2013 to 2021, Victoria grew **+43.0%**. The headline 2011–2021 figure of +19.3% understates this.
13. **Queensland grew +65.2%** (6,322 to 10,447) and passed NSW in **2020** (9,801 vs 9,274). The NSW counting change widens that gap.
    - Queensland also jumped +23.7% from 2011 to 2013, with no documented cause.
    - Queensland car occupants grew +98%.
14. **Cyclist hospitalisations rose in every state (2011–2021):**

    | State | Change |
    |---|---|
    | ACT | +123% (149 to 333) |
    | Tas | +62% |
    | Vic | +60% |
    | Qld | +57% |
    | SA | +52% |
    | NT | +48% |
    | NSW | +37% |
    | WA | +33% |

    In the ACT, cyclists make up **33.7%** of cases.
15. **The Northern Territory has a distinctive profile.**
    - Non-collision accidents are **44.4%** of NT cases. Other states range from 21.8% to 33.7%.
    - Car occupants are 52.7% of NT cases, but car-on-car collisions are only 26.0%.
    - Ages 17–39 are 55.9% of NT cases, and ages 65+ only 4.3%.
16. **Growth ranking for 2011–2021:**

    | State | Change |
    |---|---|
    | Qld | +65% |
    | Tas | +63% |
    | NT | +56% |
    | ACT | +38% |
    | Vic | +19% ⚠ |
    | SA | +12% |
    | WA | +4% |
    | NSW | −15% ⚠ |

    ⚠ NSW and Victoria are affected by series breaks. Use NSW 2018→2021 and Victoria 2013→2021 instead.

## First Nations findings

Source: `First-Nations-hospitalised-injuries-2023/t2–t5` CSVs (`t1_age_group.csv` duplicates `t3` and is not used). Annual totals are the sum of the counterparty table (t5), which matches workbook Table 1 for both groups in every year. Mix comparisons use 2011 and 2021, the two years with no unpublished age cells.

17. **Trend.** First Nations hospitalisations went from 1,167 (2011) to 2,220 (2021), **+90.2%**, peaking at 2,290 in 2020. Non-Indigenous hospitalisations went from 31,997 to 36,755 (**+14.9%**). The First Nations share of the two groups combined rose from 3.5% to 5.7%.
18. **Age (2021).** **47.9%** of First Nations cases were under 26 (1,063 of 2,220), against 28.2% for non-Indigenous people. The largest First Nations group was 17–25 (686). People aged 65+ were 2.0% of First Nations cases vs 14.6% of non-Indigenous cases.
19. **Usual residence (2021, known residence only).** Remote: **23.0%** of First Nations cases (503 of 2,183) vs 1.7% of non-Indigenous cases (600 of 36,186). Major cities: 36.4% vs 69.8%. 37 First Nations cases had unknown residence.
20. **Road user.**
    - Motorcyclists rose from **16.0% to 23.4%** of First Nations cases (187 to 520). The non-Indigenous share was 22.5% in both years.
    - From 2019 to 2020, First Nations motorcyclist cases rose from 353 to 545, while non-Indigenous ones fell from 8,463 to 8,038.
    - In 2021, pedestrians were 10.6% of First Nations cases vs 5.6%, and cyclists 9.3% vs 21.4%.
    - "Other" is the total minus the four main road-user groups, which are never suppressed. It therefore includes the unpublished cells.
21. **Crash type (2021).** Non-collision transport accidents were **33.4%** of First Nations cases vs 26.8% of non-Indigenous cases.
22. **Data checks.**
    - 66 rows were unpublished: 62 in the road-user table and 4 in the age table.
    - One record is absent: First Nations bus occupants, January–June 2011.
    - These are counts and mixes, not rates, and there is no death measure in this workbook.

## Reconciliation and data checks

- **The states do not sum to the national total.** The eight states sum to **1.2–2.5% less** than the national figure every year: 480 short in 2011, 997 in 2019 and 470 in 2021.
  - The data dictionary only says that totals can differ because of unknown categories, so **this gap is unexplained**.
  - Never present the states as adding up to the national figure.
- **Bed-day rule change (1 July 2015).**
  - National bed days per case went from 3.92 in 2014–15 to 5.78 in 2015–16 (+47%).
  - Victoria went from 3.41 (2014) to 6.54 (2016), and NSW reached 6.08 by 2018.
  - **Do not trend bed days across this change.**
- **Unpublished (`n.p.`) cells.**
  - In the state road-user table they occur only in the "Other" group (bus, heavy vehicle, van, unknown), and are at most 2.6% of a state's total (Tas 2.6%, NT 2.5%, ACT 1.8%). The four main road-user groups are complete.
  - In the state age table they fall in ages 0–7, 65–74 and 75+ for the ACT (4.8% unpublished), Tas (2.9%) and NT (2.6%). The youngest and oldest shares are understated for those states.
- **Death data** is available only to June 2020 (2020 = January–June only; 2021 = none).

## Comparisons that are NOT valid

- **Per-capita or per-distance rates:** there are no population or exposure denominators.
- **Road-user categories between datasets:** the state table merges car driver, passenger and unknown position into one "car occupant" group. Collapse the national categories before comparing.
- **Counterparty categories between datasets:** national has 10 categories and state has 4, and the state "Other" group has no national equivalent.
- **Deaths by state:** the state tables exclude deaths.
- **NSW and Victoria counts across their series breaks**, and **bed days across July 2015**.

## Recommended metric for each chart

| Chart | Data key | Metric |
|---|---|---|
| Decade trend | `national.yearly` | Annual count, with break markers |
| Monthly heatmap | `national.monthly` | Monthly count, with April 2020 highlighted |
| Road-user trends | `national.roadUserByYear` | Index (2011 = 100), with counts in the tooltip |
| COVID-19 half-year | `national.covidHalfYears` | % change from H1 2019 to H1 2020 (diverging bars) |
| Volume vs severity | `national.roadUserSeverity` | Share of cases vs share of deaths (dumbbell) |
| Age and sex | `national.ageSex`, `national.ageSeverity` | Counts by sex, plus deaths per 1,000 |
| Counterparty | `national.counterpartySeverity` | Deaths per 1,000, with small numbers flagged |
| Remoteness | `national.remotenessRoadUser` | 100% stacked shares |
| State trends | `state.halfYearly`, `state.annual` | Small multiples, with break markers |
| State growth ranking | `state.annual` | % change, with the base year labelled |
| State road-user mix | `state.roadUserMix` | Heatmap of shares, with coverage noted |
| State counterparty mix | `state.counterpartyMix` | Stacked shares |
| State age mix | `state.ageMix` | Shares, with ACT, NT and Tas understatement flagged |
| Cyclists by state | `state.roadUserByYear` | Cyclist index (2011 = 100) |

## Corrections to the earlier `Data_Story.md`

- **"Pedestrians −15.3%":** most of this decline is in 2020–21. Over 2011–2019 the change is only −1.5%.
- **"Queensland overtook NSW by 2021":** this happened in 2020, and the NSW series break inflates the gap.
- **NSW −15% and Victoria +19%:** both are distorted by series breaks. Use the comparable periods instead.
- **"Deaths in care −26%":** this depends on which years are chosen. Prefer deaths per 1,000 cases (7.6 to 4.8) as an indicative figure.
- **Train fatality rate:** this rests on 17 deaths only.
- **Confirmed unchanged:**
  - +16.1% overall growth
  - cyclists +51.4%
  - pedestrians 7.3% of cases vs 26.4% of deaths
  - ages 75+ 6.3% of cases vs 29.2% of deaths
  - males 64.9%
  - the 8–16 sex ratio of 2.5 to 1
  - ACT cyclists 34%
  - NT non-collision 44%
  - regional 6.9 vs major cities 5.5 deaths per 1,000
