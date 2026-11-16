# National Hospitalised Injury Counts – Dataset Inspection

## 1. Dataset Overview

**Dataset Name:** National Hospitalised Injury Counts

**Source:** Bureau of Infrastructure and Transport Research Economics (BITRE)

**Original File:** `hospitalisation_injury_publication_sep2023.xlsx`

**Data Period:** 2011–2021

**Sheet Used:** `raw`

**Inspection Tool:** KNIME Analytics Platform

This dataset contains national-level hospitalisation statistics for injuries in Australia. It includes information about injury causes, demographic characteristics, geographical remoteness, hospital cases, bed days, and deaths in hospital.

The dataset is sourced from the Australian Institute of Health and Welfare (AIHW) and compiled by BITRE.

**Important:** The raw dataset includes multiple causes of injury, not exclusively road traffic crashes. Records must be filtered using `Cause of injury = Traffic` when analysing road crash injuries.

---

## 2. Dataset Structure

### 2.1 Dataset Dimensions

| Attribute | Value |
|---|---:|
| Total Rows | 117,919 |
| Total Columns | 13 |
| Data Period | 2011–2021 |
| Missing Values | Present |
| Data Source | BITRE / AIHW |

### 2.2 Column Descriptions

| Column | Data Type | Description |
|---|---|---|
| Calendar year | Integer | Calendar year of the record |
| Month | String | Month associated with the record |
| ABS remoteness area | String | Geographical remoteness classification |
| Cause of injury | String | Classification of injury causes |
| Age group | String | Age group of the injured person |
| Sex | String | Sex of the injured person |
| Road user | String | Road user classification |
| Counterparty | String | Other party involved in the incident |
| Count of cases | Integer | Number of injury cases |
| Bed days | Integer | Number of hospital bed days |
| Died_cases | Integer | Number of cases involving death in hospital |
| Died_bed_days | Integer | Bed days associated with cases involving death |
| Hospitalisations | Integer | Number of hospitalisations |

**Note:** Detailed interpretations of hospitalisation and mortality measures should follow the accompanying BITRE Data Dictionary.

---

## 3. Data Inspection Results

The dataset was imported into KNIME using the Excel Reader node, selecting the `raw` worksheet.

A Statistics View was used to inspect column types, missing values, unique values, numerical distributions, and common categories.

### 3.1 Categorical Attributes

| Attribute | Unique Values |
|---|---:|
| Calendar year | 11 |
| Month | 12 |
| ABS remoteness area | 4 |
| Cause of injury | 6 |
| Age group | 8 |
| Sex | 3 |
| Road user | 13 |
| Counterparty | 11 |

### 3.2 Numerical Attributes

| Attribute | Missing Values | Minimum | Maximum |
|---|---:|---:|---:|
| Count of cases | 4,937 | 1 | 107,434 |
| Bed days | 0 | 1 | 252,872 |
| Died_cases | 108,178 | 1 | 996 |
| Died_bed_days | 107,331 | 1 | 9,107 |
| Hospitalisations | 0 | 0 | 107,434 |

### 3.3 Initial Observations

- The dataset covers 11 calendar years, from 2011 to 2021.
- The `Cause of injury` attribute contains six different injury classifications.
- `Traffic` is the primary category relevant to this project.
- `ABS remoteness area` provides geographical information that can support comparisons between different areas.
- The dataset contains demographic attributes such as age group and sex.
- `Died_cases` and `Died_bed_days` contain substantial numbers of missing values.
- `Count of cases` also contains missing values that require further investigation.

---

## 4. Data Dictionary Notes

The accompanying `hospitalised-injury-data-dictionary-september-2023.pdf` should be used as the reference when interpreting dataset attributes.

### 4.1 Cause of Injury

The dataset includes the following injury categories:

- Traffic
- Non-traffic
- Unknown traffic
- Other transport
- Other trauma events
- Medical events

For this project, the main analysis should focus on records classified as `Traffic`.

Other categories should not automatically be treated as road traffic crash injuries.

### 4.2 Hospitalisation Definition

