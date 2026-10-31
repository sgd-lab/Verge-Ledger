# Method and Rules: Scoring, Advice, and Simulation

**Scoring Version**: `verge-triage-v1`  
**Advice Version**: `verge-advice-v1`  

---

## 1. Principles of the Verge Triage Engine

1. **Triage, Not Ecological Designation**: The score is a volunteer decision aid to prioritize stretches for expert survey. It does not replace a National Vegetation Classification (NVC) or Local Wildlife Site (LWS) assessment.
2. **Deterministic and Transparent**: Pure function with zero floating-point ambiguities; every awarded point or penalty is explained in plain English.
3. **Conservative Overrides**: When evidence is thin or orchids are present, conservative rules prevent premature dismissal of biodiversity value.
4. **Safety as a Paramount Constraint**: Highway visibility splays and junction sightlines are non-negotiable overlays.

---

## 2. Scoring Algorithm (`verge-triage-v1`)

The triage score calculates a composite 0–100 score from four components:

Raw = R + I + S  (Max 85)
Score = clamp(round(100 * Raw / 85) - N, 0, 100)

### Component 1: Forb Richness Sub-Score R (0 <= R <= 40)
Count of distinct flowering wildflower species (excluding grasses) in a representative 10-metre stretch:

| Forb Count Band | Points R |
| --- | --- |
| `0` | 0 |
| `1_2` | 8 |
| `3_5` | 18 |
| `6_9` | 28 |
| `10_14` | 35 |
| `15plus` | 40 |

### Component 2: Indicator Species Sub-Score I (0 <= I <= 30)
Sum of weights w_i in {1, 2, 3} for all distinct positive indicators recorded:

I = round(30 * min(sum(w_i), 10) / 10)

### Component 3: Sward Structure Sub-Score S (0 <= S <= 15)
Structural heterogeneity of the vegetation canopy:

| Sward Structure | Points S | Description |
| --- | --- | --- |
| `medium_mixed` | 15 | Mixed heights with open patches allowing seedling germination |
| `short_uniform` | 8 | Closely mown or amenity turf |
| `tall_rank` | 3 | Overgrown vegetation with heavy thatch suppressing delicate forbs |

### Component 4: Nutrient Penalty N (0 <= N <= 20)
Penalty deducted for dominant nutrient-enrichment species:

N = min(20, 7 * count(dominant nutrient species))

---

## 3. Tiers, Overrides, and Confidence Ratings

### Tier Definitions
- **Ordinary verge** (0 <= Score <= 29): Low floral diversity or rank dominance. Suitable for basic conservation enhancement.
- **Promising verge** (30 <= Score <= 59): Moderate diversity or presence of positive indicators. High potential for meadow restoration with late-cut regime.
- **Refer for expert review** (60 <= Score <= 100): High botanical richness or indicator count. Strongly recommended for Wildlife Trust or county ecologist evaluation.

### Mandatory Overrides
1. **Orchid Rule**: If any indicator belonging to the orchid family (`group: "orchid"`) is recorded and Score < 60, the tier is automatically raised to at least **Promising verge**, and the flag `"Orchid recorded: refer to local Wildlife Trust"` is appended.
2. **Zero Forb Rule**: If `forbCountBand` is `0` and no positive indicators are ticked, the tier is forced to **Ordinary verge**, irrespective of sward structure points.
3. **Confidence Rating**:
   - `low`: Recorded when no indicators are ticked and `forbCountBand` is `1_2` or `0`.
   - `medium`: Recorded for all other valid observations.
   - *Note: Confidence is never rated `high` in v0.1.0 heuristics.*

---

## 4. Management Flags

- `CUTTINGS_LEFT`: Triggered if cuttings are left on the verge. Cuttings raise soil nitrogen and favor coarse grasses.
- `MAY_JUNE_CUT`: Triggered if last cut occurred in May or June. Eliminates flowering heads and prevents seed dispersal.
- `RANK_GROWTH`: Triggered if `swardStructure` is `tall_rank` and either cuttings were left or the verge is uncut. Thatch accumulation suffocates smaller perennials.
- `NO_FLAGS`: Normal management profile.

---

## 5. Mandatory Scoring Disclaimer (SCO-4)

The following disclaimer must appear verbatim on all score breakdown views, evidence packs, and export documents:

> *"This is a quick volunteer triage, not an ecological survey or a Local Wildlife Site assessment. Scores use simple rules that have not yet been reviewed by an ecologist. If a verge scores highly or you recorded an orchid, ask your local Wildlife Trust or biological record centre to check it."*

---

## 6. Golden Test Fixtures (Unit Verification)

The scoring engine implementation in `packages/core` must strictly reproduce the following golden test fixtures (`03 - Method and Rules` § 9):

| Fixture | Inputs | Intermediate Calculations | Expected Result |
| --- | --- | --- | --- |
| **A** | `forb: 0`, `indicators: none`, `short_uniform`, `no nutrient` | R=0, I=0, S=8 => Raw=8, Base=9, N=0 | **Score 9**, Ordinary verge, confidence low |
| **B** | `forb: 6_9`, two weight-2 indicators (sum=4), `medium_mixed`, `no nutrient` | R=28, I=12, S=15 => Raw=55, Base=65, N=0 | **Score 65**, Refer for expert review, confidence medium |
| **C** | `forb: 10_14`, indicators sum=6, `medium_mixed`, 2 nutrient dominants | R=35, I=18, S=15 => Raw=68, Base=80, N=14 | **Score 66**, Refer for expert review |
| **D** | `forb: 3_5`, indicators sum=1, `tall_rank`, cuttings left, 1 nutrient dominant | R=18, I=3, S=3 => Raw=24, Base=28, N=7 | **Score 21**, Ordinary verge, flags `CUTTINGS_LEFT`, `RANK_GROWTH` |
| **E** | `forb: 3_5`, one orchid (weight 3), `short_uniform`, `no nutrient` | R=18, I=9, S=8 => Raw=35, Base=41, N=0 | **Score 41**, Promising verge (Orchid override), flag Orchid recorded |

---

## 7. Calibration Roadmap

1. Record 20 to 30 real roadside verge segments across different soil substrates in England.
2. Engage a Wildlife Trust botanist or county ecologist to conduct paired independent surveys.
3. Compare triage tiers against professional assessments and adjust weighting constants in `packages/data/indicators.json`.
4. Publish calibration results in subsequent releases.
