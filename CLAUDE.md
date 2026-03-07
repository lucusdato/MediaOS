# MediaOS

End-to-end campaign management platform built on the **Make.Mine.Manage** framework for Initiative Canada.

## How to Use This File

This file exists to steer you away from mistakes and encode business logic you cannot infer from code. It is NOT a codebase description — you can read the code yourself.

**Keep this file lean.** If something is discoverable from package.json, file structure, or code comments, it does not belong here. Every line in this file biases your behavior — only include what earns that influence.

**If you encounter something in this project that surprises you or seems confusing, flag it to Lucus immediately.** Describe what confused you and suggest whether it should be fixed in the codebase or documented here. Do not silently work around confusion.

## Architecture Decisions (Not Inferable)

- **Target stack**: Next.js monolith (React frontend + API routes) — NOT the Vite prototype
- `Pencil Design Code/` is the design reference prototype only — port components to Next.js, never build production features there
- **Database**: PostgreSQL — required for ACID transactions on blocking chart revisions. Do not suggest NoSQL
- **Auth**: Simple JWT + local users (Phase 0); Microsoft Entra ID (Phase 2+)
- **Hosting**: Self-hosted Ubuntu VPS, PM2, Nginx — <200 users, no cloud infrastructure needed
- **Fonts**: League Gothic (headings), Aldine721 BT (body) — loaded from `/fonts/` in public dir

## Existing Tools — Do Not Rebuild

MediaOS orchestrates these Lucus-built tools. Ask for specs/links before integrating any of them:
- **Brief Parser Skill** — Claude API brief ingestion
- **DAB to RFP Tool** — Creative brief parsing to Initiative RFP template
- **Traffic Sheet Creator** — Fixed Excel templates that vary by channel type (digital, social, etc.)
- **Taxonomy Tool** — Hybrid: auto-fills from blocking chart + user manual confirmation
- **Post-Reporting Skill** — Template not finalized. Do not build rigid post-report formatting until Lucus confirms

## Business Logic (Critical — Cannot Be Inferred)

### Blocking Chart Lifecycle

A blocking chart is **never locked**. Do not build lock/unlock states.

1. Planner sends DAB form RFP to Kinesso **through MediaOS**
2. Kinesso submits DAB activation response **through a built-in MediaOS tool**
3. Planner or supervisor reviews → approves or provides feedback **as comments within MediaOS**
4. If revisions needed → back-and-forth inside MediaOS → Kinesso resubmits → repeat until approved
5. Approved DAB data flows into blocking chart
6. Client presentation can trigger new revision cycles (back to step 3)
7. During execution, blocking chart must always match Prisma — still subject to change
8. During reporting/reconciliation, values get **actualized** (plan vs. actual)
9. **Only when campaign is fully completed AND reconciliation is fully done** is the chart considered final

### MediaOS ↔ Asana Sync

Every action in MediaOS must reflect in Asana. MediaOS is where work happens. Asana is the tracking/audit system. Both must stay in sync.
- DAB submissions, revision comments, approvals, status changes → all create/update Asana tasks and comments
- Reads from specific **Asana portfolios** with the same template structure for every campaign
- **If you're building a MediaOS workflow, ask Lucus how it maps to Asana before implementing**

### Roles

Four roles only:
- **Admin** — Lucus. Full access + product analytics (usage tracking, friction identification)
- **Planner** — Primary users. The tool is built to accelerate planner workflow first
- **Kinesso/Activation** — Small group for Phase 0. Submits/receives DAB forms, iterates with planners
- **Finance** — Reconciliation, invoice verification, payment tracking

All roles can see everything (blocking chart, reconciliation, budgets). Do not add or rename roles without Lucus confirming.

**Analytics:** Per-user tracking tied to roles. Phase 0 focus is overall workflow bottlenecks, not per-role breakdowns.

## API Key / Security (Non-Negotiable)

- API keys ONLY in server-side env vars (`.env.local`). Verify `.env*` is in `.gitignore` before any git operation
- Keys must NEVER appear in client-side code, browser bundles, or inspectable network responses
- All Claude API calls go through Next.js API routes — never from the frontend
- Before every commit, verify no secrets are staged
- **Flag to Lucus before building any feature that adds API-consuming users** — rate limiting will be needed

## Never Assume — Always Ask

This platform mirrors real-world media planning workflows. Wrong assumptions bleed into how end users work, causing delays and inaccurate outputs.

- **Workflow and business logic** — if you don't know how a step connects to the next, ask before building
- **Field names, validation rules, data formats** — media planning has specific terminology, get confirmation
- **Export formats and templates** — must match exact downstream expectations. Ask first
- **Budget logic and constraint enforcement** — these are financial, errors have real consequences
- **External system mappings** (Asana portfolios, taxonomy codes, Prisma fields) — ask for schemas
- **UI copy and labels** — Make.Mine.Manage has specific language, confirm with Lucus
- **When in doubt, stop and ask.** A 30-second question prevents hours of rework

## Phase 0 Scope

Build for the Foods & Wellness pilot:
1. Blocking chart CRUD with versioning + approval workflow
2. Kinesso budget minimum enforcement
3. Asana integration (webhook, read-only cycle time tracking)
4. Excel + MediaTools Guidelines exports
5. Role-based access (Admin, Planner, Kinesso/Activation, Finance)
6. Traffic sheet live input link with validation
7. Post-reporting (manual Tableau export → AI-enhanced Excel)
8. Reconciliation dashboard (blocking chart ↔ Prisma invoice matching)
9. Product analytics layer (time tracking, friction identification)

**Not Phase 0:** Broadcast post-reporting, Interact Design Console API, Tableau automation, historical backfill, Entra ID, advanced reporting templates.

## Maintaining This File

- If a rule here becomes outdated because the codebase changed, **delete it**. Stale instructions cause wrong behavior
- Do not add info that's discoverable from code. If you find yourself wanting to document file structure, dependency versions, or command syntax — put it in the code instead
- Every entry should answer: "Would the agent consistently get this wrong without being told?" If no, remove it
