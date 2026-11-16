# State and Territory Hospitalised Injuries from Road Crashes – Dataset Inspection

## 1. Dataset Overview

**Dataset Name:** State and Territory Hospitalised Injuries from Road Crashes

**Source:** Australian Institute of Health and Welfare (AIHW) – National Hospital Morbidity Database

**Original File:** `state-and-territory-hospitalisation-injury-publication-2023.xlsx`

**Data Period:** 2011–2021

**Sheet Used:** `raw`

**Inspection Tool:** KNIME Analytics Platform

This dataset contains hospitalisation statistics related to road traffic crashes across Australian states and territories from 2011 to 2021.

It provides information about hospitalised injury cases and associated bed days, categorised by geographical location, road user, sex, age group, and counterparty.

The dataset is based on national hospital separation data sourced from the AIHW National Hospital Morbidity Database.

**Important:** This dataset focuses specifically on road vehicle traffic accidents (Traffic). It does not include all injury categories available in the National Hospitalised Injury Counts dataset.

---

## 2. Dataset Structure

### 2.1 Workbook Structure

The Excel workbook contains the following worksheets:

| Worksheet | Description |
|---|---|
| Cover | Workbook cover page |
| Index | Index of the available data tables |
| T1 | Annual hospitalisations by state and territory |
| T2 | Hospitalisations by state and territory and road user |
| T3 | Hospitalisations by state and territory and sex |
| T4 | Hospitalisations by state and territory and age group |
| T5 | Hospitalisations by state and territory and counterparty |
| raw | Detailed data used for inspection and preprocessing |

The `raw` worksheet is the primary source for data investigation and preprocessing.

### 2.2 Raw Worksheet Structure

The `raw` worksheet contains five separate data tables arranged horizontally.

| Table | Attributes | Number of Records |
|---|---|---:|
| Annual hospitalisations | Calendar year, 6-monthly period, cause of injury, count of cases, bed days, state or territory | 176 |
| Road user | Calendar year, 6-monthly period, cause of injury, road user, count of cases, bed days, state or territory | 1,371 |
| Sex | Calendar year, 6-monthly period, cause of injury, sex, count of cases, bed days, state or territory | 352 |
| Age group | Calendar year, 6-monthly period, cause of injury, age group, count of cases, bed days, state or territory | 1,232 |
| Counterparty | Calendar year, 6-monthly period, cause of injury, counterparty, count of cases, bed days, state or territory | 704 |

The tables are separated by blank columns and contain different categorical dimensions.

### 2.3 Data Period and Geographical Coverage

The dataset covers 11 calendar years, from 2011 to 2021.

Each year is divided into two reporting periods:

- January–June
- July–December

The dataset includes eight Australian states and territories:

- New South Wales (NSW)
- Victoria (Vic)
- Queensland (Qld)
- South Australia (SA)
- Western Australia (WA)
- Tasmania (Tas)
- Northern Territory (NT)
- Australian Capital Territory (ACT)

### 2.4 Main Attributes

| Attribute | Description |
|---|---|
| Calendar year | Calendar year of the record |
| 6-monthly | Six-month reporting period |
| Cause of injury | Injury classification, recorded as Traffic in this dataset |
| Count of cases | Hospitalised injury cases excluding cases ending in death in care within 30 days |
| Bed days | Hospital bed days excluding those associated with deaths in care within 30 days |
| State or territory | Australian state or territory |
| Road user | Classification of the injured road user |
| Sex | Sex classification |
| Age group | Age group at admission |
| Counterparty | Other party or object involved in the injury event |

---

## 3. Data Dictionary Notes

The accompanying `hospitalised-injury-data-dictionary-september-2023.pdf` is used as the reference for interpreting the dataset.

### 3.1 Data Source and Hospital Separation

The data is sourced from the AIHW National Hospital Morbidity Database.

A hospital separation represents an episode of hospital care. It may represent an entire hospital stay or only part of a stay, such as when a patient changes care type or is transferred.