A hospital separation represents an episode of hospital care. It does not necessarily represent the entire hospital stay of an individual patient.

This distinction should be considered when interpreting hospitalisation statistics.

### 4.3 Death Classification

The Data Dictionary defines deaths in care based on separation mode 8 (died) and separation within 30 days of admission.

The mortality-related attributes must therefore be interpreted according to these definitions rather than assuming they represent all deaths resulting from road crashes.

### 4.4 Differences Between Case Counts and Bed Days

The Data Dictionary explains that case counts and bed days may follow different inclusion rules.

Important points include:

- Before the 2015–16 financial year, some records excluded from case counting due to hospital transfers were included in bed-day calculations.
- When a patient is transferred to another hospital, only the first separation is counted as a case, while bed days from both periods of care are included.
- If these periods of care occur in different months, a month may contain bed days without a corresponding case being counted in that month.
- From the 2015–16 financial year onwards, changes involving rehabilitation-related records (ICD-10-AM code Z50) also affect bed-day calculations.

These rules indicate that case counts and bed days do not necessarily have identical inclusion patterns.

However, the Data Dictionary does not establish the exact reason for every missing value in the dataset.

---

## 5. Data Quality Issues and Missing Value Investigation

The initial inspection identified missing values in several numerical attributes. Further investigation was conducted using KNIME to determine whether missing values could reasonably be interpreted as zero or should remain missing.

The investigation focused on three attributes:

- `Count of cases`
- `Died_cases`
- `Died_bed_days`

The records were first filtered using `Cause of injury = Traffic`, producing 86,140 records for the main missing-value investigation.

Temporal availability was also examined across all six injury categories to identify whether the missing-value patterns changed over time.

### 5.1 Investigation of Count of Cases

A Rule-based Row Splitter was used to separate records where `Count of cases` was missing from records where it was available:

```text
MISSING $Count of cases$ => TRUE
TRUE => FALSE
```

The investigation found that records with missing `Count of cases` also had missing `Died_cases`, and `Hospitalisations` was zero in these records.

The missing-value pattern was then examined over time. The KNIME results showed a clear distinction:

- For records from January 2011 to June 2020, missing `Count of cases` values were interpreted as zero.
- From July 2020 onwards, missing `Count of cases` values were retained as missing.

This temporal distinction is important because the later period coincides with the period in which no available mortality values were found. Therefore, the absence of case-count and mortality values in this period should not automatically be interpreted as zero.

**Finding:** Missing `Count of cases` values are treated as zero from January 2011 to June 2020. Missing values from July 2020 onwards remain NULL.

### 5.2 Investigation of Died_cases

The relationship between `Count of cases`, `Died_cases`, and `Hospitalisations` was examined further.

Three conditions were investigated.

**Case 1: Count of cases and Died_cases are both Missing**

The investigation found records where both `Count of cases` and `Died_cases` were missing, while `Hospitalisations` was zero.

The temporal investigation was used to distinguish records in the period with available mortality data from records in the later period where mortality data was no longer available.

**Case 2: Count of cases and Died_cases are both Available**

For records where both attributes contained values, a Math Formula node was used to calculate:

```text
Difference = Count of cases - Died_cases - Hospitalisations
```

The resulting `Difference` attribute contained only one unique value:

| Attribute | Result |
|---|---:|
| Number of unique values | 1 |
| Minimum | 0 |
| Maximum | 0 |
| Mean | 0 |

This verifies the following relationship across the tested records:

```text
Count of cases = Died_cases + Hospitalisations
```

**Case 3: Count of cases is Available but Died_cases is Missing**

Records where `Count of cases` was available but `Died_cases` was missing were examined separately.

The investigation found that `Hospitalisations` equalled `Count of cases` across these records.

This is consistent with the relationship established in Case 2. For the period in which mortality data was available, this supports interpreting missing `Died_cases` as zero. It does not support that interpretation for the period from July 2020 onwards, when the mortality data is unavailable.

**Finding:** Missing `Died_cases` values are treated as zero from January 2011 to June 2020. Missing values from July 2020 onwards remain NULL.

