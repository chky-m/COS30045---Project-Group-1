#!/usr/bin/env python3
"""Build Website/assets/data/story-data.js from the processed BITRE CSVs.

Standard library only. Run from anywhere:
    python3 Website/scripts/build_data.py            # writes story-data.js
    python3 Website/scripts/build_data.py --report   # also prints validation figures

Measures
--------
National file (Cause of injury = Traffic, 86,140 rows):
  * `Hospitalisations`  = cases NOT ending in death in care (Count of cases - Died_cases).
    Complete for all months 2011-2021 -> default volume measure.
  * `Count of cases`    = all cases incl. deaths in care. Unavailable (NULL) for some
    records from Jul 2020, so it is only used for the 2011-2019 severity analysis.
  * `Died_cases`        = deaths in care (separation mode 8, within 30 days). Available to
    Jun 2020 only. deathsPer1000 = sum(Died_cases) / sum(Count of cases) * 1000, 2011-2019.
State file (T1-T5): "count of cases excluding died in hospitals within 30 days", which
corresponds to the national `Hospitalisations` measure.
First Nations workbook: processed t2-t5 tables (see build_first_nations).

Phase-2 additions (Documentation/Build_Spec.md section 3)
--------------------------------------------------------
  * national.halfYearly            - half-yearly Hospitalisations (+ deaths where available)
  * national.yearly[].deathsPer1000 - 2011-2019 only (null afterwards)
  * national.windows               - % change for 2011-2021, 2012-2016, 2018-2021, 2011-2019
  * severity tables: `bedDaysPerCase1520` = (sum Bed days - sum Died_bed_days) / sum
    Hospitalisations over Jul 2015 - Jun 2020 (one bed-day rule regime, deaths still
    separable; QA M4). Replaces the pooled 2011-2019 bed-day figures. `lowN` flags
    categories with < 30 deaths in hospital (QA M7).
  * national.roadUserCovid         - H1 2019 -> H1 2020 change per road user
  * national.bedDaysNational1520   - national bed days per case, Jul 2015 - Jun 2020
  * state.windows                  - per-state % change for 2018-2021 / 2012-2016 / 2011-2021
  * state.bedDays                  - state bed days per case, H2 2015 - H2 2021 (T1 bed days
    already exclude deaths) and H2 2015 - H1 2020 (window matching the national figure)
  * state.*Mix[].shareOfT1         - shares with the state's T1 total as denominator, plus an
    explicit "Not published" row for the remainder (never zero-filled)
  * state.cyclists                 - T2 pedal cyclists per state, 2011 vs 2021
"""
import csv
import json
import os
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
PROC = os.path.join(REPO, "DataVisualisation_Analysis_and_Preprocessing", "Dataset", "Processed")
NAT_CSV = os.path.join(PROC, "national_hospitalised_injury_counts_processed.csv")
ST_DIR = os.path.join(PROC, "state-and-territory-hospitalisation-injury-publication-2023")
OUT = os.path.join(REPO, "Website", "assets", "data", "story-data.js")

YEARS = list(range(2011, 2022))
SEV_YEARS = range(2011, 2020)  # full years with death data
MONTHS = ["January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December"]
AGES = ["0-7", "8-16", "17-25", "26-39", "40-64", "65-74", "75+"]
STATES = ["NSW", "Vic", "Qld", "WA", "SA", "Tas", "ACT", "NT"]
H1 = {"January", "February", "March", "April", "May", "June"}

# National road users grouped for readable charts (small heavy-vehicle/bus/van/unknown -> Other)
NAT_RU_GROUP = {
    "Car driver": "Car driver",
    "Car passenger": "Car passenger",
    "Car unknown position": "Other",
    "Motorcyclist": "Motorcyclist",
    "Pedal cyclist": "Pedal cyclist",
    "Pedestrian": "Pedestrian",
}
RU_ORDER = ["Car driver", "Car passenger", "Motorcyclist", "Pedal cyclist", "Pedestrian", "Other"]