### 3.2 Cause of Hospital Admission

The dataset focuses on the category:

**Road vehicle traffic accidents (Traffic).**

The category is based on ICD-10-AM coding of the principal diagnosis and external cause.

### 3.3 Deaths in Care

Deaths in care are identified when:

- The separation mode is 8 (died).
- The separation date is within 30 days of the admission date.

The case count and bed-day measures in this dataset exclude cases ending in death in care within 30 days.

### 3.4 Bed Days

Bed days represent the total number of patient days where care has been provided.

The Data Dictionary explains that bed-day calculations may follow different inclusion rules from case counts, particularly in relation to hospital transfers and rehabilitation-related records.

Therefore, case counts and bed days should be investigated separately.

### 3.5 Data Comparability

The Data Dictionary identifies two important breaks in the data series:

- **Victoria:** From calendar year 2012, data is not directly comparable with previous years due to changes in Emergency Department case inclusion criteria.
- **New South Wales:** From June 2017, data is not directly comparable with previous years due to changes in Emergency Department admission policies.

These changes must be considered when analysing trends over time.

### 3.6 Not for Publication Values

Some summary tables contain values marked as `n.p`, meaning Not for Publication.

These values represent small numbers that are not published due to confidentiality or data quality concerns.

They should not automatically be interpreted as zero.

---

## 4. Initial Data Inspection and Table Extraction

The original Excel workbook was examined to understand its structure and identify the data tables required for further analysis.

### 4.1 Raw Worksheet Structure

The `raw` worksheet contains five separate data tables arranged horizontally, with blank columns separating each table.

The five tables represent different dimensions of road traffic injury hospitalisations:

| Table | Description | Records | Columns |
|---|---|---:|---:|
| Table 1 | Annual hospitalisations | 176 | 6 |
| Table 2 | Road user | 1,371 | 7 |
| Table 3 | Sex | 352 | 7 |
| Table 4 | Age group | 1,232 | 7 |
| Table 5 | Counterparty | 704 | 7 |

### 4.2 Extraction of the Five Tables

The five tables were extracted from the original `raw` worksheet using separate Excel Reader nodes in KNIME.

Each node was configured to read a specific cell range from the same worksheet. The header row was also configured to ensure that the original column names were correctly imported.

The extracted ranges were:

| Table | Excel Range | Output Records |
|---|---|---:|
| Annual hospitalisations | A2:F178 | 176 |
| Road user | H2:N1373 | 1,371 |
| Sex | P2:V354 | 352 |
| Age group | X2:AD1234 | 1,232 |
| Counterparty | AF2:AL706 | 704 |

Each table was imported as an independent data table, preserving its own attributes and categorical dimension.

This extraction step separates the horizontally arranged tables into individual datasets, making subsequent inspection, investigation, and preprocessing easier to manage.

The original Excel workbook remains unchanged.

### 4.3 Initial Observations

The initial inspection identified the following characteristics:

- The dataset covers 11 calendar years, from 2011 to 2021.
- The reporting period is divided into two six-month intervals per year.
- The dataset covers all eight Australian states and territories.
- The five extracted tables contain different categorical dimensions.
- All five tables contain numerical measures for hospitalised cases and bed days.
- The extracted tables have the expected row and column counts.
- The dataset includes documented comparability issues affecting Victoria and New South Wales.

Further data quality investigation is required to examine missing values, categorical consistency, numerical distributions, and relationships between the five tables.

---

## 5. Data Quality Investigation

The following areas will be investigated using KNIME:

### 5.1 Missing Values

- Inspect missing values in each of the five raw tables.
- Distinguish actual missing values from blank rows and columns separating the tables.
- Examine whether missing values occur in specific years, periods, states, or categories.
- Investigate whether missing values can be interpreted as zero or should remain missing.

### 5.2 Categorical Attributes

- Inspect unique values in road user, sex, age group, counterparty, and state or territory.
- Check for inconsistent category names or unexpected values.
- Examine missing or unrepresented category combinations.