### 5.3 Investigation of Data Availability Over Time

A Rule-based Row Splitter was used to separate records with missing and available `Died_cases` values.

The records with available `Died_cases` values were then examined using a GroupBy node, grouping by:

- `Calendar year`
- `Month`
- `Cause of injury`

The results showed that the latest available `Died_cases` records were from **June 2020**. From **July 2020 onwards**, no available `Died_cases` values were found.

This pattern was observed across all six `Cause of injury` categories, not only `Traffic`.

The temporal investigation of `Count of cases` also showed that its missing values must be treated differently before and after July 2020.

The dataset observations establish the availability pattern; they do not establish the reason why BITRE has no available mortality values after June 2020.

### 5.4 Investigation Conclusion for Count of Cases and Died_cases

The KNIME investigation identified the following findings:

| Condition | Observed Evidence | Interpretation |
|---|---|---|
| `Count of cases` is missing before July 2020 | `Died_cases` is also missing and `Hospitalisations` is zero | Treat missing `Count of cases` as 0 |
| `Count of cases` is missing from July 2020 onwards | Missing values occur in the period where mortality data is unavailable | Preserve NULL |
| `Count of cases` and `Died_cases` are both available | `Count - Died_cases - Hospitalisations = 0` | Relationship verified |
| `Count of cases` is available but `Died_cases` is missing before July 2020 | `Hospitalisations = Count of cases` | Treat missing `Died_cases` as 0 |
| `Died_cases` availability | Available records exist only up to June 2020 across all six injury categories | Preserve missing values from July 2020 onwards |

**Data preprocessing decisions:**

1. Replace missing values in `Count of cases` with zero for the period from January 2011 to June 2020.
2. Preserve missing values in `Count of cases` from July 2020 onwards as NULL.
3. Replace missing values in `Died_cases` with zero for the period from January 2011 to June 2020.
4. Preserve missing values in `Died_cases` from July 2020 onwards as NULL.

**Important:** These decisions are based on the observed patterns in the raw dataset and the KNIME filtering, splitting, and grouping results. The relationship `Count of cases = Died_cases + Hospitalisations` is used as a consistency check for records where all three values are available. These decisions apply to `Count of cases` and `Died_cases`; the handling of `Died_bed_days` is investigated separately in Section 5.5.

### 5.5 Investigation of Died_bed_days

The `Died_bed_days` attribute was investigated separately because the Data Dictionary describes different calculation rules for cases and bed days.

#### 5.5.1 Data Dictionary Investigation

According to the Data Dictionary, the calculation of bed days does not always follow the same inclusion rules as case counting.

Important points include:

- Before the 2015–16 financial year, some records excluded from case counting due to hospital transfers were included in bed-day calculations.
- When a patient is transferred to another hospital, only the first separation is counted as a case, while bed days from both periods of care are included.
- If these periods of care occur in different months, a month may contain bed days without a corresponding case being counted in that month.
- From the 2015–16 financial year onwards, changes involving rehabilitation-related records (ICD-10-AM code Z50) also affect bed-day calculations.

These rules indicate that case counts and bed days do not necessarily have identical inclusion patterns.

Therefore, a record with no recorded cases does not necessarily mean that its bed-day measures must also be zero.

However, these general rules do not establish the exact reason for every individual record in the dataset.

#### 5.5.2 Investigation of Missing-value Patterns

The Traffic records (86,140 records) were examined to compare the availability of `Died_cases` and `Died_bed_days`.

A Rule-based Row Splitter was used to separate records with missing and available `Died_cases`. The records with missing `Died_cases` were then split again based on the availability of `Died_bed_days`.

The results were:

| Availability Pattern | Number of Records |
|---|---:|
| Both attributes available | 1,998 |
| `Died_cases` missing, `Died_bed_days` available | 288 |
| `Died_cases` available, `Died_bed_days` missing | 0 |
| Both attributes missing | 83,854 |
| **Total** | **86,140** |

The results demonstrate that the two attributes do not have identical missing-value patterns.

