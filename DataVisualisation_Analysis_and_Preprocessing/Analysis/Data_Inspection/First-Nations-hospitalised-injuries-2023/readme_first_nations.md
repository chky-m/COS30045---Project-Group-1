# First Nations road crash hospitalisations

This analysis uses BITRE's [First Nations hospitalised injuries workbook](../../../Dataset/Raw/First-Nations-hospitalised-injuries-2023.xlsx) to compare Australian traffic injury hospitalisations for First Nations and non-Indigenous people from 2011 to 2021. The [September 2023 data dictionary](../../../Dataset/Data_Dictionary/hospitalised-injury-data-dictionary-september-2023.pdf) explains the collection and reporting changes. The figures count hospitalisations, so a person may be represented more than once.

## Data preparation

The five half-year blocks in the workbook's `raw` sheet contained 1,187 rows. KNIME found that the age block in columns A:G duplicated Q:W. Keeping Q:W left 923 rows across age, road user, usual residence remoteness and counterparty. Each breakdown describes the same hospitalisations from a different angle, so use each one separately.

The cleaned table preserves the original fields and Excel row references. It flags `n.p.` (not published) and leaves the corresponding numeric fields missing. This affected 132 values across 66 rows. The coverage check found one absent record, for First Nations bus occupants in January–June 2011. Its count is unknown. Published annual sums from the raw blocks can be partial when a record or count is missing. Use workbook Table 1 (T1) for national annual totals. As a cross-check, the counterparty sums matched T1 for both groups in all 11 years.

## Findings

| Comparison | Result |
| --- | --- |
| Annual hospitalisations (T1) | First Nations counts increased from **1,167 in 2011** to **2,220 in 2021** (+90.23%), peaking at **2,290 in 2020**. Non-Indigenous counts increased from **31,997** to **36,755** (+14.87%). Both percentages use the respective 2011 count as the baseline. |
| Change from 2011 to 2012 | First Nations counts rose from **559 to 648** in January–June and **608 to 756** in July–December. The first increase preceded Victoria's July 2012 reporting change. The data do not establish the cause. |
| Motorcyclists (T2) | From 2019 to 2020, First Nations motorcyclist hospitalisations rose from **353 to 545** (+54.39%), while non-Indigenous motorcyclist hospitalisations fell from **8,463 to 8,038**. Both half-year counts were available for these comparisons. |
| Age in 2021 (T3) | Ages under 26 represented **47.88%** of First Nations cases (1,063 of 2,220) and **28.21%** of non-Indigenous cases (10,368 of 36,755). The largest First Nations age group was **17–25**, with **686** hospitalisations. |
| Usual residence in 2021 (T4) | Among cases with known residence, remote areas accounted for **23.04%** of First Nations cases (503 of 2,183) and **1.66%** of non-Indigenous cases (600 of 36,186). |
| Counterparty in 2021 (T5) | Non-collision transport accidents accounted for **33.42%** of First Nations cases (742 of 2,220) and **26.84%** of non-Indigenous cases (9,866 of 36,755). The separate breakdowns cannot show how many of these cases involved motorcyclists. |

Changes to emergency department admission reporting in Victoria (July 2012) and NSW (June 2017) affect comparisons over time. The percentages by age, residence and counterparty describe the mix of hospitalisations. Comparing injury risk would require population or travel exposure data. Remoteness refers to usual residence, and the residence shares exclude cases with unknown residence.

## Processed results

These CSVs were exported by the **First Nations Injury Cleaning** KNIME workflow. In `annual_breakdowns.csv`, check that `Sum(row_count)` is 2 and `Sum(suppressed_cells)` is 0 before using a category's published sum as a complete annual count.

| File | Use |
| --- | --- |
| [cleaned_injuries.csv](../../../Dataset/Processed/First-Nations-hospitalised-injuries-2023/cleaned_injuries.csv) | Cleaned half-year records, source references and publication flags. |
| [annual_totals.csv](../../../Dataset/Processed/First-Nations-hospitalised-injuries-2023/annual_totals.csv) | Published T1 counts by year and population. Use the `*_count` columns for reporting, including `total_count`, which also covers cases with unstated or inadequately described status. |
| [annual_breakdowns.csv](../../../Dataset/Processed/First-Nations-hospitalised-injuries-2023/annual_breakdowns.csv) | Published sums by year, population and category, with coverage and suppression fields. |
| [normalized_trends.csv](../../../Dataset/Processed/First-Nations-hospitalised-injuries-2023/normalized_trends.csv) | Original counts plus separate 0–1 min–max series for comparing trend shapes. |
| [audit_summary.csv](../../../Dataset/Processed/First-Nations-hospitalised-injuries-2023/audit_summary.csv) | Retained row count, suppressed values, coverage gap and outlier check. |
| [trend_findings.csv](../../../Dataset/Processed/First-Nations-hospitalised-injuries-2023/trend_findings.csv) | First Nations endpoint counts, peak year and percentage changes. |