### 5.3 Numerical Attributes

- Inspect the distributions of count of cases and bed days.
- Identify minimum and maximum values.
- Examine zero values and potential outliers.
- Investigate the relationship between case counts and bed days.

### 5.4 Data Consistency

- Compare the annual hospitalisation table with the corresponding categorical tables.
- Check whether category totals reconcile with their corresponding overall totals.
- Investigate differences caused by unknown or excluded categories.
- Examine whether the five raw tables contain consistent reporting periods and geographical coverage.

### 5.5 Temporal Comparability

- Identify the effects of the Victoria data series break from 2012.
- Identify the effects of the NSW data series break from June 2017.
- Document these limitations for subsequent trend analysis.

### 5.6 Investigation of Not for Publication (n.p.) Values – Road User Table

The Road User table contains 1,371 records. During the investigation, 185 records were identified with `n.p.` values in both the Count of cases and Bed days attributes.

The investigation found the following:

- 185 records contain `n.p.` values.
- 1,186 records contain published numerical values.
- The `n.p.` values occur in five states and territories: ACT, NT, SA, Tasmania, and WA.
- The distribution varies across states and reporting years. Some states contain `n.p.` values throughout the reporting period, while others contain them only in selected years.

The records were grouped by:
- Calendar year
- Six-monthly period
- State or territory

This grouping was used to identify the temporal and geographical distribution of unpublished values.

### 5.7 Reconciliation Between Annual and Road User Tables

The published Road User values were aggregated by calendar year, six-monthly period, and state or territory, then compared with the corresponding Annual table totals.

The investigation identified:

| Measure | Difference |
|---|---:|
| Count of cases | 650 |
| Bed days | 3,712 |

The differences occurred in groups containing `n.p.` records. Groups without `n.p.` records reconciled with the Annual table.

Since multiple Road User records within the same group contain `n.p.`, the individual unpublished values cannot be determined through simple subtraction.

### 5.8 Missing Road User Combinations

The expected combinations were generated using the unique Annual year-period-state combinations and the eight Road User categories.

- Expected combinations: 1,408
- Existing Road User records: 1,371
- Missing combinations: 37

These 37 combinations have no corresponding records in the original Road User table.

The absence of a record does not establish that the corresponding value is zero. Therefore, these combinations should not be automatically populated with zero values.

### 5.9 Investigation Conclusion and Preprocessing Decisions – Road User Table

The investigation identified three main data quality considerations in the Road User table.

First, 185 records contain values marked as `n.p.` in both numerical attributes. These values represent unpublished data and cannot be assumed to be zero. Furthermore, the published Road User totals do not fully reconcile with the Annual table in the 73 affected year-period-state groups. The total differences are 650 cases and 3,712 bed days. Since multiple records within these groups contain unpublished values, their individual numerical values cannot be reliably recovered.

Second, 37 expected Road User combinations are absent from the source table. However, the absence of records does not establish that these combinations represent zero hospitalisations.

Based on these findings, the following preprocessing decisions were established:

- Convert `n.p.` values in Count of cases and Bed days into missing values rather than zero.
- Preserve the publication status of affected records using an additional attribute.
- Convert both numerical attributes into appropriate numeric data types.
- Retain all original records without removing records containing unpublished values.
- Do not generate additional records for the 37 absent combinations.
- Preserve the identified reconciliation differences rather than modifying published values to force agreement with the Annual table.

These decisions preserve the original information while preventing unsupported assumptions from being introduced during preprocessing.

### 5.10 Investigation of Age Group Table

The Age Group table contains 1,232 records and 7 attributes. The investigation was performed in KNIME to examine unpublished values, category distribution, duplicate records, and the overall table structure.

The following checks were performed:

**1. Investigation of unpublished values**

Rule-based Row Splitter was used to separate records containing `n.p.` from records with published numerical values.

The results showed:
- 80 records contain `n.p.` in Count of cases.
- 80 records contain `n.p.` in Bed days.
- Both numerical attributes contain `n.p.` in the same 80 records.
- 1,152 records contain published numerical values.

