<div align="center">

# 🔭 FinOptic

### Automated AWS Cost Intelligence — Powered by Real-Time IAM Sync & AI

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

**FinOptic** is an enterprise-grade AWS cost optimization engine. Connect a read-only IAM role and get a live view of every dollar being wasted across your AWS account — idle compute, orphaned storage, and unused GPU instances — in seconds. Or upload a Cost & Usage Report CSV and get the same result instantly.

[Features](#-features) · [Live AWS Sync](#-live-aws-sync) · [Quick Start](#-quick-start) · [Safety](#-safety--security) · [Architecture](#-architecture) · [CSV Support](#-csv-format-support)

</div>

---

## ✨ Features

### 🔴 Live AWS Sync via IAM Role
Connect FinOptic directly to your AWS account using a cross-account read-only IAM role. No credentials stored — FinOptic assumes a temporary session via STS AssumeRole with a short TTL and your own External ID as the security handshake.

### 📊 Cost Explorer + CloudWatch Integration
Pulls the last 30 days of cost data from **AWS Cost Explorer** (with resource-level granularity where available) and enriches every EC2 instance with real CPU utilization metrics from **AWS CloudWatch**. If CloudWatch is unavailable, a deterministic simulation fills the gap — no silent failures.

### 🤖 AI Optimization Audit
One click generates a full **AI-written remediation report** with an executive summary, per-resource savings table, exact AWS CLI commands to act on every finding, and a 12-month savings projection.

### 📁 CSV Upload & Simulation Mode
Drag-and-drop any **AWS Cost & Usage Report (CUR) CSV** for instant analysis. No AWS credentials needed. Or hit **Run a simulation** for a demo with 300+ synthetic resources across all waste categories.

### 🎯 Zero False Positives by Design
Three high-confidence detection rules — no probabilistic guessing:

| Waste Category | Detection Signal |
|---|---|
| ⚙️ **Underutilized Compute** | CPU < 5% on instances costing > $144/mo |
| 💾 **Orphaned Storage** | EBS volumes in `available` state (unattached) |
| 🖥️ **Wasteful GPU** | p3 / p4 / g4 / g5 instances with 0% GPU utilization |

### ⚡ Enterprise-Grade Stack
Contract-first API (OpenAPI 3.1 → Orval codegen), type-safe end-to-end with Zod, React Query for all data fetching, pure-SVG charts with no third-party charting library.

---

## 🔗 Live AWS Sync

FinOptic never asks for your AWS Access Key ID or Secret. Instead, it uses the **IAM Role** delegation pattern — the same approach AWS recommends for all cross-account tooling.

### Setting up the IAM Role

**1. Create the role in your AWS account**

```
IAM Console → Roles → Create role → AWS account → Another AWS account
Account ID: (your FinOptic deployment account)
✅ Require external ID: finoptic-prod-handshake  ← choose your own value
```

**2. Attach a read-only policy**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostAndUsageWithResources",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics"
      ],
      "Resource": "*"
    }
  ]
}
```

Or use the AWS managed policy `ReadOnlyAccess` for broader coverage.

**3. Connect in FinOptic**

Switch to **Live AWS Sync** in the dashboard, paste your Role ARN and External ID, and hit **Connect & Analyze Live Account**. FinOptic does the rest.

---

## 🚀 Quick Start

### Prerequisites

- [Node.js 24+](https://nodejs.org/)
- [pnpm 10+](https://pnpm.io/) (`npm install -g pnpm`)

### Install & Run

```bash
# Clone the repository
git clone https://github.com/soltanovicdana-web/finoptic.git
cd finoptic

# Install all workspace dependencies
pnpm install

# Start both services in separate terminals:

# Terminal 1 — API server (port 8080, proxied at /api)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — React frontend
pnpm --filter @workspace/clouddrain-ai run dev
```

Open [http://localhost](http://localhost) in your browser.

### Try it in 30 seconds

1. Click **Run a simulation** — instant demo with 312 synthetic resources, 15 detected leaks
2. Or drag-and-drop any AWS CUR `.csv` onto the upload zone
3. Switch to **Live AWS Sync** to connect a real AWS account
4. Click **Run AI Optimization Audit** to generate the full remediation report

### Other useful commands

```bash
# Full typecheck across all packages
pnpm run typecheck

