# Data Sources, Licensing, and Provenance

**Version**: 0.1.0  
**Effective Date**: 2026-10-31

Verge Ledger maintains a strict **"No Invented Facts"** standard: every indicator species, guidance statement, and council fact must have a primary source URL and a verified retrieval timestamp.

---

## 1. Indicator Species Dataset (`packages/data/indicators.json`)

The curated indicator dataset contains plant species observable along roadside verges in England. It is validated against the JSON Schema at `packages/core/schemas/indicator-species.schema.json`.

### Weighting Rationale (Provisional Heuristic)

Species weights (1 to 3) represent botanical indicative value for grassland conservation status:

- **Weight 1 (General Indicator)**: Common wildflower species indicating non-intensive management (e.g., Bird's-foot Trefoil _Lotus corniculatus_, Oxeye Daisy _Leucanthemum vulgare_).
- **Weight 2 (Selective Indicator)**: Species characteristic of established, unimproved neutral or calcareous grassland (e.g., Common Knapweed _Centaurea nigra_, Lady's Bedstraw _Galium verum_, Meadow Vetchling _Lathyrus pratensis_).
- **Weight 3 (Strongly Selective Indicator)**: Highly sensitive or slow-colonizing grassland species (e.g., Yellow Rattle _Rhinanthus minor_, Cowslip _Primula veris_, Field Scabious _Knautia arvensis_).
- **Weight 0 (Nutrient-Enrichment Dominants)**: Competitive, nutrient-loving species that suppress diversity when dominant (e.g., Stinging Nettle _Urtica dioica_, Cow Parsley _Anthriscus sylvestris_, Broad-leaved Dock _Rumex obtusifolius_, Cleavers _Galium aparine_).

### Review Status

In v0.1.0, all entries default to `reviewStatus: "needs_expert_review"` until an ecologist or Wildlife Trust botanist formally validates the list.

### Botanical Source Citations

- Botanical Society of Britain and Ireland (BSBI) Plant Atlas 2020: [https://plantatlas2020.org/](https://plantatlas2020.org/)
- Plantlife Grassland Indicator Guides: [https://www.plantlife.org.uk/](https://www.plantlife.org.uk/)

---

## 2. Cut-Regime Guidance (`packages/data/regimes.json`)

Cut-regime recommendations (R1, RA, RB, RU) are drawn directly from published grassland management guidance:

| Regime ID | Regime Name          | Timing Window                       | Published Basis                                                                                    |
| --------- | -------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| **R1**    | Single Late Cut      | August to end of September          | Plantlife _Good Verge Guide_ (2021), p. 6. Recommended where resources permit only one annual cut. |
| **RA**    | Meadow Pattern A     | Cut 1: Mid-July–Sep; Cut 2: Oct–Dec | Plantlife _Managing Grassland Road Verges_ (2020), p. 12. Traditional hay meadow cycle.            |
| **RB**    | Meadow Pattern B     | Cut 1: Feb–Mar; Cut 2: Sep–Oct      | Plantlife _Managing Grassland Road Verges_ (2020), p. 14. Protects nesting birds and late flora.   |
| **RU**    | Urban Flowering Lawn | Every 6 to 8 weeks (3–6 cm)         | Plantlife _Community Support Guidance_ (2021). Amenity areas supporting low-growing forbs.         |

---

## 3. Council Registry Facts (`packages/data/councils.json`)

The council registry lists English highway authorities (County Councils and Unitary Authorities) and parish data.

- **Verification Requirement**: Every record includes `sourceUrl` and `sourceRetrievedAt` pointing to a primary council web page, highways contract, or published committee report.
- **Status Meanings**:
  - `verified`: Fact checked against an official council source by maintainers.
  - `unverified`: Fact submitted via community contribution queue awaiting maintainer review.

---

## 4. Licenses Table

| Component / Asset             | Licence          | Attribution / Copyright Statement                                                                                            |
| ----------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Application Code              | MIT              | Copyright (c) 2026 Verge Ledger Contributors                                                                                 |
| Documentation & Original Data | CC BY 4.0        | Creative Commons Attribution 4.0 International                                                                               |
| Plant Species Nomenclature    | Open Data        | Derived from BSBI taxon standards                                                                                            |
| Map Tiles (CartoDB / OSM)     | CC BY 3.0 / ODbL | &copy; [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, &copy; [CARTO](https://carto.com/attributions) |

---

## 5. Demonstration Data Statement

The demo workspace (`isDemo: true`) contains synthetic survey data representing golden fixtures A through E. All demo segments and packs are stamped with a persistent `DEMO DATA` watermark and are strictly excluded from council impact counters and export metrics (`DEM-1`, `IMP-2`).