**2. Age Group distribution**

GroupBy was used to examine the number of records in each Age Group category.

The investigation identified 7 Age Group categories, with 176 records in each category, giving 1,232 records in total.

**3. Duplicate record investigation**

Duplicate Row Filter was configured using Calendar year, Six-monthly period, State or territory, and Age group.

The output contained 1,232 records, indicating that no duplicate combinations were identified.

**4. Table structure and missing values**

The Statistics node and Excel Reader output were examined to inspect the table structure, data types, and missing values.

The investigation confirmed:
- 1,232 records and 7 attributes.
- Calendar years range from 2011 to 2021.
- No actual blank or NULL values were identified in the source data.
- The `n.p.` markers are stored as text values rather than NULL values.

### 5.11 Investigation Conclusion and Preprocessing Decisions – Age Group Table

The investigation identified unpublished values in 80 records, affecting both Count of cases and Bed days. These values are marked as `n.p.` and should not be interpreted as zero.

Based on the findings from the Road User table investigation, no attempt will be made to estimate or recover these unpublished values. Such values cannot be reliably determined from the available records.

The following preprocessing decisions were established:

- Convert `n.p.` values in both numerical attributes into missing values rather than zero.
- Preserve the publication status of affected records using an additional attribute.
- Convert both numerical attributes into Integer data types.
- Retain all 1,232 original records.
- Do not generate additional records because all expected Age Group combinations are present.
- Preserve the original categorical attributes without unnecessary modifications.

These decisions maintain consistency with the preprocessing approach adopted for the Road User table and avoid introducing unsupported values into the dataset.

### 5.12 Investigation of Sex Table

The Sex table (Table 3) contains 352 records and 7 attributes, covering the period from 2011 to 2021.

**1. Sex category distribution**

GroupBy was used to examine the number of records in each Sex category.

The investigation identified:

- Male: 176 records.
- Female: 176 records.
- Total: 352 records.

The source table notes that hospitalisations where sex was intersex, indeterminate or missing are excluded.

**2. Investigation of unpublished values**

Rule-based Row Splitter was used to check for `n.p.` values in Count of cases and Bed days.

The investigation found no `n.p.` values in either numerical attribute.

**3. Duplicate record investigation**

Duplicate Row Filter was configured using Calendar year, Six-monthly period, State or territory, and Sex.

The output retained all 352 records, indicating that no duplicate combinations were identified.

**4. Reconciliation with Annual Hospitalisations (Table 1)**

The Male and Female records were aggregated by calendar year, six-monthly period, and state or territory using GroupBy.

The aggregated results were joined with the Annual Hospitalisations table (Table 1) using the three common grouping attributes.

Math Formula was then used to calculate the differences between the Annual totals and the combined Male and Female values.

The investigation covered 176 Year–Period–State groups and identified:

- 165 groups matched exactly for both Count of cases and Bed days.
- 11 groups showed differences.
- The total difference was 13 cases and 38 bed days.
- All 11 groups had lower combined Male and Female values than the corresponding Annual totals.

These differences are consistent with the source table's exclusion of records where sex was intersex, indeterminate or missing. However, the residual values do not identify the exact number of records in each excluded category.

**5. Table structure and missing values**

Statistics and Excel Reader output were examined to inspect the table structure, data types, and missing values.

The investigation confirmed:

- 352 records and 7 attributes.
- Calendar years range from 2011 to 2021.
- No missing values were identified.
- Count of cases and Bed days were already stored as Integer values.

### 5.13 Investigation Conclusion and Preprocessing Decisions – Sex Table

The investigation found that the Sex table has a complete and consistent structure, with no identified missing values, unpublished values, or duplicate combinations.

The comparison with Annual Hospitalisations (Table 1) identified 11 groups with differences between the Annual totals and the combined Male and Female values.

Based on these findings, the following decisions were established:

- Retain all 352 original records.
- Preserve the existing Male and Female categories in the original dataset.
- Do not create additional Sex categories in the original dataset because the excluded records are not individually available.
- Do not estimate or assign residual differences to specific Sex categories.
- Retain the existing Integer data types for Count of cases and Bed days.
- Keep the original Sex dataset unchanged.

An enhanced dataset was also created by adding two derived attributes: `unclassified_cases` and `unclassified_bed_days`. These represent the residual differences between the Annual totals and the combined Male and Female values.

The derived residuals are not directly published Sex categories and cannot identify the exact classification of the excluded records. They should be clearly labelled as derived values and counted only once per Year–Period–State group during subsequent analysis.

### 5.14 Investigation of Counterparty Table

The Counterparty table (Table 5) contains 704 records and 7 attributes. The investigation was performed in KNIME to examine category distribution, duplicate combinations, unpublished values, and missing values.

The following checks were performed:

**1. Counterparty category distribution**

GroupBy was used to examine the number of records in each Counterparty category.

The investigation identified:

- 4 Counterparty categories.
- Each category contains 176 records.
- Total: 704 records.

**2. Duplicate record investigation**

Duplicate Row Filter was configured using Calendar year, Six-monthly period, State or territory, and Counterparty.

The output retained all 704 records, indicating that no duplicate combinations were identified.

**3. Unpublished values and missing values**

The Excel Reader filtering and inspection options were used to check the Count of cases and Bed days attributes for `n.p.` markers and missing values.

The investigation found:

- No `n.p.` values in either numerical attribute.
- No missing values were identified.

### 5.15 Investigation Conclusion and Preprocessing Decisions – Counterparty Table

The Counterparty table has 704 records across 4 categories, with 176 records in each category. No duplicate Year–Period–State–Counterparty combinations, unpublished values, or missing values were identified.

Based on these findings, the following preprocessing decisions were established:

- Retain all 704 original records.
- Preserve all four Counterparty categories.
- Retain the existing numerical values without replacing or estimating values.
- No additional data cleaning or transformation is required.

The extracted Counterparty table can therefore be exported directly to CSV.

---

## 6. Data Processing Decisions

Preprocessing decisions are based on the data quality investigation results. The original Excel workbook is preserved unchanged, and processed tables are exported as separate CSV files.

The following decisions have been applied to the tables processed so far:

1. **Annual hospitalisations (Table 1):** No additional preprocessing was required. The extracted table was exported directly to CSV.

2. **Road User (Table 2):** The `n.p.` markers in Count of cases and Bed days were converted into missing values. A `publication_status` attribute was added to preserve the publication status of each record. Both numerical attributes were converted into Integer data types. All 1,371 original records were retained, and the 37 absent combinations were not generated.

3. **Age Group (Table 4):** The same handling approach was applied to the 80 records containing `n.p.`. A `publication_status` attribute was added, both numerical attributes were converted into Integer data types, and all 1,232 original records were retained. No additional records were required because all expected Age Group combinations were present.

4. **Sex (Table 3):** The original table required no data cleaning because no missing values, unpublished values, or duplicate combinations were identified. All 352 records were retained and exported as `Table3_Sex.csv`. An enhanced version, `Table3_Sex_Enhanced.csv`, was also created by adding two derived attributes: `unclassified_cases` and `unclassified_bed_days`. These attributes represent the residual differences between Table 1 totals and combined Male and Female values.

5. **Counterparty (Table 5):** No additional preprocessing was required because no duplicate combinations, `n.p.` values, or missing values were identified. All 704 records and 7 original attributes were retained and exported directly as `Table5_Counterparty.csv`.


---

## 7. KNIME Workflow

The KNIME workflow is organised into separate stages to support data extraction, investigation, and final preprocessing.

### 7.1 Raw Data Extraction Workflow

Five Excel Reader nodes were configured to extract the individual tables from the `raw` worksheet.

Each node reads a specific Excel cell range and produces an independent output table.

