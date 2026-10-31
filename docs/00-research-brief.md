# 00 - Research Brief and Topic Decision

Working name: Verge Ledger (repo: verge-ledger). Check name and domain availability before publishing. Prepared: late October 2026. All figures below are leads taken from public pages found during research. The build agent must re-verify every figure at source before putting it in the product or README.

## 1\. What Hostinger Restore actually evaluates

Sources: the Hostinger Restore page, its FAQ, and the Google Form behind "Apply now".

Evaluation criteria stated by Hostinger:

* Potential for measurable positive environmental impact
* Fit with Hostinger's tools (AI Builder, which produces a React + Tailwind front end, a Node.js server layer, a built-in database with sign-in and file storage, and one-click publishing)
* Feasibility
* Potential to grow impact over time

Process facts:

* Rolling review, typically within one week. Selected applicants are emailed.
* Press coverage says the pilot runs to 31 March 2027. Apply early.
* You do not need a finished project. You do need to show genuine experience, expertise, involvement or interest in the environmental challenge.
* The plan must be used for the environmental project described in the application. Hostinger can withdraw it if it is used for unrelated purposes (form question 13).
* Hostinger's own example ideas are: bird sightings tracker, community biodiversity reporting app, wildlife observation log, secondhand marketplace, illegal dumping reporting app, wetland restoration platform, habitat restoration hub, invasive species reporting tool, environmental education site, environmental knowledge chatbot.

Implication: every example on that list will be submitted many times. A generic version of any of them is the weakest possible application. A specific, evidence-backed gap with a named user, a measurable output and a working prototype is the strongest.

The form asks 14 questions. The ones that decide selection are 8 (stage), 9 (project and challenge), 10 (what you will build), 11 (challenges faced), 12 (6 to 12 month milestones). Question 5 asks for a link to a website, product or prototype. A public repo plus a live demo answers it.

## 2\. Selection filters I applied to candidate topics

1. Real, documented gap, not a "nice to have".
2. Not already served by a well-funded national tool.
3. Named users who have a real decision to make.
4. Measurable output (km, sites, packs, requests), not "awareness".
5. Buildable by a coding agent in 40 to 50 meaningful commits, using free and open data, with no hardware, no paid APIs and no machine-learning dependency.
6. Fits the Hostinger AI Builder stack.
7. Ethically clean: no sensitive personal data, no encouragement of unsafe or unlawful behaviour.
8. Not on Hostinger's example list.

## 3\. Candidates considered

| Candidate | Evidence found | Verdict |
| --- | --- | --- |
| Dry chalk-stream and river-flow reporting | The Environment Agency launched BluePrint (national citizen-science reporting for rivers, February to July 2026). CrowdWater and DRYvER apps already collect flow-state reports. RiverCast publishes 14-day low-flow forecasts for chalk streams. The EA Temporary Stream Programme and the Springs and Sources dataset exist. | Rejected. Crowded, and the public sector now owns the reporting channel. |
| Biodiversity Net Gain helper for small sites | Statutory Small Sites Metric is an Excel tool. CIEEM reports 84 percent of respondents see significant small-site problems. Commercial tools such as Joe's Blooms already serve this. | Rejected. Commercial incumbents, and wrong output has legal and planning consequences. |
| Storm overflow / sewage dashboards | Annual EDM returns published as open data; heavily covered by national campaigns. I did not verify a remaining gap. | Rejected as likely crowded. |
| Bird tracker, wildlife log, illegal dumping app, invasive species form | All on Hostinger's example list. | Rejected. Highest applicant density, lowest differentiation. |
| Road verge evidence and cut-timing toolkit | See section 4. No dedicated public tool found in search. Large documented management gap. Policy decision under way in Norfolk. | Selected. |

Limit of this research: it is search-based. I could not exhaustively prove that no verge tool exists. Before applying, spend 30 minutes searching for "verge survey app", "road verge mapping tool UK", and checking Plantlife, Wildlife Trusts, iRecord and iNaturalist projects. If something close exists, position Verge Ledger as complementary and name it in the application.

## 4\. Why road verges

The facts below come from public sources. Re-verify before reuse.

Scale and value

* Road verges in Great Britain cover about 2,579 km2, roughly 1.2 percent of land area, with 27.5 percent short frequently mown grassland, 40.9 percent regular grassland, 18.7 percent woodland and 10.7 percent scrub (Landscape and Urban Planning, doi 10.1016/j.landurbplan.2021.104159).
* Plantlife states that the UK has lost about 97 percent of its wildflower meadows since the 1930s, that verges hold hundreds of wildflower species (the Wildlife Trusts say about 720), and that well-managed verges could double wildflower richness.

Management mismatch

