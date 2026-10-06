# BuildWise

Construction project management workspace for planning, site execution, cost control, workforce, and handover.

BuildWise is a frontend prototype built as a real working app: projects, budgets, materials, tasks, site reports, equipment, suppliers, invoices, messages, analytics, an interactive site map, and a 3D project viewer. Demo data lives in the browser (`localStorage`) so actions stay connected — completing a task updates progress, the timeline, analytics, and the activity feed; recording an expense updates the budget.

## Run locally

Open `index.html` in a modern browser, or serve the folder:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Demo sign-in

Any listed role signs in with password `demo123`.

| Role | Email |
| --- | --- |
| Administrator | admin@buildwise.co |
| Project Manager | pm@buildwise.co |
| Site Supervisor | site@buildwise.co |
| Contractor | contractor@buildwise.co |
| Worker | worker@buildwise.co |
| Client | client@buildwise.co |

Featured project: **Modern 4-Bedroom Residence — Kericho**.

## Stack

HTML, CSS, JavaScript, Chart.js, Leaflet, Three.js, GSAP. No build step. Designed so a backend can replace the local store later.

## Publish

Static site. Enable GitHub Pages on the `main` branch (root) to host it.