| KNIME Node | Source Range | Output |
|---|---|---|
| Excel Reader – Annual Hospitalisations | A2:F178 | Annual hospitalisations table |
| Excel Reader – Road User | H2:N1373 | Road user table |
| Excel Reader – Sex | P2:V354 | Sex table |
| Excel Reader – Age Group | X2:AD1234 | Age group table |
| Excel Reader – Counterparty | AF2:AL706 | Counterparty table |

The extraction workflow was completed successfully. Each output was checked to confirm its expected dimensions and column headers.

### 7.2 Data Investigation Workflow

After extracting the five tables, the individual outputs are used as inputs for data quality investigation.

The investigation focuses on:

- Inspecting data types and column structures.
- Examining missing values and numerical distributions.
- Identifying unique categorical values.
- Investigating potential data quality issues.
- Checking consistency between the five tables.
- Reviewing temporal comparability limitations identified in the Data Dictionary.

**Road User Table Investigation**

The following KNIME operations were performed:

1. Rule-based Row Splitter – Separate records containing `n.p.` from published numerical records.
2. GroupBy – Examine the distribution of `n.p.` by calendar year, six-monthly period, and state or territory.
3. String to Number – Convert published Count of cases and Bed days values into numerical data types.
4. GroupBy – Aggregate published Road User values by year, period, and state or territory.
5. Joiner – Compare aggregated Road User values with the Annual table.
6. Math Formula – Calculate differences between Annual totals and published Road User totals.
7. Duplicate Row Filter, GroupBy, Cross Joiner, and Joiner – Generate and identify missing Road User combinations.

**Age Group Table Investigation**

The following KNIME operations were performed:

1. Rule-based Row Splitter – Separate records containing `n.p.` from records with published numerical values.
2. GroupBy – Examine the number of records in each Age Group category.
3. Duplicate Row Filter – Check duplicate combinations using calendar year, six-monthly period, state or territory, and age group.
4. Statistics and Excel Reader inspection – Examine the table structure, data types, and missing values.

**Sex Table Investigation**

The following KNIME operations were performed:

1. GroupBy – Examine the number of records in each Sex category.
2. Rule-based Row Splitter – Check for `n.p.` values in Count of cases and Bed days.
3. Duplicate Row Filter – Check duplicate combinations using calendar year, six-monthly period, state or territory, and sex.
4. GroupBy – Aggregate Male and Female values by calendar year, six-monthly period, and state or territory.
5. Joiner – Compare the aggregated Sex table with the Annual Hospitalisations table (Table 1).
6. Math Formula – Calculate differences between Annual totals and combined Male and Female values.
7. Rule Engine and GroupBy – Classify and count matching and differing groups.
8. Statistics and Excel Reader inspection – Examine data types and missing values.

**Counterparty Table Investigation**

The following KNIME operations and inspection options were used:

1. GroupBy – Examine the number of records in each Counterparty category.
2. Duplicate Row Filter – Check duplicate combinations using calendar year, six-monthly period, state or territory, and Counterparty.
3. Excel Reader filtering and inspection – Check the Count of cases and Bed days attributes for `n.p.` values and missing values.

### 7.3 Final Data Preprocessing Workflow

Separate KNIME workflows were used to prepare the extracted tables and export them as CSV files. The original Excel workbook remains unchanged.

**Annual Hospitalisations (Table 1)**

The Annual table did not require additional preprocessing. It was exported directly from the Excel Reader node using CSV Writer.

- Output file: `Table1_Annual_Hospitalisations.csv`
- Output dimensions: 176 records and 6 attributes.

**Road User (Table 2)**

The following KNIME nodes were used:

1. Rule Engine – Create the `publication_status` attribute to distinguish published records from records marked as `n.p.`.
2. String Manipulation – Replace `n.p.` with missing values in Count of cases and Bed days.
3. String to Number – Convert both numerical attributes into Integer data types.
4. CSV Writer – Export the processed table.