All records with available `Died_cases` also have available `Died_bed_days`. However, an additional 288 records contain available `Died_bed_days` values while `Died_cases` is missing.

#### 5.5.3 Investigation of the 288 Records

The 288 records with missing `Died_cases` but available `Died_bed_days` were examined further.

| Attribute / Condition | Result |
|---|---:|
| Number of records | 288 |
| Total `Died_bed_days` | 1,729 |
| Minimum `Died_bed_days` | 1 |
| Maximum `Died_bed_days` | 30 |
| `Count of cases` missing | 43 |
| `Count of cases` available | 245 |

Further investigation found:

- All 43 records with missing `Count of cases` have `Hospitalisations = 0`.
- All 245 records with available `Count of cases` have `Hospitalisations` equal to `Count of cases`.
- All 288 records have positive `Died_bed_days` values.

This demonstrates that positive `Died_bed_days` values can exist even when `Died_cases` is missing.

In particular, the 43 records with missing `Count of cases` and zero `Hospitalisations` still contain positive `Died_bed_days` values.

This observation is consistent with the Data Dictionary's explanation that bed days may be recorded in a month without a corresponding case being counted in that month, such as when hospital care spans multiple periods or months.

However, the available dataset does not provide sufficient information to confirm that all 288 records are specifically caused by hospital transfers.

Therefore, the transfer explanation should be considered a possible explanation rather than a confirmed cause for every record.

#### 5.5.4 Consistency Checks

Two numerical consistency checks were performed.

**Check 1: Died_bed_days compared with Died_cases**

For records where both attributes were available, the following calculation was performed using a Math Formula node:

```text
Died_bed_days - Died_cases
```

The results showed:

- 1,998 records examined.
- No negative values.
- No records where `Died_bed_days` was smaller than `Died_cases`.

**Check 2: Died_bed_days compared with Bed days**

For records where `Died_bed_days` was available, the following calculation was performed:

```text
Bed days - Died_bed_days
```

The results showed:

- 2,286 records examined.
- No negative values.
- No records where `Died_bed_days` exceeded total `Bed days`.

These checks support the internal consistency of the observed values. They are consistency checks rather than formal calculation rules explicitly defined by BITRE.

#### 5.5.5 Temporal Data Availability

A Rule-based Row Splitter was used to separate records with missing and available `Died_bed_days` values.

The available records were then examined using a GroupBy node, grouping by:

- `Calendar year`
- `Month`
- `Cause of injury`

The results showed that June 2020 was the latest month with available `Died_bed_days` values.

From July 2020 onwards, no available values were found.

This pattern was observed across all six `Cause of injury` categories, not only `Traffic`.

For the entire dataset, the availability pattern was:

| Period | Total Records | Available `Died_bed_days` | Missing `Died_bed_days` |
|---|---:|---:|---:|
| January 2011 – June 2020 | 101,770 | 10,588 | 91,182 |
| July 2020 – December 2021 | 16,149 | 0 | 16,149 |
| **Total** | **117,919** | **10,588** | **107,331** |

The observed `Died_bed_days` values were all positive:

| Attribute | Result |
|---|---:|
| Minimum | 1 |
| Maximum | 9,107 |
| Number of observed zero values | 0 |

The absence of observed zero values indicates that the recorded values are positive. However, this alone does not prove that every missing value represents zero.

#### 5.5.6 Investigation Conclusion and Preprocessing Decision

The investigation identified the following findings:

| Finding | Evidence | Interpretation |
|---|---|---|
| `Died_cases` and `Died_bed_days` have different availability patterns | 288 Traffic records have missing `Died_cases` but available `Died_bed_days` | The two attributes should be investigated separately |
| Positive `Died_bed_days` can exist without recorded cases | 43 records have missing `Count of cases`, zero `Hospitalisations`, and positive `Died_bed_days` | Case counts and bed days have different inclusion rules |
| `Died_bed_days` is not smaller than `Died_cases` | 1,998 records checked, zero violations | No observed inconsistency |
| `Died_bed_days` does not exceed total `Bed days` | 2,286 records checked, zero violations | No observed inconsistency |
| Latest available `Died_bed_days` records are from June 2020 | GroupBy results across all six injury categories | Values are unavailable from July 2020 onwards |
| All observed `Died_bed_days` values are positive | Minimum value is 1; no observed zero values | Recorded values represent positive bed-day counts |