# Regenerate API client hooks from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Push DB schema changes (dev only)
pnpm --filter @workspace/db run push

# Build everything
pnpm run build
```

---

## 🔒 Safety & Security

FinOptic is designed from the ground up to be **100% read-only**. It will never create, modify, or delete any resource in your AWS account.

| Concern | How FinOptic handles it |
|---|---|
| **Credential storage** | Zero. STS temporary credentials expire after 15 minutes and are never persisted. |
| **Permissions scope** | Only `ce:GetCostAndUsage*` and `cloudwatch:GetMetric*` are required. No EC2, IAM, or S3 write permissions needed. |
| **External ID** | Your chosen External ID must match the IAM trust policy — prevents confused deputy attacks. |
| **Network** | All AWS API calls are made server-side. Your browser never touches AWS directly. |
| **Data retention** | Analysis results exist only in memory for the duration of your browser session. Nothing is written to a database. |

---

## 🏗️ Architecture

```
finoptic/
├── artifacts/
│   ├── api-server/          # Express 5 API — analysis engine, AI audit, live sync
│   │   └── src/
│   │       ├── routes/finops.ts      # POST /api/finops/upload, /simulate, /audit, /live
│   │       └── lib/awsLive.ts        # STS AssumeRole + Cost Explorer + CloudWatch
│   └── clouddrain-ai/       # React 19 + Vite 7 frontend
│       └── src/
│           ├── pages/Dashboard.tsx   # Mode toggle, results orchestration
│           └── components/
│               ├── LiveSyncForm.tsx  # IAM role connection form
│               ├── UploadZone.tsx    # CSV drag-and-drop
│               ├── LeaksTable.tsx    # Detected waste table
│               ├── WasteChart.tsx    # Pure-SVG savings projection
│               └── AuditReport.tsx  # AI report reader
├── lib/
│   ├── api-spec/            # OpenAPI 3.1 contract (source of truth)
│   ├── api-client-react/    # Generated React Query hooks (Orval)
│   └── api-zod/             # Generated Zod validation schemas (Orval)
└── pnpm-workspace.yaml      # Workspace catalog + package resolution
```

### Data flow

```
Browser → POST /api/finops/live
            │
            ├─ STS AssumeRole (your IAM role, 15-min session)
            │
            ├─ Cost Explorer → GetCostAndUsageWithResources (30 days)
            │                   ↘ fallback: GetCostAndUsage by service
            │
            ├─ CloudWatch → GetMetricStatistics (CPU, EC2, chunks of 20)
            │               ↘ fallback: simulated CPU distribution
            │
            └─ detectLeaks() → AnalysisResult → Dashboard
```

---

## 📁 CSV Format Support

FinOptic's fuzzy parser handles any CSV that has a cost column:

| Format | Example columns | Notes |
|---|---|---|
| Standard AWS CUR | `lineItem/ResourceId`, `lineItem/UnblendedCost`, `product/instanceType` | Full detection, exact column match |
| Generic cost CSV | `Name`, `Monthly_Cost`, `Region`, `Type` | Fuzzy match + type inference |
| Template-string export | `{{cost}}`, `${amount}`, `N/A` | Normalized to `$0.20/hr × 720h = $144/mo` |
| No utilization data | *(any)* | CPU/GPU distribution simulated deterministically |

---

## 🛠️ Development

### Code generation

The API contract lives in `lib/api-spec/openapi.yaml`. After any spec change:

```bash
pnpm --filter @workspace/api-spec run codegen
```

This regenerates React Query hooks in `lib/api-client-react/src/generated/` and Zod schemas in `lib/api-zod/src/generated/`. Both are committed — no build step required to use the client.

### Adding a new API endpoint

1. Define the route in `openapi.yaml` (request body, response, error schemas)
2. Run `codegen` to generate the client hook
3. Implement the Express handler in `artifacts/api-server/src/routes/`
4. Use the generated hook in the React frontend

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | For DB features | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Express session signing secret |

---

## 📄 License

MIT © 2026 [Danila](https://github.com/soltanovicdana-web)

---

<div align="center">

Built with ☕ and Replit · [GitHub](https://github.com/soltanovicdana-web/finoptic)

</div>
