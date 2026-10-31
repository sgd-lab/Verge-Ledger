# 03 - Method and Rules

This is the authoritative spec for the deterministic logic in packages/core. All thresholds and weights are configuration in packages/data, versioned, and flagged as v1 heuristics that need ecologist calibration. Do not present them as scientific standards anywhere in the UI.

Scoring version string: verge-triage-v1 Advice version string: verge-advice-v1

## 1\. Principles

1. Triage, not designation. The output helps decide whether to ask an expert to visit.
2. Transparent. Every point is explained.
3. Conservative. When unsure, recommend expert review rather than a firm claim.
4. Sourced. Guidance statements cite the source document.
5. Safe. Safety overlays are never optional in advice.

## 2\. Inputs

| Field                  | Values                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| forbCountBand          | 0, 1_2, 3_5, 6_9, 10_14, 15plus (distinct flowering wildflower species seen in a 10 m stretch of the verge) |
| indicatorIds           | ids from data/indicators.json (positive indicators ticked)                                                  |
| nutrientDominantIds    | ids of nutrient-enrichment species that dominate the sward                                                  |
| swardStructure         | short_uniform, medium_mixed, tall_rank                                                                      |
| cuttingsState          | removed, left, na                                                                                           |
| cutState               | uncut, cut_recent, unknown                                                                                  |
| lastCutMonth           | 1 to 12 or null                                                                                             |
| cutsPerYear (optional) | integer if known                                                                                            |

## 3\. Triage score (verge-triage-v1)

Points:

Richness R (0 to 40)

| forbCountBand | R   |
| ------------- | --- |
| 0             | 0   |
| 1_2           | 8   |
| 3_5           | 18  |
| 6_9           | 28  |
| 10_14         | 35  |
| 15plus        | 40  |

Indicators I (0 to 30)

- sum the weights of distinct ticked positive indicators (weights 1 to 3 from data)
- I = round(30 x min(sum, 10) / 10)

Structure S (0 to 15)

| swardStructure | S   |
| -------------- | --- |
| medium_mixed   | 15  |
| short_uniform  | 8   |
| tall_rank      | 3   |

Nutrient penalty N (0 to 20)

- N = min(20, 7 x count of distinct nutrient-enrichment species marked dominant)

Raw = R + I + S (max 85) Score = clamp( round(100 x Raw / 85) - N, 0, 100 )

Tiers (configurable)

| Score     | Tier name               |
| --------- | ----------------------- |
| 0 to 29   | Ordinary verge          |
| 30 to 59  | Promising verge         |
| 60 to 100 | Refer for expert review |

Override rules

- If any ticked indicator has group orchid and the score is below 60, raise the tier to at least "Promising verge" and add the flag "Orchid recorded: refer to local Wildlife Trust".
- If forbCountBand is 0 and no indicators are ticked, tier is "Ordinary verge" regardless of structure.
- If evidence is thin (no indicators ticked and forbCountBand is 1_2 or lower) set confidence to "low". Otherwise "medium". Never output "high" in v1.

Management flags (separate from score)

- CUTTINGS_LEFT: cuttingsState is left. Text: cuttings left on the verge return nutrients and favour coarse grasses.
- MAY_JUNE_CUT: lastCutMonth in May or June. Text: guidance suggests early summer cuts reduce flowering and seed set where the aim is wildflowers.
- RANK_GROWTH: swardStructure is tall_rank AND (cuttingsState is left OR cutState is uncut). Text: long-uncut or uncollected rank swards can form thatch and reduce diversity.
- NO_FLAGS: none of the above.

Disclaimer (display and export, exact text) "This is a quick volunteer triage, not an ecological survey or a Local Wildlife Site assessment. Scores use simple rules that have not yet been reviewed by an ecologist. If a verge scores highly or you recorded an orchid, ask your local Wildlife Trust or biological record centre to check it."

Explanation generator For each result output: the three largest point contributors, what is missing (for example, no indicators ticked), and "what would change this": for example, "Recording indicator species would raise confidence."

## 4\. Species and indicator data rules

