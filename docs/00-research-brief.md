# 00 - Research Brief and Topic Decision

Working name: Verge Ledger (repo: verge-ledger). Check name and domain availability before publishing. Prepared: late October 2026. All figures below are leads taken from public pages found during research. The build agent must re-verify every figure at source before putting it in the product or README.

## 1. Selection filters I applied to candidate topics

1. Real, documented gap, not a "nice to have".
2. Not already served by a well-funded national tool.
3. Named users who have a real decision to make.
4. Measurable output (km, sites, packs, requests), not "awareness".
5. Buildable by a coding agent in 40 to 50 meaningful commits, using free and open data, with no hardware, no paid APIs and no machine-learning dependency.
6. Fits a boring, portable stack (React, Tailwind, Node) with no paid services.
7. Ethically clean: no sensitive personal data, no encouragement of unsafe or unlawful behaviour.
8. Not a generic example idea submitted many times over.

## 2. Candidates considered

| Candidate                                                              | Evidence found                                                                                                                                                                                                                                                                                                                 | Verdict                                                                                |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Dry chalk-stream and river-flow reporting                              | The Environment Agency launched BluePrint (national citizen-science reporting for rivers, February to July 2026). CrowdWater and DRYvER apps already collect flow-state reports. RiverCast publishes 14-day low-flow forecasts for chalk streams. The EA Temporary Stream Programme and the Springs and Sources dataset exist. | Rejected. Crowded, and the public sector now owns the reporting channel.               |
| Biodiversity Net Gain helper for small sites                           | Statutory Small Sites Metric is an Excel tool. CIEEM reports 84 percent of respondents see significant small-site problems. Commercial tools such as Joe's Blooms already serve this.                                                                                                                                          | Rejected. Commercial incumbents, and wrong output has legal and planning consequences. |
| Storm overflow / sewage dashboards                                     | Annual EDM returns published as open data; heavily covered by national campaigns. I did not verify a remaining gap.                                                                                                                                                                                                            | Rejected as likely crowded.                                                            |
| Bird tracker, wildlife log, illegal dumping app, invasive species form | Generic example ideas.                                                                                                                                                                                                                                                                                               | Rejected. Generic, lowest differentiation.                           |
| Road verge evidence and cut-timing toolkit                             | See section 4. No dedicated public tool found in search. Large documented management gap. Policy decision under way in Norfolk.                                                                                                                                                                                                | Selected.                                                                              |

Limit of this research: it is search-based. I could not exhaustively prove that no verge tool exists. Before relying on this, spend 30 minutes searching for "verge survey app", "road verge mapping tool UK", and checking Plantlife, Wildlife Trusts, iRecord and iNaturalist projects. If something close exists, position Verge Ledger as complementary and name it.

## 3. Why road verges

The facts below come from public sources. Re-verify before reuse.

Scale and value

- Road verges in Great Britain cover about 2,579 km2, roughly 1.2 percent of land area, with 27.5 percent short frequently mown grassland, 40.9 percent regular grassland, 18.7 percent woodland and 10.7 percent scrub (Landscape and Urban Planning, doi 10.1016/j.landurbplan.2021.104159).
- Plantlife states that the UK has lost about 97 percent of its wildflower meadows since the 1930s, that verges hold hundreds of wildflower species (the Wildlife Trusts say about 720), and that well-managed verges could double wildflower richness.

Management mismatch

- A UK-wide FOI investigation (Inkcap) found that among 68 councils reporting specifics, at least 35 were still cutting rural verges in May, and only 9 delayed cutting to July or later. Plantlife's Good Verge Guide recommends a first cut from mid-July to end of September with a second cut before Christmas, or a Feb/March cut then a Sept/Oct cut.
- Lincolnshire Wildlife Trust found most surveyed verges were cut too often or too infrequently, and that leaving cuttings raises soil fertility.
- Dorset Council moved to cut-and-collect, reduced mowing from about 7 cuts to 2 per year in some areas, and reports about a 45 percent mowing-cost saving within 5 years (via Plantlife). Treat as an illustrative case, not a promise.