**Preprocessing decisions:**

1. Preserve all observed `Died_bed_days` values.
2. Replace missing `Died_bed_days` values with zero for the period from January 2011 to June 2020.
3. Preserve missing `Died_bed_days` values from July 2020 onwards as NULL.
4. Do not use missing `Died_cases`, missing `Count of cases`, or zero `Hospitalisations` alone as the basis for replacing `Died_bed_days` with zero.

**Rationale and limitation:**

The period from January 2011 to June 2020 contains observed `Died_bed_days` values across the dataset. Within this reporting period, missing values are treated as zero for preprocessing purposes, meaning that no `Died_bed_days` were recorded for those observations.

This is a practical imputation assumption rather than a fact explicitly confirmed by the Data Dictionary. The observed minimum value of 1 and the absence of recorded zero values do not independently prove that every missing value is zero.

The 288 Traffic records also demonstrate that `Died_bed_days` can be available when `Died_cases` is missing. Therefore, the two attributes must not be treated as interchangeable.

From July 2020 onwards, all `Died_bed_days` values are missing across the six injury categories. These values are preserved as NULL because the dataset provides no available observations for this period. Treating them as zero would incorrectly imply that the measure was available and that no died-in-care bed days occurred.

---

## 6. Data Quality Issues and Preprocessing Decisions

After completing the data quality investigation, the missing-value patterns and their relationships with other attributes were examined using KNIME.

The investigation established period-specific preprocessing decisions for the three numerical attributes.

### 6.1 Summary of Missing-value Decisions

| Attribute | Period | Preprocessing Decision | Reason |
|---|---|---|---|
| `Count of cases` | January 2011 – June 2020 | Replace missing values with 0 | Supported by the observed relationship with `Hospitalisations` and `Died_cases` |
| `Count of cases` | July 2020 – December 2021 | Preserve NULL | Missing values occur in the period where mortality data is unavailable |
| `Died_cases` | January 2011 – June 2020 | Replace missing values with 0 | Supported by the relationship `Count of cases = Died_cases + Hospitalisations` |
| `Died_cases` | July 2020 – December 2021 | Preserve NULL | No available values were observed after June 2020 |
| `Died_bed_days` | January 2011 – June 2020 | Replace missing values with 0 | Practical imputation assumption within the period where the measure has available observations |
| `Died_bed_days` | July 2020 – December 2021 | Preserve NULL | No available values were observed after June 2020 |

### 6.2 Important Considerations

The preprocessing decisions were established based on the investigation results documented in Section 5.

For `Count of cases` and `Died_cases`, the relationship between the attributes and the temporal availability pattern provided evidence for the zero-replacement decisions.

For `Died_bed_days`, the decision requires an additional consideration. The Data Dictionary explains that case counts and bed days may follow different inclusion rules. The investigation also identified records containing positive `Died_bed_days` values despite missing `Died_cases`.

Therefore, missing `Died_bed_days` values are not replaced based solely on the availability of `Died_cases`, `Count of cases`, or `Hospitalisations`.

Instead, zero replacement is applied to missing values before July 2020 as a practical preprocessing assumption. This assumption is not explicitly confirmed for every individual record by the Data Dictionary.

Missing values from July 2020 onwards are preserved because no available observations were found during this period across all six injury categories.

### 6.3 Data Preservation

The original Excel dataset is retained without modification.

All missing-value replacements and other transformations are applied in the KNIME preprocessing workflow. The resulting dataset is exported separately as the processed dataset for subsequent analysis and visualisation.

This ensures that the original data remains available for reference and comparison.

---

## 7. Completed Data Processing

The dataset inspection, missing-value investigation, and preprocessing workflow have been completed.

The completed processing activities include:

1. Importing the original Excel dataset into KNIME.
2. Inspecting the dataset dimensions, attributes, data types, categorical values, numerical distributions, and missing values.
3. Filtering `Cause of injury = Traffic` for the main investigation.
4. Investigating missing values in `Count of cases` and examining their relationship with `Died_cases` and `Hospitalisations`.
5. Verifying the relationship `Count of cases = Died_cases + Hospitalisations` for records where all three attributes are available.
6. Investigating the temporal availability of `Died_cases` across all six injury categories.
7. Investigating the relationship and availability patterns between `Died_cases` and `Died_bed_days`.
8. Examining the 288 Traffic records where `Died_cases` is missing but `Died_bed_days` is available.
9. Performing numerical consistency checks on available `Died_bed_days` values.
10. Investigating the temporal availability of `Died_bed_days` across all six injury categories.
11. Applying the established missing-value decisions in the final KNIME preprocessing workflow.
12. Generating the processed dataset for subsequent exploratory data analysis and visualisation.

---

## 8. KNIME Workflows

Two KNIME workflows were developed and completed for this dataset.

### 8.1 Data Investigation Workflow

The investigation workflow was developed to examine the original dataset, identify data quality issues, and collect evidence supporting the preprocessing decisions.

The workflow includes:

- Inspecting dataset dimensions, data types, missing values, and numerical distributions.
- Investigating missing values in `Count of cases` and `Died_cases`.
- Verifying the relationship between `Count of cases`, `Died_cases`, and `Hospitalisations`.
- Examining the temporal availability of mortality-related attributes.
- Investigating the relationship between `Died_cases` and `Died_bed_days`.
- Examining records with missing `Died_cases` but available `Died_bed_days`.
- Performing numerical consistency checks.
- Establishing the missing-value handling decisions documented in Section 5.

### 8.2 Final Data Preprocessing Workflow

A separate KNIME workflow was developed to apply the established preprocessing decisions to the original dataset.

The workflow includes:

1. Importing the original dataset.
2. Applying the period-specific missing-value handling rules to `Count of cases`.
3. Applying the period-specific missing-value handling rules to `Died_cases`.
4. Applying the period-specific missing-value handling rules to `Died_bed_days`.
5. Preserving missing values from July 2020 onwards.
6. Combining the processed records.
7. Validating and exporting the final processed dataset.

The workflow applies the decisions established during the investigation while preserving the original Excel dataset unchanged.

### 8.3 Final Output

The completed preprocessing workflow generates the **Final Processed Dataset**, which contains the processed records with missing values handled according to the documented decisions.

The original dataset is retained separately to ensure data traceability and allow comparison with the processed output.

---

## 9. Inspection and Processing Status

**Current Status:** Dataset inspection, data quality investigation, and final preprocessing completed.

- [x] Download original Excel dataset.
- [x] Identify the `raw` worksheet.
- [x] Import data into KNIME.
- [x] Inspect dataset dimensions.
- [x] Identify all 13 attributes.
- [x] Inspect categorical attributes.
- [x] Inspect numerical attributes.
- [x] Identify missing values.
- [x] Filter Traffic records for investigation.
- [x] Investigate the relationship between `Count of cases`, `Died_cases`, and `Hospitalisations`.
- [x] Verify the relationship using Math Formula.
- [x] Establish period-specific missing-value handling decisions for `Count of cases` and `Died_cases`.
- [x] Investigate the relationship between `Died_cases` and `Died_bed_days`.
- [x] Examine the 288 records with missing `Died_cases` but available `Died_bed_days`.
- [x] Perform numerical consistency checks on available `Died_bed_days` values.
- [x] Investigate the temporal availability of `Died_cases` and `Died_bed_days`.
- [x] Establish the missing-value handling decision for `Died_bed_days`.
- [x] Complete the data investigation workflow.
- [x] Complete the final data preprocessing workflow.
- [x] Validate the processed dataset.
- [x] Generate and export the final processed dataset.

**Final Status:** The original dataset has been inspected, its missing-value issues have been investigated, and the final preprocessing workflow has been completed. The Final Processed Dataset is ready for use.