- File: packages/data/indicators.json validated by a JSON schema and a unit test.
- Every entry has sourceUrl and sourceRetrievedAt. No entry without both.
- reviewStatus is needs_expert_review for all entries in v0.1 unless a named reviewer is recorded in docs/DECISIONS.md.
- Candidate seeds to verify against Plantlife and local Wildlife Trust or Local Wildlife Site selection guidance (do not assume they are correct for every soil type or county): common knapweed, bird's-foot trefoil, oxeye daisy, lady's bedstraw, meadow vetchling, yellow rattle, cowslip, field scabious, devil's-bit scabious, and orchids as a group.
- Candidate nutrient-enrichment species to verify: nettle, cow parsley, hogweed, false oat-grass, docks, cleavers.
- Sensitive flag: orchids as a group and any species the sources identify as vulnerable to collection. Verify.
- The agent must not invent weights beyond 1 to 3 and must document in docs/DATA.md how weights were assigned (for example: 1 general neutral-grassland indicator, 2 more selective indicator, 3 strongly selective indicator) and that this is provisional.
- Provide 20 to 40 entries total, favouring species visible from roadside distance and easy to recognise. Include a "not sure" option that adds no points.

## 5\. Cut-regime advisor (verge-advice-v1)

Source basis: Plantlife Good Verge Guide, Plantlife Managing Grassland Road Verges, Plantlife community support page, Wildlife Trusts verge guidance. The agent must re-read these and cite section or page where possible.

Inputs: setting (rural, urban), roadClass, widthBand, tier (or unknown), cuttingsRemovable (yes, no, unknown), safetyConstraint (none, junction_or_bend, visibility_splay_present), cutsPossiblePerYear (1, 2, 3 or more).

Regimes (data, with months and sources):

| Id  | Name                       | Months                                                                                 | Notes                                                                                                                                 |
| --- | -------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Single late cut            | Cut once between August and end of September, remove cuttings                          | Use when only one cut is possible. Guide: if only one cut, cut between August and end September and remove cuttings to allow seed set |
| RA  | Meadow pattern A           | First cut mid-July to end of September, second cut before Christmas                    | Mirrors hay meadow management                                                                                                         |
| RB  | Meadow pattern B           | Cut in February or March before most plants flower, second cut in September or October | Avoids ground-nesting birds in spring, supports later flowering                                                                       |
| RU  | Urban short flowering lawn | Cut every 6 to 8 weeks to 3 to 6 cm, with some areas cut less often                    | For amenity areas, supports short wildflowers such as clovers, trefoils, selfheal, yarrow                                             |

Overlays (always applied):

- Safety framing: maintain sightlines, junction and bend visibility splays with a short frequent cut of about one working width. Never recommend dropping these.
- Refuge: leave roughly 10 to 20 percent of the verge uncut in rotation, for example a back-of-verge strip, varying where it sits between years.
- Cutter height: raise the cutter bar where practical to reduce harm to amphibians, reptiles and small mammals.
- Wider verges (over 3 m): central strip 1 to 2 cuts a year, back verge on a longer cycle, as in Plantlife guidance.

Selection logic:

1. If setting is urban and tier is not "Refer for expert review", primary is RU. Fallback is RA with framing.
2. If setting is urban and tier is "Refer for expert review", primary is RA with framing. Fallback is RU.
3. If rural and cutsPossiblePerYear is 1, primary is R1. Fallback is R1 (note that a second cut before Christmas would improve outcomes if budget allows).
4. If rural and cutsPossiblePerYear is 2 or more: primary is RA. Fallback is RB.
5. If tier is "Refer for expert review", always add: "Ask your Wildlife Trust whether this verge should be managed as a nature reserve verge."
6. If cuttingsRemovable is no or unknown, add flag CUTTINGS_FERTILITY: cut-and-collect is preferable because leaving cuttings raises soil fertility.
7. Every recommendation includes: months, cuttings handling, overlays, rationale in two sentences, source list, and the statement "Highway safety rules take priority. Agree any change with your highway authority."

## 6\. Scenario simulator: which cut to drop?

Purpose: when a council proposes removing N annual cuts, rank which cuts can go with the least ecological harm, given what the user knows. It is a decision aid, not an assessment of highway safety.

Inputs: list of current cuts (month 1 to 12 each, label optional), safetyCritical flag per cut, tier or unknown, cuttingsRemovable, number to remove (1 or 2, at most all non-critical cuts), optional cost inputs.