The data gap

- The same FOI work found councils struggle to report verge area, to separate verge budgets, or to describe conservation-area management. There is no standardised public view of what is cut, when, where.
- The largest volunteer effort, Life on the Verge in Lincolnshire, used 250+ volunteers, surveyed over 3,900 km of road over 2009 to 2016 and produced 159 new Local Wildlife Sites. It took seven years and bespoke GIS. Plantlife's pages describe the method but name no reusable app.
- DeepVerge (arXiv 2206.04271) shows the research community wants verge data, but it is a model, not a tool for parish volunteers.

The decision moment (Norfolk, where the founder is based)

- Norfolk County Council currently cuts rural verges mainly for safety, with clippings left on site, and runs Roadside Nature Reserves (the page cites 224 reserves covering about 53 miles).
- A Norfolk consultation runs from 26 October 2026 to 7 December 2026 on removing one complete annual rural verge cut to save about 300,000 pounds, with visibility-splay cutting kept as a priority. Cabinet decision is expected January 2027 and Full Council February 2027.
- Verify all of this at the Citizen Space page before quoting. Even if the consultation closes before launch, it is a live example of the question every county will face: if a cut must go, which one?
- Norfolk parish councils already carry out verge cutting under county funding in some places, so parishes are real decision-makers.

## 4. The product idea in one paragraph

Verge Ledger is an open-source, offline-first web app that lets a parish council or volunteer group do four things: (1) survey a stretch of verge in 5 minutes on a phone and get a transparent triage score; (2) get a cut-timing recommendation grounded in published guidance and a safety overlay; (3) test "which cut should we drop?" scenarios when a council proposes reducing cuts; (4) build an evidence pack and a ready-to-send FOI/EIR request so a parish can put verifiable facts in front of its highways authority. It also keeps an open registry of how each council manages verges, with sources.

It is not a species identifier, not an AI chatbot, not a bird tracker. Its core logic is deterministic, auditable and testable.

## 5. Risks and how the design handles them

| Risk                                                         | Handling                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Score misread as an official Local Wildlife Site designation | Score is called a triage score. Tier names avoid the word "designated". Every result shows a disclaimer and a "refer to your local Wildlife Trust or record centre" call to action. Thresholds are config, versioned, and marked as needing ecologist calibration. |
| Volunteer safety on roads                                    | Safety banner on first run and before every survey. Survey from a safe position only. No in-app prompt encourages walking on carriageways. Recommend avoiding fast roads.                                                                                          |
| Volunteers cutting verges they do not own                    | Clear copy: never cut or damage a verge without written permission from the highway authority or landowner.                                                                                                                                                        |
| Poaching of rare plants (orchids etc.)                       | Sensitive-taxon flag. Public exports coarsen location of sensitive taxa.                                                                                                                                                                                           |
| Wrong or invented data                                       | Species list, regime guidance and council facts each carry a source URL and retrieval date. Unverifiable items are marked and listed in docs/OPEN-QUESTIONS.md. Demo data is synthetic, labelled, and never counted in impact metrics.                             |
| Personal data                                                | No accounts, no emails stored in v0.1. Workspace edit key is hashed. No third-party trackers.                                                                                                                                                                      |
| Council pushback                                             | The tool never accuses. It states what guidance says and what a council reported, with sources.                                                                                                                                                                    |
| Applicant overclaims                                         | See doc 07. Only claim what is true on the day of applying.                                                                                                                                                                                                        |

## 6. Things I could not verify

1. Whether any existing public tool already does verge survey plus cut-timing plus registry. Do the 30-minute search above.
2. Exact current Norfolk cut numbers and consultation dates. Fetch the primary pages.
3. The ecological validity of the starter indicator list and score thresholds. Needs review by an ecologist or Wildlife Trust volunteer.

## 7. Sources

