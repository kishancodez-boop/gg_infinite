# GreenGrid India — Hackathon Explanation Notes for Students

## 1. One-minute project explanation
GreenGrid India is a renewable energy information and opportunity platform for India. Renewable energy information is spread across many government portals, regulators, state agencies, finance providers and job websites. Citizens struggle to estimate rooftop solar costs and savings; energy teams need RPO information; policymakers need consolidated visibility; financiers need to discover green finance products; and job seekers need green career opportunities.

Our application brings these information categories into one place, provides a solar ROI calculator, displays energy indicators, and uses a controlled REA (Reverse Engineering Agent) ingestion workflow to collect permitted information from approved sources. Every imported record should show where it came from and when it was checked.

## 2. What problem are we solving?
The problem is information fragmentation, not a lack of renewable energy technology. Users must visit many different sites, interpret different formats and manually compare information. GreenGrid India reduces that effort by organizing information in a common interface with search, filters, calculations and source traceability.

## 3. Stakeholders and value
| Stakeholder | Current difficulty | GreenGrid value |
|---|---|---|
| Citizens | Unsure about solar cost, savings and schemes | Solar ROI calculator and scheme discovery |
| DISCOMs / energy teams | RPO information is distributed | RPO information and comparison views |
| Policymakers | Data is spread across sources | National energy dashboard |
| Financiers | Green finance products are hard to discover | Finance directory |
| Job seekers | Green career opportunities are scattered | Green jobs directory |

## 4. How the application works
1. A user opens the React web application.
2. React requests data from the Node.js/Express API.
3. Express validates the request and reads/writes records in MongoDB through Mongoose.
4. The API returns structured JSON to React.
5. React displays cards, tables, filters, charts and calculator results.
6. REA is a separate controlled ingestion workflow. It fetches data only from approved, permitted sources, parses and normalizes it, validates fields, removes duplicates, records provenance and sends uncertain records to a human review queue.
7. Approved data is stored in MongoDB and becomes available to the frontend.

## 5. Technology explanation for judges
- React: builds the interactive user interface.
- TypeScript: catches many coding mistakes before runtime and makes data structures clearer.
- Tailwind CSS: provides consistent responsive styling.
- Framer Motion: adds subtle UI transitions.
- Recharts: displays energy trends and comparisons.
- Node.js: runs the backend JavaScript environment.
- Express: defines API endpoints and middleware.
- MongoDB: stores energy metrics, schemes, policies, finance opportunities, jobs, sources and ingestion logs.
- Mongoose: defines MongoDB models, validation and indexes.
- Zod: validates API inputs and extracted data.
- Playwright: automates important browser journeys.
- REA: the controlled source-ingestion assistant that reduces manual data collection while preserving source traceability.

## 6. What is REA?
REA means Reverse Engineering Agent in this project. It is not a tool to copy entire websites. It is a controlled ingestion workflow:
Source Registry -> Permission Check -> Fetch -> Parse -> Normalize -> Validate -> Deduplicate -> Human Review -> Publish -> Audit.

Example:
- An administrator registers an official public dataset and records its permitted access method.
- REA downloads the approved CSV/API response.
- The parser extracts only the fields GreenGrid needs.
- The normalizer converts values into the application's standard schema.
- Validation checks required fields and data types.
- Deduplication prevents repeated records.
- Provenance records the source URL and retrieval time.
- A reviewer approves uncertain or important records.
- Approved records are saved to MongoDB and displayed in the dashboard.

The system must respect source terms, robots rules, rate limits, copyright and access controls. It must not bypass CAPTCHA, login, paywalls or other restrictions.

## 7. Why memory.md and skill.md?
- `memory.md` is the project's shared memory: what the product is, who it serves, the modules, selected technology and design/data rules.
- `skill.md` is the agent's working manual: how to inspect, plan, code, secure, test and report work.
- `FINAL_MASTER_PROMPT.md` is the single instruction students paste into their coding agent. It tells the agent to read both files, inspect the project, teach beginners and implement one milestone at a time.

Keep all three in the repository root. Do not paste different or contradictory product definitions into every new chat.

## 8. Recommended hackathon demo flow
1. Start at the landing page and explain the fragmentation problem.
2. Open the national dashboard and show one or two sourced indicators. Point out the source and last-checked date.
3. Open Policies & Schemes and search/filter by state or category.
4. Open Solar ROI, enter sample household consumption and tariff, and explain that the result is an estimate based on displayed assumptions.
5. Open the REA admin view and demonstrate one permitted source ingestion in dry-run mode, then show validation/provenance/review.
6. If time permits, show finance, jobs and RPO modules.
7. Close with the impact: one place to discover trusted renewable energy information, compare opportunities and understand solar economics.

## 9. Suggested hackathon MVP
Prioritize a complete, credible demonstration:
- Responsive dashboard
- Policies and schemes explorer
- Solar ROI calculator
- One REA ingestion pilot using an approved public dataset
- Source attribution and last-verified timestamps

Add Finance, Jobs and RPO only as time and trustworthy data availability permit. A working end-to-end journey is stronger than six unfinished modules.

## 10. Questions judges may ask
**Q: What is innovative?**
A: We combine fragmented renewable-energy information with a source-aware ingestion workflow, a citizen-facing solar ROI calculator and stakeholder-specific discovery modules.

**Q: How do you ensure data is trustworthy?**
A: Each imported record carries source provenance, retrieval time, verification status and, where needed, human review. We distinguish estimates and demo data from verified facts.

**Q: Does REA scrape any website?**
A: No. It uses approved sources and permitted access methods, prioritizing official APIs and downloadable datasets. It respects website terms, robots rules and rate limits.

**Q: Are solar savings guaranteed?**
A: No. The calculator is an estimate. It shows the assumptions and inputs, and actual results depend on system design, tariffs, weather, usage and applicable policy.

**Q: Is RPO compliance officially certified by this app?**
A: No. The app can present sourced information and transparent calculations. It does not replace official regulatory determinations.

**Q: Why MERN?**
A: It lets the team use JavaScript/TypeScript across frontend and backend, build APIs quickly and store flexible source records and opportunity data in MongoDB.

## 11. Important honesty points
- Never label sample data as live data.
- Never claim nationwide real-time coverage if only one source has been integrated.
- Never invent source links, government schemes, subsidy values, job listings or finance terms.
- Show the date and source for every factual dataset.
- Explain limitations clearly; honest scope increases credibility.