Alignment value by month (higher means better aligned with guidance; v1 heuristic):

| Month | Alignment | Rationale                                                             |
| ----- | --------- | --------------------------------------------------------------------- |
| Jan   | 1         | Winter tidy, little effect on flowering                               |
| Feb   | 2         | Fits pattern B early cut                                              |
| Mar   | 2         | Fits pattern B early cut                                              |
| Apr   | 1         | Spring growth and nesting, limited benefit                            |
| May   | 0         | Early cut before flowering and seed set, commonly criticised          |
| Jun   | 1         | Reduces flowering and seed set, less harmful than May for some swards |
| Jul   | 2         | Mid-July onward fits pattern A                                        |
| Aug   | 3         | Core meadow cut window                                                |
| Sep   | 3         | Core meadow cut window                                                |
| Oct   | 2         | Fits pattern B second cut                                             |
| Nov   | 2         | Fits before-Christmas cut                                             |
| Dec   | 2         | Fits before-Christmas cut                                             |

Rules:

1. A cut flagged safetyCritical cannot be removed.
2. If tier is "Promising verge" or "Refer for expert review", at least one cut in August or September must remain. Candidate removals that would violate this are marked "not recommended" with the reason.
3. Rank remaining candidate removals ascending by alignment value (lowest alignment removed first). Ties broken by earlier month first.
4. For removal of N cuts, evaluate combinations and rank by sum of removed alignment values (lower is better), applying rules 1 and 2.
5. If cuttingsRemovable is no or unknown and a candidate removal would leave a single remaining cut, add a caution: with cuttings left, fewer cuts can increase rank growth.
6. Always show the plain-language statement: "This ranks options against published wildflower-verge guidance. It does not assess road safety. Visibility cuts stay."
7. If a cost input is provided, show indicative saving = cutsRemoved x costPerCutPerKm x km, labelled "your assumption". Never prefill with a real council figure.

Presets (illustrations, clearly labelled as such): "Rural road, three cuts: May, July, September", "Rural road, two cuts: May, September", "Rural road with one safety cut and two verge cuts".

Expected results to encode as unit tests:

- Cuts May, Jul, Sep, tier unknown, remove 1: rank 1 is remove May.
- Cuts May, Jul, Sep, tier Promising, remove 1: remove May is rank 1. Remove Jul is rank 2. Remove Sep is not recommended because it would leave no cut in August or September (rule 2).
- Cuts May, Sep with May safety-critical, remove 1: only Sep is a candidate, but with tier Promising it violates rule 2, so output "no option meets guidance; consider alternatives" and explain.
- Cuts Mar, Aug, Dec, remove 2, tier unknown: best combination removes Mar and Dec (alignment 2 + 2 = 4) versus Mar and Aug (5) and Aug and Dec (5).

## 7\. Information request template (FOI and EIR)

Generated text, with placeholders filled by user input. Plain, polite, specific.

Subject: Request for information about roadside verge cutting and management

Body structure:

1. Opening: "Under the Freedom of Information Act 2000 and the Environmental Information Regulations 2004, please provide the following information about \[Council name\]'s management of highway verges."
2. Items: a. The verge cutting schedule for the current year, by road class (A, B, C, unclassified) and by rural and urban areas, including the number of cuts and the months in which each cut is scheduled. b. The total area (square metres) or length (kilometres) of highway verge maintained by the council, by road class and by rural and urban area. If area is not held, please say so and provide length. c. A list of any verges managed differently for wildlife, for example roadside nature reserves, protected or special verges, including their number, total length and the dates of their scheduled cuts. d. Whether cuttings are collected and removed, left on site, or a mix, by area or contract. e. The annual budget and actual spend on verge cutting for each of the last three financial years, if held separately from general grounds maintenance. If not held separately, please say so.
3. Format: "Please provide the information in a reusable format such as CSV or spreadsheet where possible."
4. Closing: "If any part of this request is unclear, please contact me. If you refuse any part, please cite the exemption or exception relied on and explain the public interest test. I understand a response is due within 20 working days."
5. Footer, shown in the UI and not in the sent text: "Not legal advice. Consider sending through WhatDoTheyKnow so the response is public. Check your council's own FOI channel."