- Application form: [https://docs.google.com/forms/d/e/1FAIpQLSe7L5D3TQFnMVuvA0WAvhv732mR6WE4rAlVx-bjf4sIfpm93Q/viewform](https://docs.google.com/forms/d/e/1FAIpQLSe7L5D3TQFnMVuvA0WAvhv732mR6WE4rAlVx-bjf4sIfpm93Q/viewform)
- Plantlife Road Verges: [https://www.plantlife.org.uk/our-work/road-verges/](https://www.plantlife.org.uk/our-work/road-verges/)
- Plantlife Good Verge Guide: [https://www.plantlife.org.uk/wp-content/uploads/2023/03/Good_verge_guide_2021.pdf](https://www.plantlife.org.uk/wp-content/uploads/2023/03/Good_verge_guide_2021.pdf)
- Plantlife, Managing grassland road verges: [https://www.plantlife.org.uk/wp-content/uploads/2023/03/Managing-grassland-road-verges_2020.pdf](https://www.plantlife.org.uk/wp-content/uploads/2023/03/Managing-grassland-road-verges_2020.pdf)
- Plantlife, Local councils and No Mow May: [https://www.plantlife.org.uk/our-work/local-councils-and-no-mow-may/](https://www.plantlife.org.uk/our-work/local-councils-and-no-mow-may/)
- Plantlife, community support page: [https://www.plantlife.org.uk/learning-resource/road-verge-and-greenspace-community-support/](https://www.plantlife.org.uk/learning-resource/road-verge-and-greenspace-community-support/)
- Inkcap FOI investigation: [https://www.inkcap.co.uk/how-is-your-local-council-managing-its-roadside-verges/](https://www.inkcap.co.uk/how-is-your-local-council-managing-its-roadside-verges/)
- Lincolnshire Wildlife Trust, Life on the Verge: [https://www.lincstrust.org.uk/what-we-do/conservation-projects/life-on-the-verge](https://www.lincstrust.org.uk/what-we-do/conservation-projects/life-on-the-verge)
- Road verge extent paper: [https://doi.org/10.1016/j.landurbplan.2021.104159](https://doi.org/10.1016/j.landurbplan.2021.104159)
- DeepVerge: [https://ar5iv.labs.arxiv.org/html/2206.04271](https://ar5iv.labs.arxiv.org/html/2206.04271)
- Norfolk County Council verges page: [https://www.norfolk.gov.uk/article/39676/Trees-hedges-and-grass-verges](https://www.norfolk.gov.uk/article/39676/Trees-hedges-and-grass-verges)
- Norfolk consultation: [https://norfolk.citizenspace.com/consultation/proposal-to-reduce-highway-verge-grass-cutting/consult_view/](https://norfolk.citizenspace.com/consultation/proposal-to-reduce-highway-verge-grass-cutting/consult_view/)
- Norfolk Wildlife Trust, Roadside Nature Reserves: [https://www.norfolkwildlifetrust.org.uk/roadside-nature-reserves](https://www.norfolkwildlifetrust.org.uk/roadside-nature-reserves)
- The Wildlife Trusts, Managing road verges for wildlife: [https://www.wildlifetrusts.org/managing-road-verges-wildlife](https://www.wildlifetrusts.org/managing-road-verges-wildlife)
- EA BluePrint (reason rivers were rejected): [https://environmentagency.blog.gov.uk/2026/02/17/launching-blueprint-expanding-citizen-science-across-englands-waterways/](https://environmentagency.blog.gov.uk/2026/02/17/launching-blueprint-expanding-citizen-science-across-englands-waterways/)
- CIEEM BNG for small sites (reason BNG was rejected): [https://cieem.net/resource/biodiversity-net-gain-for-small-sites/](https://cieem.net/resource/biodiversity-net-gain-for-small-sites/)
- CrowdWater data-ethics lessons: [https://doi.org/10.5334/cstp.749](https://doi.org/10.5334/cstp.749)