ST_CASES = "count of cases excluding died in hospitals within 30 days"
ST_BED = "bed days excluding died in hospitals within 30 days"
ST_RU_SHORT = {
    "Car driver, passenger or unknown position": "Car occupant",
    "Motorcyclist": "Motorcyclist",
    "Pedal cyclist": "Pedal cyclist",
    "Pedestrian": "Pedestrian",
    "Bus occupant": "Other",
    "Heavy transport driver, passenger or unknown position": "Other",
    "Pick-up truck or van occupant": "Other",
    "Other or unknown": "Other",
}
ST_RU_ORDER = ["Car occupant", "Motorcyclist", "Pedal cyclist", "Pedestrian", "Other"]


def num(v):
    if v is None or v == "":
        return None
    try:
        return float(v)
    except ValueError:
        return None


def r1(x, d=1):
    return None if x is None else round(x, d)


def pct(a, b, d=1):
    return None if not b else round(a / b * 100, d)


def read(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


# --------------------------------------------------------------------------- national
def build_national(rows):
    S = lambda: defaultdict(float)
    yearly = defaultdict(S)
    ym = defaultdict(float)
    ru_year = defaultdict(float)
    ru_half_2019_2021 = defaultdict(float)
    sev = {k: defaultdict(S) for k in ("Road user", "Age group", "Counterparty", "ABS remoteness area", "Sex")}
    all_by = {k: defaultdict(S) for k in ("Road user", "Age group", "Counterparty", "ABS remoteness area", "Sex")}
    age_sex = defaultdict(float)
    rem_ru = defaultdict(float)
    bd_fy = defaultdict(S)  # financial-year bed days/case for the Jul-2015 rule change
    died_available = defaultdict(bool)
    halfs = defaultdict(S)                       # (year, "H1"/"H2") -> h, died, cc
    bd1520 = {k: defaultdict(S) for k in sev}    # Jul 2015 - Jun 2020 bed-day window
    bd1520_total = defaultdict(float)

    for r in rows:
        y = int(r["Calendar year"]); m = r["Month"]
        h = num(r["Hospitalisations"]) or 0.0
        bd = num(r["Bed days"]) or 0.0
        cc = num(r["Count of cases"])
        dc = num(r["Died_cases"])
        ru = NAT_RU_GROUP.get(r["Road user"], "Other")
        yearly[y]["h"] += h; yearly[y]["bd"] += bd
        if dc is not None:
            yearly[y]["died"] += dc; died_available[y] = True
        if cc is not None:
            yearly[y]["cc"] += cc
        ym[(y, m)] += h
        ru_year[(ru, y)] += h
        half = "H1" if m in H1 else "H2"
        halfs[(y, half)]["h"] += h
        if dc is not None:
            halfs[(y, half)]["died"] += dc
            halfs[(y, half)]["hasDied"] = 1
        in1520 = (y == 2015 and half == "H2") or 2016 <= y <= 2019 or (y == 2020 and half == "H1")
        dbd = num(r["Died_bed_days"]) or 0.0
        if in1520:
            bd1520_total["bd"] += bd - dbd; bd1520_total["h"] += h
        if y >= 2019:
            ru_half_2019_2021[(ru, y, half)] += h
        fy = y if m not in H1 else y - 1  # FY starting July
        bd_fy[fy]["h"] += h; bd_fy[fy]["bd"] += bd
        sexk = r["Sex"]
        if sexk in ("Male", "Female") and r["Age group"] in AGES:
            age_sex[(r["Age group"], sexk)] += h
        rem_ru[(r["ABS remoteness area"], ru)] += h
        for k in sev:
            key = r[k] if k != "Road user" else ru
            all_by[k][key]["h"] += h; all_by[k][key]["bd"] += bd
            if in1520:
                bd1520[k][key]["bd"] += bd - dbd; bd1520[k][key]["h"] += h
            if y in SEV_YEARS:
                sev[k][key]["cc"] += cc or 0.0
                sev[k][key]["died"] += dc or 0.0
                sev[k][key]["h"] += h; sev[k][key]["bd"] += bd

    out = {}
    out["yearly"] = [{
        "year": y,
        "hospitalisations": int(yearly[y]["h"]),
        "bedDays": int(yearly[y]["bd"]),
        "bedDaysPerCase": r1(yearly[y]["bd"] / yearly[y]["h"], 2),
        "diedCases": int(yearly[y]["died"]) if died_available[y] else None,
        "diedNote": "Jan-Jun only" if y == 2020 else ("not available" if y == 2021 else None),
        "deathsPer1000": r1(yearly[y]["died"] / yearly[y]["cc"] * 1000, 2) if y in SEV_YEARS else None,
    } for y in YEARS]
    yh = {y: yearly[y]["h"] for y in YEARS}
    out["windows"] = [{"window": f"{a}-{b}", "from": int(yh[a]), "to": int(yh[b]), "pctChange": pct(yh[b] - yh[a], yh[a])}
                      for a, b in ((2011, 2021), (2012, 2016), (2018, 2021), (2011, 2019))]
    out["halfYearly"] = [{
        "year": y, "half": hf, "period": f"{y} {hf}",
        "hospitalisations": int(halfs[(y, hf)]["h"]),
        "diedCases": int(halfs[(y, hf)]["died"]) if halfs[(y, hf)]["hasDied"] else None,
    } for y in YEARS for hf in ("H1", "H2")]
    out["bedDaysNational1520"] = {
        "window": "Jul 2015 - Jun 2020",
        "bedDaysPerCase": r1(bd1520_total["bd"] / bd1520_total["h"], 2),
        "method": "(sum Bed days - sum Died_bed_days) / sum Hospitalisations",
    }
    out["bedDaysPerCaseFY"] = [{
        "fy": f"{fy}-{str(fy + 1)[2:]}",
        "bedDaysPerCase": r1(bd_fy[fy]["bd"] / bd_fy[fy]["h"], 2),
        "afterRuleChange": fy >= 2015,
    } for fy in range(2011, 2021)]
    out["monthly"] = [{"year": y, "month": m, "hospitalisations": int(ym[(y, m)])} for y in YEARS for m in MONTHS]
    out["roadUserOrder"] = RU_ORDER
    out["roadUserByYear"] = [{"roadUser": u, "year": y, "hospitalisations": int(ru_year[(u, y)]),
                              "index2011": r1(ru_year[(u, y)] / ru_year[(u, 2011)] * 100)}
                             for u in RU_ORDER for y in YEARS]
    out["covidHalfYears"] = [{"roadUser": u, "period": f"{y} {hf}", "hospitalisations": int(ru_half_2019_2021[(u, y, hf)])}
                             for u in RU_ORDER for y in (2019, 2020, 2021) for hf in ("H1", "H2")]

    def sev_table(k, keys):
        tc = sum(v["cc"] for v in sev[k].values()); td = sum(v["died"] for v in sev[k].values())
        th = sum(v["h"] for v in all_by[k].values())
        res = []
        for key in keys:
            s = sev[k][key]; a = all_by[k][key]
            res.append({
                "category": key,
                "hospitalisations2011_2021": int(a["h"]),
                "shareHospitalisations": pct(a["h"], th),
                "cases2011_2019": int(s["cc"]),
                "deaths2011_2019": int(s["died"]),
                "shareCases2011_2019": pct(s["cc"], tc),
                "shareDeaths2011_2019": pct(s["died"], td),
                "deathsPer1000": r1(s["died"] / s["cc"] * 1000) if s["cc"] else None,
                "lowN": s["died"] < 30,
                "bedDaysPerCase1520": r1(bd1520[k][key]["bd"] / bd1520[k][key]["h"], 2) if bd1520[k][key]["h"] else None,
            })
        return sorted(res, key=lambda d: -d["hospitalisations2011_2021"]) if k in ("Counterparty",) else res

    out["roadUserSeverity"] = sev_table("Road user", RU_ORDER)
    out["ageSeverity"] = sev_table("Age group", AGES)
    out["counterpartySeverity"] = sev_table("Counterparty", list(all_by["Counterparty"].keys()))
    out["remoteness"] = sev_table("ABS remoteness area", ["Major Cities", "Regional", "Remote", "Missing"])
    out["sexSeverity"] = sev_table("Sex", ["Male", "Female"])
    out["ageSex"] = [{"age": a, "male": int(age_sex[(a, "Male")]), "female": int(age_sex[(a, "Female")])} for a in AGES]
    rem_tot = defaultdict(float)
    for (a, u), v in rem_ru.items():
        rem_tot[a] += v
    out["remotenessRoadUser"] = [{"remoteness": a, "roadUser": u, "hospitalisations": int(rem_ru[(a, u)]),
                                  "share": pct(rem_ru[(a, u)], rem_tot[a])}
                                 for a in ["Major Cities", "Regional", "Remote", "Missing"] for u in RU_ORDER]
    # H1 2019 -> H1 2020 per road user (coincides with COVID-19 restrictions; external context)
    out["roadUserCovid"] = [{"roadUser": u, "h1_2019": int(ru_half_2019_2021[(u, 2019, "H1")]),
                             "h1_2020": int(ru_half_2019_2021[(u, 2020, "H1")]),
                             "pctChange": pct(ru_half_2019_2021[(u, 2020, "H1")] - ru_half_2019_2021[(u, 2019, "H1")],
                                              ru_half_2019_2021[(u, 2019, "H1")])} for u in RU_ORDER]
    # road-user % change in break-free windows (QA V4/M5)
    out["roadUserWindows"] = [{"roadUser": u, "window": f"{a}-{b}",
                               "pctChange": pct(ru_year[(u, b)] - ru_year[(u, a)], ru_year[(u, a)])}
                              for u in RU_ORDER for a, b in ((2011, 2021), (2012, 2016), (2018, 2021), (2011, 2019))]
    return out


# --------------------------------------------------------------------------- state
def build_state(national_yearly):
    t1 = read(os.path.join(ST_DIR, "Table1_Annual_Hospitalisations.csv"))
    t2 = read(os.path.join(ST_DIR, "Table2_Road_User.csv"))
    t4 = read(os.path.join(ST_DIR, "Table4_Age_Group.csv"))
    t5 = read(os.path.join(ST_DIR, "Table5_Counterparty.csv"))

    ann = defaultdict(float); bed = defaultdict(float); half = {}
    bdw = defaultdict(float)  # (state, window, "c"/"b") bed-day windows after the Jul 2015 rule change
    for r in t1:
        s, y, p = r["state or territory"], int(r["calendar year"]), r["6-monthly"]
        c, b = float(r[ST_CASES]), float(r[ST_BED])
        ann[(s, y)] += c; bed[(s, y)] += b; half[(s, y, p)] = (c, b)
        after = y > 2015 or (y == 2015 and p == "Jul-Dec")
        if after:
            bdw[(s, "1521", "c")] += c; bdw[(s, "1521", "b")] += b
            if y < 2020 or (y == 2020 and p == "Jan-Jun"):
                bdw[(s, "1520", "c")] += c; bdw[(s, "1520", "b")] += b
    yr_tot = {y: sum(ann[(s, y)] for s in STATES) for y in YEARS}
    nat = {d["year"]: d["hospitalisations"] for d in national_yearly}

    out = {"states": STATES}
    out["annual"] = [{
        "state": s, "year": y, "hospitalisations": int(ann[(s, y)]),
        "index2011": r1(ann[(s, y)] / ann[(s, 2011)] * 100),
        "shareOfStatesTotal": pct(ann[(s, y)], yr_tot[y]),
        "bedDaysPerCase": r1(bed[(s, y)] / ann[(s, y)], 2),
    } for s in STATES for y in YEARS]
    out["halfYearly"] = [{"state": s, "year": y, "half": p, "period": f"{y} {'H1' if p == 'Jan-Jun' else 'H2'}",
                          "hospitalisations": int(half[(s, y, p)][0])}
                         for s in STATES for y in YEARS for p in ("Jan-Jun", "Jul-Dec")]
    out["reconciliation"] = [{"year": y, "national": nat[y], "sumOfStates": int(yr_tot[y]),
                              "gap": int(nat[y] - yr_tot[y]), "gapPct": pct(nat[y] - yr_tot[y], nat[y], 2)}
                             for y in YEARS]

    # % change by comparison window (Build_Spec S1). Flags: Vic straddles its own Jul 2012 break
    # in 2012-2016; NSW and Vic cross a break in 2011-2021.
    WIN = {"2018-2021": (2018, 2021, []), "2012-2016": (2012, 2016, ["Vic"]), "2011-2021": (2011, 2021, ["NSW", "Vic"])}
    out["windows"] = [{"state": s, "window": w, "from": int(ann[(s, a)]), "to": int(ann[(s, b)]),
                       "pctChange": pct(ann[(s, b)] - ann[(s, a)], ann[(s, a)]), "breakFlag": s in fl}
                      for w, (a, b, fl) in WIN.items() for s in STATES]
    out["breakFlags"] = {"NSW": "2017-06", "Vic": "2012-07"}
    out["bedDays"] = [{"state": s,
                       "bedDaysPerCase1521": r1(bdw[(s, "1521", "b")] / bdw[(s, "1521", "c")], 2),
                       "cases1521": int(bdw[(s, "1521", "c")]), "bedDays1521": int(bdw[(s, "1521", "b")]),
                       "bedDaysPerCase1520": r1(bdw[(s, "1520", "b")] / bdw[(s, "1520", "c")], 2)}
                      for s in STATES]

    def mix(rows, catkey, mapping, order, years):
        pub = defaultdict(float); np_rec = defaultdict(int); n_rec = defaultdict(int)
        for r in rows:
            y = int(r["calendar year"])
            if y not in years:
                continue
            s = r["state or territory"]; cat = mapping(r[catkey]) if mapping else r[catkey]
            n_rec[s] += 1
            v = num(r[ST_CASES])
            if v is None:
                np_rec[s] += 1
            else:
                pub[(s, cat)] += v
        res = []
        for s in STATES:
            t1s = sum(ann[(s, y)] for y in years)
            pubs = sum(pub[(s, c)] for c in order)
            for c in order:
                res.append({"state": s, "category": c, "hospitalisations": int(pub[(s, c)]),
                            "shareOfPublished": pct(pub[(s, c)], pubs),
                            "shareOfT1": pct(pub[(s, c)], t1s)})
            # explicit remainder of the T1 total that is not published in this table (n.p.)
            res.append({"state": s, "category": "Not published", "hospitalisations": int(t1s - pubs),
                        "shareOfPublished": None, "shareOfT1": pct(t1s - pubs, t1s)})
            res.append({"state": s, "category": "_coverage", "npRecords": np_rec[s], "records": n_rec[s],
                        "unpublishedCases": int(t1s - pubs), "unpublishedPctOfT1": pct(t1s - pubs, t1s)})
        return res

    allyears = set(YEARS)
    out["roadUserOrder"] = ST_RU_ORDER
    out["roadUserMix"] = mix(t2, "road user", lambda c: ST_RU_SHORT[c], ST_RU_ORDER, allyears)
    out["ageOrder"] = AGES
    out["ageMix"] = mix(t4, "age group", None, AGES, allyears)
    cps = ["Car, pick-up truck or van", "Non-collision transport accident", "Fixed or stationary object", "Other"]
    out["counterpartyOrder"] = cps
    out["counterpartyMix"] = mix(t5, "counterparty", None, cps, allyears)

    # Road user by state over time (published values; flag years with any n.p. in that state/user)
    ru_y = defaultdict(float); ru_np = defaultdict(bool)
    for r in t2:
        s, y = r["state or territory"], int(r["calendar year"]); u = ST_RU_SHORT[r["road user"]]
        v = num(r[ST_CASES])
        if v is None:
            ru_np[(s, u, y)] = True
        else:
            ru_y[(s, u, y)] += v
    out["roadUserByYear"] = [{"state": s, "roadUser": u, "year": y, "hospitalisations": int(ru_y[(s, u, y)]),
                              "hasUnpublished": ru_np[(s, u, y)]}
                             for s in STATES for u in ST_RU_ORDER for y in YEARS]
    out["cyclists"] = [{"state": s, "y2011": int(ru_y[(s, "Pedal cyclist", 2011)]), "y2021": int(ru_y[(s, "Pedal cyclist", 2021)]),
                        "index2021": r1(ru_y[(s, "Pedal cyclist", 2021)] / ru_y[(s, "Pedal cyclist", 2011)] * 100),
                        "pctChange": pct(ru_y[(s, "Pedal cyclist", 2021)] - ru_y[(s, "Pedal cyclist", 2011)], ru_y[(s, "Pedal cyclist", 2011)]),
                        "hasUnpublished": any(ru_np[(s, "Pedal cyclist", y)] for y in (2011, 2021))}
                       for s in STATES]
    return out


# --------------------------------------------------------------------------- First Nations
FN_DIR = os.path.join(PROC, "First-Nations-hospitalised-injuries-2023")
FN, NI = "First Nations people", "Non-Indigenous"
FN_AGES = ["0-7", "8-16", "17-25", "26-39", "40-64", "65+"]
FN_REMOTE = ["Major Cities", "Regional", "Remote"]
FN_CP = ["Car, pick-up truck or van", "Non-collision transport accident", "Fixed or stationary object", "Other"]
FN_MAIN_RU = {"Car driver, passenger or unknown position": "Car occupant", "Motorcyclist": "Motorcyclist",
              "Pedal cyclist": "Pedal cyclist", "Pedestrian": "Pedestrian"}


def build_first_nations():
    """First Nations workbook (processed t2-t5 CSVs; t1 duplicates the t3 age table and is ignored).

    * Annual totals = sum of the counterparty table (t5): it has no n.p. cells or absent records and
      matches workbook Table 1 for both populations in all 11 years (readme_first_nations.md).
    * Mix shares use those annual totals as denominator, except remoteness, which uses cases with a
      known usual residence (the unknown remainder is reported separately).
    * Road user: the four main groups are never suppressed, so "Other" = total - main four. It therefore
      includes the n.p. cells (bus, heavy vehicle, van, other/unknown) and the one absent record.
    * Only 2011 and 2021 are used for mixes: neither year has n.p. cells in the age table.
    """
    def load(name, cat):
        g, np_cells = defaultdict(int), defaultdict(int)
        for r in read(os.path.join(FN_DIR, name)):
            k = (r["First Nations status"], int(r["Calendar year"]), r[cat])
            v = num(r["Hospitalisations"])
            if v is None:
                np_cells[k] += 1
            else:
                g[k] += v
        return g, np_cells

    cp, _ = load("t5_counterparty.csv", "Counterparty")
    age, age_np = load("t3_age_group.csv", "Age group")
    rem, _ = load("t4_remoteness.csv", "ABS remoteness area")
    ru, ru_np = load("t2_road_user.csv", "Road user")
    total = {(p, y): sum(cp[(p, y, c)] for c in FN_CP) for p in (FN, NI) for y in YEARS}

    annual = []
    for y in YEARS:
        f, n = total[(FN, y)], total[(NI, y)]
        annual.append({"year": y, "firstNations": int(f), "nonIndigenous": int(n),
                       "fnIndex": r1(f / total[(FN, 2011)] * 100), "niIndex": r1(n / total[(NI, 2011)] * 100),
                       "fnShare": r1(f / (f + n) * 100, 2)})

    def mix(kind, cats, getter, denom):
        rows = []
        for p in (FN, NI):
            for y in (2011, 2021):
                d = denom(p, y)
                for c in cats:
                    v = getter(p, y, c)
                    rows.append({"population": p, "year": y, "category": c, "hospitalisations": int(v), "share": r1(v / d * 100)})
        return rows

    main4 = lambda p, y: {lab: ru[(p, y, src)] for src, lab in FN_MAIN_RU.items()}
    ru_get = lambda p, y, c: (total[(p, y)] - sum(main4(p, y).values())) if c == "Other" else main4(p, y)[c]
    known = lambda p, y: sum(rem[(p, y, c)] for c in FN_REMOTE)
    assert not any(age_np[(p, y, a)] for p in (FN, NI) for y in (2011, 2021) for a in FN_AGES)
    assert not any(ru_np[(p, y, src)] for p in (FN, NI) for y in YEARS for src in FN_MAIN_RU)

    return {
        "populations": [FN, NI],
        "annual": annual,
        "ageOrder": FN_AGES, "remotenessOrder": FN_REMOTE, "counterpartyOrder": FN_CP,
        "roadUserOrder": ["Car occupant", "Motorcyclist", "Pedal cyclist", "Pedestrian", "Other"],
        "ageMix": mix("age", FN_AGES, lambda p, y, c: age[(p, y, c)], lambda p, y: total[(p, y)]),
        "remotenessMix": mix("remoteness", FN_REMOTE, lambda p, y, c: rem[(p, y, c)], known),
        "unknownResidence": [{"population": p, "year": y, "hospitalisations": int(total[(p, y)] - known(p, y))}
                             for p in (FN, NI) for y in (2011, 2021)],
        "roadUserMix": mix("roadUser", ["Car occupant", "Motorcyclist", "Pedal cyclist", "Pedestrian", "Other"], ru_get,
                           lambda p, y: total[(p, y)]),
        "counterpartyMix": mix("counterparty", FN_CP, lambda p, y, c: cp[(p, y, c)], lambda p, y: total[(p, y)]),
        "motorcyclists": [{"population": p, "year": y, "hospitalisations": int(ru[(p, y, "Motorcyclist")])}
                          for p in (FN, NI) for y in YEARS],
        "npCells": {"roadUser": int(sum(ru_np.values())), "age": int(sum(age_np.values()))},
    }


# --------------------------------------------------------------------------- main
def main():
    nat_rows = read(NAT_CSV)
    assert all(r["Cause of injury"] == "Traffic" for r in nat_rows)
    national = build_national(nat_rows)
    state = build_state(national["yearly"])
    first_nations = build_first_nations()
    data = {
        "meta": {
            "title": "Hospitalised road crash injuries in Australia, 2011-2021",
            "source": "BITRE Hospitalised injuries from road crashes (AIHW National Hospital Morbidity Database), September 2023 release",
            "files": {
                "national": "Dataset/Processed/national_hospitalised_injury_counts_processed.csv (Cause of injury = Traffic)",
                "state": "Dataset/Processed/state-and-territory-hospitalisation-injury-publication-2023/Table1-5 CSVs",
                "firstNations": "Dataset/Processed/First-Nations-hospitalised-injuries-2023/t2-t5 CSVs (t1 duplicates t3)",
            },
            "measures": {
                "hospitalisations": "Cases not ending in death in care within 30 days (national `Hospitalisations`; state 'count of cases excluding died')",
                "deathsPer1000": "sum(Died_cases) / sum(Count of cases) x 1000, calendar years 2011-2019 (deaths in care within 30 days)",
                "bedDaysPerCase": "sum(Bed days) / sum(hospitalisations); NOT comparable across the 1 July 2015 bed-day rule change",
                "bedDaysPerCase1520": "national severity tables: (sum Bed days - sum Died_bed_days) / sum Hospitalisations, Jul 2015 - Jun 2020",
                "stateBedDays": "state: sum T1 bed days / sum T1 cases (both exclude deaths), H2 2015 - H2 2021",
                "stateShares": "state mix shares use the state's T1 total as denominator; unpublished remainder shown as 'Not published'",
            },
            "notes": [
                "Counts are hospital separations (episodes of care), not unique people.",
                "Death data available to June 2020 only; severity uses 2011-2019.",
                "Victoria series break from 1 July 2012; NSW series break from June 2017 (ED-only episodes no longer admissions).",
                "Bed-day inclusion rules changed from 1 July 2015 (ACS 2104 / Z50).",
                "No population or exposure denominators are used: all figures are counts or shares, not rates per capita.",
                "State road-user and age tables contain n.p. (not published) cells; shares use the state's T1 total as denominator; the unpublished remainder is shown as 'Not published', never as zero.",
                "Sum of state T1 totals is below the national Traffic total each year (see state.reconciliation).",
                "First Nations: annual totals = sum of t5 counterparty (matches workbook T1); mixes compare 2011 and 2021 only; remoteness shares exclude unknown residence.",
            ],
        },
        "national": national,
        "state": state,
        "firstNations": first_nations,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("/* Generated by Website/scripts/build_data.py - do not edit by hand. */\n")
        f.write("window.STORY_DATA = ")
        json.dump(data, f, separators=(",", ":"), ensure_ascii=False)
        f.write(";\n")
    print(f"wrote {OUT} ({os.path.getsize(OUT) / 1024:.1f} KB)")
    if "--report" in sys.argv:
        print(json.dumps({k: v for k, v in national.items() if k not in ("monthly", "roadUserByYear", "covidHalfYears", "remotenessRoadUser")}, indent=1))
        print(json.dumps(state["reconciliation"], indent=1))
        print(json.dumps({k: state[k] for k in ("windows", "bedDays", "cyclists")}, indent=1))


if __name__ == "__main__":
    main()