* A UK-wide FOI investigation (Inkcap) found that among 68 councils reporting specifics, at least 35 were still cutting rural verges in May, and only 9 delayed cutting to July or later. Plantlife's Good Verge Guide recommends a first cut from mid-July to end of September with a second cut before Christmas, or a Feb/March cut then a Sept/Oct cut.
* Lincolnshire Wildlife Trust found most surveyed verges were cut too often or too infrequently, and that leaving cuttings raises soil fertility.
* Dorset Council moved to cut-and-collect, reduced mowing from about 7 cuts to 2 per year in some areas, and reports about a 45 percent mowing-cost saving within 5 years (via Plantlife). Treat as an illustrative case, not a promise.

The data gap

* The same FOI work found councils struggle to report verge area, to separate verge budgets, or to describe conservation-area management. There is no standardised public view of what is cut, when, where.
* The largest volunteer effort, Life on the Verge in Lincolnshire, used 250+ volunteers, surveyed over 3,900 km of road over 2009 to 2016 and produced 159 new Local Wildlife Sites. It took seven years and bespoke GIS. Plantlife's pages describe the method but name no reusable app.
* DeepVerge (arXiv 2206.04271) shows the research community wants verge data, but it is a model, not a tool for parish volunteers.

The decision moment (Norfolk, where the founder is based)

* Norfolk County Council currently cuts rural verges mainly for safety, with clippings left on site, and runs Roadside Nature Reserves (the page cites 224 reserves covering about 53 miles).
* A Norfolk consultation runs from 26 October 2026 to 7 December 2026 on removing one complete annual rural verge cut to save about 300,000 pounds, with visibility-splay cutting kept as a priority. Cabinet decision is expected January 2027 and Full Council February 2027.
* Verify all of this at the Citizen Space page before quoting. Even if the consultation closes before launch, it is a live example of the question every county will face: if a cut must go, which one?
* Norfolk parish councils already carry out verge cutting under county funding in some places, so parishes are real decision-makers.

## 5\. The product idea in one paragraph

Verge Ledger is an open-source, offline-first web app that lets a parish council or volunteer group do four things: (1) survey a stretch of verge in 5 minutes on a phone and get a transparent triage score; (2) get a cut-timing recommendation grounded in published guidance and a safety overlay; (3) test "which cut should we drop?" scenarios when a council proposes reducing cuts; (4) build an evidence pack and a ready-to-send FOI/EIR request so a parish can put verifiable facts in front of its highways authority. It also keeps an open registry of how each council manages verges, with sources.

It is not a species identifier, not an AI chatbot, not a bird tracker. Its core logic is deterministic, auditable and testable.

## 6\. Why this scores well against Hostinger's criteria

| Criterion | How Verge Ledger answers it |
| --- | --- |
| Measurable impact | Counters: km surveyed, segments scored, segments flagged for expert review, parish evidence packs generated, councils documented in the registry, EIR requests generated. Targets are set in the PRD. |
| Fit with Hostinger tools | React + Tailwind front end and a small Node API, matching the AI Builder stack. Static, offline-capable PWA means it can run on any plan. Domain, professional email and analytics are used directly. |
| Feasibility | Free and open data, no hardware, no paid APIs. Deterministic rules. A working prototype and tests exist before applying. |
| Growth | Same core works in every English county and, with config, in Wales, Scotland and Northern Ireland. Registry grows through crowd contributions and FOI results. Exports allow hand-off to Wildlife Trusts and biological record centres. |

## 7\. Risks and how the design handles them

| Risk | Handling |
| --- | --- |
| Score misread as an official Local Wildlife Site designation | Score is called a triage score. Tier names avoid the word "designated". Every result shows a disclaimer and a "refer to your local Wildlife Trust or record centre" call to action. Thresholds are config, versioned, and marked as needing ecologist calibration. |
| Volunteer safety on roads | Safety banner on first run and before every survey. Survey from a safe position only. No in-app prompt encourages walking on carriageways. Recommend avoiding fast roads. |
| Volunteers cutting verges they do not own | Clear copy: never cut or damage a verge without written permission from the highway authority or landowner. |
| Poaching of rare plants (orchids etc.) | Sensitive-taxon flag. Public exports coarsen location of sensitive taxa. |
| Wrong or invented data | Species list, regime guidance and council facts each carry a source URL and retrieval date. Unverifiable items are marked and listed in docs/OPEN-QUESTIONS.md. Demo data is synthetic, labelled, and never counted in impact metrics. |
| Personal data | No accounts, no emails stored in v0.1. Workspace edit key is hashed. No third-party trackers. |
| Council pushback | The tool never accuses. It states what guidance says and what a council reported, with sources. |
| Applicant overclaims | See doc 07. Only claim what is true on the day of applying. |

## 8\. Things I could not verify (resolve before applying)