The generator must not include personal data except what the user types. Unit tests assert that all five items appear and that placeholders are replaced.

## 8\. Evidence pack outline

1. Title block: area or road, date, prepared by (user text), workspace name
2. Summary: number of segments, total length, tier counts, management flags found
3. What we found: table of segments (id, length, tier, score, flags, date)
4. What guidance suggests: advisor output with sources
5. Optional: cut-drop analysis
6. Council facts: registry facts with sources and dates
7. Method and limits: version strings, disclaimer, data quality note
8. Safety and permissions note
9. Appendix: coordinates (coarsened for sensitive taxa), photo list (filenames only)

Demo data produces a diagonal "DEMO" watermark and an explicit note, and cannot be exported as a real pack.

## 9\. Golden fixtures for the score (unit tests)

| Case                                                                                                                                                                                                                                | Inputs                                                                    | Expected                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| A                                                                                                                                                                                                                                   | forb 0, no indicators, short_uniform, no nutrient                         | Raw 8, Score 9, Ordinary verge, confidence low                                                                                        |
| B                                                                                                                                                                                                                                   | forb 6_9, two weight-2 indicators (sum 4), medium_mixed, no nutrient      | R 28, I 12, S 15, Raw 55, Score 65, Refer for expert review, confidence medium                                                        |
| C                                                                                                                                                                                                                                   | forb 10_14, indicators sum 6, medium_mixed, 2 nutrient dominant           | R 35, I 18, S 15, Raw 68, base 80, N 14, Score 66, Refer for expert review                                                            |
| D                                                                                                                                                                                                                                   | forb 3_5, indicators sum 1, tall_rank, cuttings left, 1 nutrient dominant | R 18, I 3, S 3, Raw 24, base 28, N 7, Score 21, Ordinary verge, flags CUTTINGS_LEFT and RANK_GROWTH if rank-growth conditions are met |
| Eforb 3_5, one orchid ticked (orchid group weight assumed 3 in test data), short_uniform, no nutrientR 18, I 9, S 8, Raw 35, Score 41, tier Promising verge, flag Orchid recorded: refer to local Wildlife Trust, confidence medium |                                                                           |                                                                                                                                       |

The agent must compute exact numbers with the code and make sure the table values above are consistent. If a number in this table disagrees with the formula, the formula wins and the agent corrects the table in this document in the same commit, noting it in the commit message.

## 10\. Calibration plan

1. Record 20 to 30 real segments with known characteristics.
2. Ask one ecologist or Wildlife Trust volunteer to rate each as ordinary, promising, or worth a visit.
3. Compare. Adjust thresholds or weights in data, bump the version string, add a changelog entry.
4. Publish the comparison in docs/METHOD.md.

## 11\. Source list (re-read and cite)

- Plantlife Good Verge Guide: [https://www.plantlife.org.uk/wp-content/uploads/2023/03/Good_verge_guide_2021.pdf](https://www.plantlife.org.uk/wp-content/uploads/2023/03/Good_verge_guide_2021.pdf)
- Plantlife Managing grassland road verges: [https://www.plantlife.org.uk/wp-content/uploads/2023/03/Managing-grassland-road-verges_2020.pdf](https://www.plantlife.org.uk/wp-content/uploads/2023/03/Managing-grassland-road-verges_2020.pdf)
- Plantlife community support page: [https://www.plantlife.org.uk/learning-resource/road-verge-and-greenspace-community-support/](https://www.plantlife.org.uk/learning-resource/road-verge-and-greenspace-community-support/)
- Wildlife Trusts, managing road verges: [https://www.wildlifetrusts.org/managing-road-verges-wildlife](https://www.wildlifetrusts.org/managing-road-verges-wildlife)
- Lincolnshire Wildlife Trust, verge management notes: [https://www.lincstrust.org.uk/what-we-do/conservation-projects/road-verges](https://www.lincstrust.org.uk/what-we-do/conservation-projects/road-verges)
- Norfolk Wildlife Trust, Roadside Nature Reserves: [https://www.norfolkwildlifetrust.org.uk/roadside-nature-reserves](https://www.norfolkwildlifetrust.org.uk/roadside-nature-reserves)
