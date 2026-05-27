# 📉 FinOptic — Automated AWS Cost Optimization Engine

> Upload any AWS Cost & Usage Report (or run a simulation) and get a ranked list of cloud waste — idle compute, orphaned storage, and unused GPU instances — in seconds.

---

## What it does

FinOptic parses your AWS CUR CSV, detects three categories of cloud waste, and generates an AI-written optimization report with actionable CLI commands you can run today.

| Leak type | Detection method |
|---|---|
| **Underutilized compute** | CPU utilization < 5% on instances costing > $144/mo |
| **Orphaned storage** | EBS volumes in `available` state (not attached to any instance) |
| **Wasteful GPU** | p3/p4/g4/g5 instances with 0% GPU utilization |

---

## Features

- **Fuzzy column matching** — works with standard AWS CUR exports, exports from third-party tools, or any generic CSV with a cost column
- **Template-string fallback** — `{{cost}}`, `${amount}`, `N/A`, and `$0` all resolve to a conservative `$0.20/hr` default rate
- **Simulated utilization** — deterministic CPU/GPU distribution when no utilization data is present (~30% of instances land in the idle bucket)
- **Type inference** — scans all column values and resource IDs for GPU / storage / compute keywords when no explicit product family column exists
- **AI audit report** — one-click narrative report with executive summary, per-leak savings table, CLI remediation commands, and architectural recommendations
- **Emergency fallback** — if the CSV is completely unrecognizable, a synthetic dataset is built from the row count so you always get a result

---

## Stack

- **Frontend** — React 19, Vite 7, Tailwind CSS 4, Inter font
- **Backend** — Express 5, TypeScript, Zod validation
- **Design** — Matte black `#0B0B0F`, ultra-thin borders, pure-SVG charts (no charting library)
- **API contract** — OpenAPI 3.1 spec → Orval codegen (React Query hooks + Zod schemas)

---

## Quick start

```bash
# Install dependencies
pnpm install

# Start the API server (port 8080, proxied at /api)
pnpm --filter @workspace/api-server run dev

# Start the frontend (Vite dev server)
pnpm --filter @workspace/clouddrain-ai run dev
```

### Try it

1. Open the app in the preview pane
2. Click **Run a simulation** to see a demo with 312 synthetic resources and 15 leaks
3. Or drag-and-drop any AWS CUR `.csv` export onto the upload zone
4. Click **Run AI Optimization Audit** to generate the full report

---

## CSV format support

FinOptic handles all of these out of the box:

| Format | Example columns | Notes |
|---|---|---|
| Standard AWS CUR | `lineItem/ResourceId`, `lineItem/UnblendedCost`, `product/instanceType` | Full detection, exact column match |
| Generic cost CSV | `Name`, `Monthly_Cost`, `Region`, `Type` | Fuzzy match + type inference |
| Template-string export | `{{cost}}`, `${amount}` | Replaced with `$0.20/hr × 720h = $144/mo` |
| No utilization data | *(any)* | CPU/GPU distribution simulated deterministically |

---

## Project structure

```
artifacts/
  api-server/          Express API — finops analysis, AI audit
  clouddrain-ai/       React frontend — dashboard, upload zone, charts
lib/
  api-spec/            OpenAPI 3.1 contract (source of truth)
  api-client-react/    Generated React Query hooks (via Orval)
  api-zod/             Generated Zod schemas (via Orval)
```

---

*FinOptic — Built with Replit*