1. Whether any existing public tool already does verge survey plus cut-timing plus registry. Do the 30-minute search above.
2. Exact current Norfolk cut numbers and consultation dates. Fetch the primary pages.
3. Whether the Hostinger Restore Unlimited plan supports a custom Node.js application on shared hosting. Confirm in hPanel or with support after acceptance. The design therefore keeps the API optional.
4. The AI credit numbers reported by a forum post (15 credits plus up to 60 more). That is not an official Hostinger source.
5. The ecological validity of the starter indicator list and score thresholds. Needs review by an ecologist or Wildlife Trust volunteer.

## 9\. Sources

* Hostinger Restore: [https://www.hostinger.com/hostinger-restore](https://www.hostinger.com/hostinger-restore)
* Application form: [https://docs.google.com/forms/d/e/1FAIpQLSe7L5D3TQFnMVuvA0WAvhv732mR6WE4rAlVx-bjf4sIfpm93Q/viewform](https://docs.google.com/forms/d/e/1FAIpQLSe7L5D3TQFnMVuvA0WAvhv732mR6WE4rAlVx-bjf4sIfpm93Q/viewform)
* Hostinger AI Builder overview: [https://docs.hostinger.com/ai-builder/overview](https://docs.hostinger.com/ai-builder/overview)
* Plantlife Road Verges: [https://www.plantlife.org.uk/our-work/road-verges/](https://www.plantlife.org.uk/our-work/road-verges/)
* Plantlife Good Verge Guide: [https://www.plantlife.org.uk/wp-content/uploads/2023/03/Good_verge_guide_2021.pdf](https://www.plantlife.org.uk/wp-content/uploads/2023/03/Good_verge_guide_2021.pdf)
* Plantlife, Managing grassland road verges: [https://www.plantlife.org.uk/wp-content/uploads/2023/03/Managing-grassland-road-verges_2020.pdf](https://www.plantlife.org.uk/wp-content/uploads/2023/03/Managing-grassland-road-verges_2020.pdf)
* Plantlife, Local councils and No Mow May: [https://www.plantlife.org.uk/our-work/local-councils-and-no-mow-may/](https://www.plantlife.org.uk/our-work/local-councils-and-no-mow-may/)
* Plantlife, community support page: [https://www.plantlife.org.uk/learning-resource/road-verge-and-greenspace-community-support/](https://www.plantlife.org.uk/learning-resource/road-verge-and-greenspace-community-support/)
* Inkcap FOI investigation: [https://www.inkcap.co.uk/how-is-your-local-council-managing-its-roadside-verges/](https://www.inkcap.co.uk/how-is-your-local-council-managing-its-roadside-verges/)
* Lincolnshire Wildlife Trust, Life on the Verge: [https://www.lincstrust.org.uk/what-we-do/conservation-projects/life-on-the-verge](https://www.lincstrust.org.uk/what-we-do/conservation-projects/life-on-the-verge)
* Road verge extent paper: [https://doi.org/10.1016/j.landurbplan.2021.104159](https://doi.org/10.1016/j.landurbplan.2021.104159)
* DeepVerge: [https://ar5iv.labs.arxiv.org/html/2206.04271](https://ar5iv.labs.arxiv.org/html/2206.04271)
* Norfolk County Council verges page: [https://www.norfolk.gov.uk/article/39676/Trees-hedges-and-grass-verges](https://www.norfolk.gov.uk/article/39676/Trees-hedges-and-grass-verges)
* Norfolk consultation: [https://norfolk.citizenspace.com/consultation/proposal-to-reduce-highway-verge-grass-cutting/consult_view/](https://norfolk.citizenspace.com/consultation/proposal-to-reduce-highway-verge-grass-cutting/consult_view/)
* Norfolk Wildlife Trust, Roadside Nature Reserves: [https://www.norfolkwildlifetrust.org.uk/roadside-nature-reserves](https://www.norfolkwildlifetrust.org.uk/roadside-nature-reserves)
* The Wildlife Trusts, Managing road verges for wildlife: [https://www.wildlifetrusts.org/managing-road-verges-wildlife](https://www.wildlifetrusts.org/managing-road-verges-wildlife)
* EA BluePrint (reason rivers were rejected): [https://environmentagency.blog.gov.uk/2026/02/17/launching-blueprint-expanding-citizen-science-across-englands-waterways/](https://environmentagency.blog.gov.uk/2026/02/17/launching-blueprint-expanding-citizen-science-across-englands-waterways/)
* CIEEM BNG for small sites (reason BNG was rejected): [https://cieem.net/resource/biodiversity-net-gain-for-small-sites/](https://cieem.net/resource/biodiversity-net-gain-for-small-sites/)
* CrowdWater data-ethics lessons: [https://doi.org/10.5334/cstp.749](https://doi.org/10.5334/cstp.749)