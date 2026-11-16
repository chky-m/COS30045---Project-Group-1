# Hospitalised Injuries from Road Crashes in Australia

## 1. Project Overview

This project focuses on analysing and visualising hospitalised injuries resulting from road traffic crashes in Australia between 2011 and 2021.

The main objective is to identify meaningful patterns, trends, and differences in hospitalised road crash injuries and communicate these findings through an interactive web-based data visualisation.

**Data Source:** Bureau of Infrastructure and Transport Research Economics (BITRE)

**Dataset:** [BITRE – Hospitalised Injury Data](https://www.bitre.gov.au/publications/ongoing/hospitalised-injury)

## 2. Project Objectives

- Explore and understand the provided datasets.
- Identify meaningful patterns and trends in hospitalised injuries.
- Perform data cleaning, processing, and exploratory data analysis.
- Design appropriate data visualisations using D3.js.
- Develop an interactive website to communicate analytical insights.
- Conduct usability testing and evaluate the final visualisation.

## 3. Dataset Information

The project uses three primary datasets provided by BITRE.

| Dataset | Description | Period |
|---|---|---|
| National Hospitalised Injury Counts | National injury statistics across Australia | 2011–2021 |
| State and Territory Hospitalised Injury Counts | Injury statistics across Australian states and territories | 2011–2021 |
| First Nations People Hospitalised Injury Counts | Injury statistics relating to First Nations people | 2011–2021 |

An accompanying Data Dictionary provides descriptions of dataset attributes, classifications, and statistical definitions.

### 3.1 Dataset Files

The downloaded source files are:

1. `hospitalisation_injury_publication_sep2023.xlsx`
2. `state-and-territory-hospitalisation-injury-publication-2023.xlsx`
3. `First-Nations-hospitalised-injuries-2023.xlsx`
4. `hospitalised-injury-data-dictionary-september-2023.pdf`

Original files will be preserved in the Raw directory.

## 4. Project Workflow

The project will follow these main stages:

1. Dataset Collection and Understanding
2. Data Quality Inspection
3. Data Processing and Cleaning
4. Exploratory Data Analysis (EDA)
5. Research Questions and Insight Identification
6. Data Story and Visualisation Design
7. Interactive Website Development using D3.js
8. Testing and Usability Evaluation
9. Final Documentation and Deployment

## 5. Dataset Exploration and Inspection

Each dataset will be inspected independently before conducting cross-dataset analysis.

KNIME will be used for initial data exploration, while Python may be used for additional processing and analysis when necessary.

### 5.1 National Dataset

**Source:** `hospitalisation_injury_publication_sep2023.xlsx`

**Inspection objectives:**
- Understand workbook structure and available worksheets.
- Identify the relevant raw data sheet.
- Examine the number of rows and columns.
- Understand attributes and their data types.
- Identify missing values and potential inconsistencies.
- Examine unique values and categorical distributions.
- Identify potential analytical variables.

**Inspection status:**
- [x] Load the Excel workbook into KNIME.
- [x] Identify the raw worksheet.
- [x] Inspect the initial table structure.
- [x] Generate initial column statistics.
- [ ] Review attributes using the Data Dictionary.
- [ ] Investigate missing values.
- [ ] Check potential duplicate records.
- [ ] Identify potential analytical variables.
- [ ] Document inspection findings.

### 5.2 State and Territory Dataset

**Source:** `state-and-territory-hospitalisation-injury-publication-2023.xlsx`

**Inspection objectives:**
- Understand workbook structure and available worksheets.
- Identify state and territory classifications.
- Examine the number of rows and columns.
- Review attributes and data types.
- Identify missing values and inconsistencies.
- Examine geographical and temporal distributions.
- Identify opportunities for regional comparisons.

**Inspection status:**
- [ ] Load the dataset into KNIME.
- [ ] Identify relevant worksheets.
- [ ] Inspect table structure.
- [ ] Generate column statistics.
- [ ] Review attributes using the Data Dictionary.
- [ ] Investigate missing values.
- [ ] Check potential duplicate records.
- [ ] Document inspection findings.

### 5.3 First Nations Dataset

**Source:** `First-Nations-hospitalised-injuries-2023.xlsx`

**Inspection objectives:**
- Understand workbook structure and available worksheets.
- Examine the number of rows and columns.
- Understand specific attributes and classifications.
- Review missing values and data consistency.
- Examine injury patterns and demographic distributions.
- Identify potential analytical variables.

**Inspection status:**
- [ ] Load the dataset into KNIME.
- [ ] Identify relevant worksheets.
- [ ] Inspect table structure.
- [ ] Generate column statistics.
- [ ] Review attributes using the Data Dictionary.
- [ ] Investigate missing values.
- [ ] Check potential duplicate records.
- [ ] Document inspection findings.

### 5.4 Cross-Dataset Comparison

After inspecting all three datasets:

- Compare common attributes and classifications.
- Identify differences in data structure and coverage.
- Examine overlapping time periods.
- Identify opportunities for combining or comparing datasets.
- Determine which datasets are suitable for each research question.

**Note:** Datasets will not be combined until their structures, definitions, and statistical measures have been properly understood.

## 6. Project Structure

```text
DataVisualisation_Project/
│
├── Dataset/
│   ├── Raw/
│   ├── Processed/
│   └── Data_Dictionary/
│
├── Analysis/
│   ├── National/
│   ├── State_Territory/
│   ├── First_Nations/
│   └── Cross_Dataset/
│
├── Visualisation/
│
├── Website/
│
├── Documentation/
│
└── README.md
```

## 7. Technical Tools

| Tool | Purpose |
|---|---|
| Python | Data inspection and analysis |
| KNIME | Data exploration and processing |
| D3.js | Interactive data visualisation |
| HTML / CSS / JavaScript | Website development |
| VS Code | Development environment |
| GitHub | Version control and teamwork |

## 8. Project Progress

### Week 1 – Dataset Exploration

- [x] Identify the official BITRE data source.
- [x] Identify the three primary datasets.
- [x] Identify the accompanying Data Dictionary.
- [x] Download all datasets.
- [x] Create the initial project directory structure.
- [x] Begin inspecting the National Dataset using KNIME.
- [ ] Complete National Dataset inspection.
- [ ] Inspect State and Territory Dataset.
- [ ] Inspect First Nations Dataset.
- [ ] Complete cross-dataset comparison.
- [ ] Identify potential research questions.

### Week 2 – Data Story and Visualisation Design

- [ ] Identify key analytical insights.
- [ ] Define research questions.
- [ ] Develop the data story.
- [ ] Create website wireframes and storyboard.
- [ ] Select appropriate chart types.

### Week 3 – Website Development

- [ ] Develop website structure.
- [ ] Implement visualisations using D3.js.
- [ ] Implement interactive features.

### Week 4 – Testing and Refinement

- [ ] Test website functionality.
- [ ] Conduct usability evaluation.
- [ ] Collect user feedback.
- [ ] Refine visualisations and interface.

### Week 5 – Finalisation

- [ ] Complete the website.
- [ ] Deploy the website.
- [ ] Complete the Visualisation Design Book.
- [ ] Review final submission requirements.

## 9. Important Notes

- Original datasets must be preserved in the Raw directory.
- Each dataset should be inspected independently before cross-dataset analysis.
- All data transformations should be documented.
- The Data Dictionary must be consulted when interpreting dataset attributes and statistical definitions.
- Visualisations on the website must be built using D3.js.
- Analytical findings must be supported by actual dataset evidence.
- The datasets report absolute injury counts. Comparisons between regions should consider differences in population size.
- Missing values must be investigated before deciding whether to remove, replace, or retain them.
