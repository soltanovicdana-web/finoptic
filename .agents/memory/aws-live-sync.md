---
name: Live AWS sync pipeline
description: Architecture of the POST /finops/live endpoint and its fallback behavior
---

The live sync route (`POST /api/finops/live`) follows this pipeline:

1. **STS AssumeRole** via `assumeRole(roleArn, externalId)` → `AwsTempCredentials`
2. **Cost Explorer** via `fetchResourceCosts(creds)` → `CostResourceRecord[]` (tries `GetCostAndUsageWithResources`, falls back to `GetCostAndUsage` by service)
3. **CloudWatch CPU** via `fetchCpuUtilization(creds, instanceIds)` — non-fatal; if it fails, simulated CPU distribution is used
4. **NormalizedRow mapping** — maps `CostResourceRecord[]` to `NormalizedRow[]` so the same `detectLeaks()` used for CSV uploads can process live data
5. **Emergency fallback** — if Cost Explorer returns 0 resources, `buildFallbackResult(20)` is returned

**Error handling:** `AwsAccessError` (from `awsLive.ts`) carries `code` and `remediation` fields; re-thrown as 403 with `LiveSyncError` shape. Unexpected errors → 500.

**CloudWatch is best-effort:** failures are logged as warnings and simulation fills the gap.