- Output file: `Table2_Road_User.csv`
- Output dimensions: 1,371 records and 8 attributes.
- 185 records are marked as `Not for publication`.

**Age Group (Table 4)**

The same preprocessing approach was applied to the Age Group table:

1. Rule Engine – Create the `publication_status` attribute.
2. String Manipulation – Replace `n.p.` with missing values in Count of cases and Bed days.
3. String to Number – Convert both numerical attributes into Integer data types.
4. CSV Writer – Export the processed table.

- Output file: `Table4_Age_Group.csv`
- Output dimensions: 1,232 records and 8 attributes.
- 80 records are marked as `Not for publication`.

**Sex (Table 3)**

The original Sex table required no additional data cleaning. Its numerical attributes were already stored as Integer values, and no missing values, unpublished values, or duplicate combinations were identified.

Two CSV versions were exported:

**Original dataset**

- Output file: `Table3_Sex.csv`
- Output dimensions: 352 records and 7 attributes.

**Enhanced dataset**

The enhanced version was created by joining the calculated residual values back to the original Sex records using calendar year, six-monthly period, and state or territory.

Two derived attributes were added:

- `unclassified_cases`
- `unclassified_bed_days`

- Output file: `Table3_Sex_Enhanced.csv`
- Output dimensions: 352 records and 9 attributes.

The derived residual values are repeated across Male and Female records within the same Year–Period–State group. They must therefore only be counted once per group during subsequent analysis.

**Counterparty (Table 5)**

No additional preprocessing was required for the Counterparty table. The extracted table was exported directly from the Excel Reader node using CSV Writer.

- Output file: `Table5_Counterparty.csv`
- Output dimensions: 704 records and 7 attributes.

---

## 8. Inspection Status

**Current Status:** All five tables have completed their data quality investigations and CSV exports. The original and enhanced versions of the Sex table have also been exported.

### 8.1 Completed Activities

- [x] Obtain the original Excel dataset.
- [x] Obtain the accompanying Data Dictionary.
- [x] Identify all worksheets.
- [x] Identify the five tables in the `raw` worksheet.
- [x] Inspect the structure and dimensions of each table.
- [x] Identify the main attributes and categorical dimensions.
- [x] Review the Data Dictionary definitions and data comparability notes.
- [x] Perform an initial inspection of the populated records.
- [x] Configure five separate Excel Reader nodes in KNIME.
- [x] Extract all five tables from the `raw` worksheet.
- [x] Verify the expected row counts and column headers of the extracted tables.
- [x] Investigate `n.p.` values in the Road User table.
- [x] Examine the distribution of unpublished values by year, period, and state or territory.
- [x] Reconcile published Road User values with Annual totals.
- [x] Identify 37 missing Road User combinations.
- [x] Document the handling considerations for unpublished and absent records.
- [x] Investigate `n.p.` values in the Age Group table.
- [x] Examine Age Group category distribution.
- [x] Check for duplicate Year–Period–State–Age Group combinations.
- [x] Inspect table structure, data types, and missing values.
- [x] Establish preprocessing decisions for the Age Group table.
- [x] Export the Annual Hospitalisations table (Table 1) to CSV.
- [x] Preprocess the Road User table (Table 2) and export it to CSV.
- [x] Preprocess the Age Group table (Table 4) and export it to CSV.
- [x] Investigate the Sex category distribution in Table 3.
- [x] Cross-check combined Male and Female values against Annual Hospitalisations (Table 1).
- [x] Establish preprocessing decisions for the Sex table (Table 3).
- [x] Export the original Sex table (Table 3) to CSV.
- [x] Create and export the enhanced Sex dataset with derived residual attributes.
- [x] Investigate the Counterparty category distribution in Table 5.
- [x] Check for duplicate Year–Period–State–Counterparty combinations.
- [x] Check for `n.p.` values and missing values in the Counterparty table.
- [x] Establish preprocessing decisions for the Counterparty table.
- [x] Export the Counterparty table (Table 5) to CSV.

### 8.2 Remaining Activities
