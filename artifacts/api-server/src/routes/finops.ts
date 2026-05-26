import { Router, type IRouter } from "express";
import multer from "multer";
import { parse } from "csv-parse";
import { Readable } from "stream";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

type LeakType = "UNDERUTILIZED_COMPUTE" | "ORPHANED_STORAGE" | "WASTEFUL_GPU";

interface LeakRecord {
  resourceId: string;
  region: string;
  leakType: LeakType;
  monthlyWaste: number;
  details: string;
}

interface AnalysisResult {
  totalMonthlySpend: number;
  potentialSavings: number;
  efficiencyScore: number;
  leaks: LeakRecord[];
  resourceCount: number;
}

interface CsvRow {
  [key: string]: string;
}

function detectLeaks(rows: CsvRow[]): { leaks: LeakRecord[]; totalSpend: number } {
  const leaks: LeakRecord[] = [];
  let totalSpend = 0;

  for (const row of rows) {
    const cost = parseFloat(row["lineItem/UnblendedCost"] || row["cost"] || row["monthly_cost"] || "0");
    if (!isNaN(cost)) totalSpend += cost;

    const resourceId =
      row["lineItem/ResourceId"] || row["resource_id"] || row["ResourceId"] || `resource-${Math.random().toString(36).slice(2, 8)}`;
    const region =
      row["product/region"] || row["region"] || row["Region"] || "us-east-1";
    const instanceType =
      row["product/instanceType"] || row["instance_type"] || row["InstanceType"] || "";
    const volumeStatus =
      row["volume_status"] || row["VolumeStatus"] || row["status"] || "";
    const cpuUtil = parseFloat(row["cpu_utilization"] || row["CPUUtilization"] || row["avg_cpu"] || "100");
    const gpuUtil = parseFloat(row["gpu_utilization"] || row["GPUUtilization"] || row["tensor_util"] || "100");
    const productFamily =
      row["product/productFamily"] || row["product_family"] || row["ProductFamily"] || "";

    // Underutilized Compute: EC2 instance costing >$200/month with <5% CPU
    if (
      (productFamily.toLowerCase().includes("compute") || instanceType.toLowerCase().startsWith("m") ||
        instanceType.toLowerCase().startsWith("c") || instanceType.toLowerCase().startsWith("t") ||
        instanceType.toLowerCase().startsWith("r")) &&
      cost > 200 &&
      !isNaN(cpuUtil) &&
      cpuUtil < 5
    ) {
      leaks.push({
        resourceId,
        region,
        leakType: "UNDERUTILIZED_COMPUTE",
        monthlyWaste: cost * 0.75,
        details: `EC2 instance averaging ${cpuUtil.toFixed(1)}% CPU. Cost: $${cost.toFixed(2)}/mo. Rightsize or schedule off-hours.`,
      });
    }

    // Orphaned Storage: EBS volume with status "available" (detached)
    if (
      (productFamily.toLowerCase().includes("storage") || volumeStatus.toLowerCase() === "available") &&
      cost > 0
    ) {
      leaks.push({
        resourceId,
        region,
        leakType: "ORPHANED_STORAGE",
        monthlyWaste: cost,
        details: `Detached EBS volume (status: available). Accumulating $${cost.toFixed(2)}/mo with zero utilization.`,
      });
    }

    // Wasteful GPU: p3/p4/g5 instances with 0% GPU/tensor utilization
    if (
      (instanceType.startsWith("p3") || instanceType.startsWith("p4") || instanceType.startsWith("g5")) &&
      !isNaN(gpuUtil) &&
      gpuUtil === 0
    ) {
      leaks.push({
        resourceId,
        region,
        leakType: "WASTEFUL_GPU",
        monthlyWaste: cost,
        details: `GPU instance (${instanceType}) running at 0% tensor core utilization. Burning $${cost.toFixed(2)}/mo for idle hardware.`,
      });
    }
  }

  return { leaks, totalSpend };
}

function generateDemoData(): AnalysisResult {
  const regions = ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1", "us-east-2"];
  const leaks: LeakRecord[] = [];

  // Underutilized EC2 instances
  const ec2Instances = [
    { id: "i-0a3f8c2e9b1d4567", cost: 847.20, cpu: 1.2 },
    { id: "i-0b7d3a1f4e2c8901", cost: 623.50, cpu: 2.8 },
    { id: "i-0c9e5b2d7f4a1234", cost: 1284.00, cpu: 0.4 },
    { id: "i-0d1f7c4e8a2b5678", cost: 412.75, cpu: 3.1 },
    { id: "i-0e3a5b8c2f7d9012", cost: 2140.00, cpu: 1.8 },
  ];

  for (const inst of ec2Instances) {
    leaks.push({
      resourceId: inst.id,
      region: regions[Math.floor(Math.random() * regions.length)],
      leakType: "UNDERUTILIZED_COMPUTE",
      monthlyWaste: parseFloat((inst.cost * 0.75).toFixed(2)),
      details: `m5.2xlarge averaging ${inst.cpu}% CPU utilization. Monthly cost: $${inst.cost.toFixed(2)}. Rightsizing to m5.small saves ~75%.`,
    });
  }

  // Orphaned EBS volumes
  const ebsVolumes = [
    { id: "vol-0f4a8c3e1b2d5678", cost: 42.50, size: 500 },
    { id: "vol-0g8e2a5f7c1b9012", cost: 18.20, size: 215 },
    { id: "vol-0h1b7d4a2f3c6789", cost: 94.30, size: 1112 },
    { id: "vol-0i5c9e8b4d2a3456", cost: 31.00, size: 366 },
    { id: "vol-0j3f2a7c8e5b1234", cost: 63.80, size: 752 },
    { id: "vol-0k7d4b1e9f3c8901", cost: 22.10, size: 261 },
    { id: "vol-0l9e6c3f5a8b4567", cost: 77.40, size: 912 },
  ];

  for (const vol of ebsVolumes) {
    leaks.push({
      resourceId: vol.id,
      region: regions[Math.floor(Math.random() * regions.length)],
      leakType: "ORPHANED_STORAGE",
      monthlyWaste: vol.cost,
      details: `Detached EBS volume (${vol.size} GB, gp3). Status: available. No EC2 attachment. Delete to immediately stop billing.`,
    });
  }

  // Idle GPU instances
  const gpuInstances = [
    { id: "i-0p3r8q2m7n4k5678", type: "p3.2xlarge", cost: 2184.00 },
    { id: "i-0q7s4t9u1v2w3456", type: "p4d.24xlarge", cost: 8640.00 },
    { id: "i-0r5t2v8x3y1z9012", type: "g5.xlarge", cost: 604.80 },
  ];

  for (const gpu of gpuInstances) {
    leaks.push({
      resourceId: gpu.id,
      region: regions[Math.floor(Math.random() * regions.length)],
      leakType: "WASTEFUL_GPU",
      monthlyWaste: gpu.cost,
      details: `${gpu.type} running at 0% GPU/tensor core utilization. Likely a forgotten training job. Monthly burn: $${gpu.cost.toFixed(2)}.`,
    });
  }

  const totalMonthlySpend = 47823.45;
  const potentialSavings = parseFloat(leaks.reduce((sum, l) => sum + l.monthlyWaste, 0).toFixed(2));
  const efficiencyScore = parseFloat(((1 - potentialSavings / totalMonthlySpend) * 100).toFixed(1));

  return {
    totalMonthlySpend,
    potentialSavings,
    efficiencyScore,
    leaks,
    resourceCount: 312,
  };
}

async function parseCsvBuffer(buffer: Buffer): Promise<CsvRow[]> {
  const rows: CsvRow[] = [];
  const readable = Readable.from(buffer);

  await new Promise<void>((resolve, reject) => {
    readable
      .pipe(parse({ columns: true, skip_empty_lines: true, trim: true, relax_column_count: true }))
      .on("data", (row: CsvRow) => rows.push(row))
      .on("error", reject)
      .on("end", resolve);
  });

  return rows;
}

// POST /api/finops/simulate
router.post("/finops/simulate", async (_req, res): Promise<void> => {
  const result = generateDemoData();
  res.json(result);
});

// POST /api/finops/upload
router.post("/finops/upload", upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No CSV file uploaded. Use field name 'file'." });
    return;
  }

  try {
    const rows = await parseCsvBuffer(req.file.buffer);

    if (rows.length === 0) {
      res.status(400).json({ error: "CSV file is empty or has no parseable rows." });
      return;
    }

    const { leaks, totalSpend } = detectLeaks(rows);
    const potentialSavings = parseFloat(leaks.reduce((s, l) => s + l.monthlyWaste, 0).toFixed(2));
    const efficiencyScore = totalSpend > 0
      ? parseFloat(((1 - potentialSavings / totalSpend) * 100).toFixed(1))
      : 100;

    const result: AnalysisResult = {
      totalMonthlySpend: parseFloat(totalSpend.toFixed(2)),
      potentialSavings,
      efficiencyScore: Math.max(0, Math.min(100, efficiencyScore)),
      leaks,
      resourceCount: rows.length,
    };

    req.log.info({ leakCount: leaks.length, rowCount: rows.length }, "CSV analysis complete");
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to parse CSV");
    res.status(400).json({ error: "Failed to parse CSV file. Ensure it is a valid AWS CUR or compatible format." });
  }
});

// POST /api/finops/audit
router.post("/finops/audit", async (req, res): Promise<void> => {
  const { leaks, totalMonthlySpend, potentialSavings } = req.body;

  if (!leaks || !Array.isArray(leaks) || leaks.length === 0) {
    res.status(400).json({ error: "No leak records provided for audit." });
    return;
  }

  const leakSummary = leaks
    .map(
      (l: LeakRecord) =>
        `- [${l.leakType}] ${l.resourceId} (${l.region}): $${l.monthlyWaste.toFixed(2)}/mo wasted — ${l.details}`
    )
    .join("\n");

  const systemPrompt = `You are a ruthless Wall Street CFO combined with a Principal AWS Solutions Architect. Your sole purpose is to annihilate cloud waste and return capital to the balance sheet. You speak in precise dollar amounts, not approximations. You do not soften your language. You do not offer general advice — every recommendation includes exact AWS CLI commands, specific resource IDs, and concrete dollar figures.

Your output must be a structured Markdown report formatted for a US startup CTO. It must be immediately actionable — engineers should be able to execute your recommendations within the hour.`;

  const userPrompt = `## AWS Cost Intelligence Briefing

**Total Monthly AWS Spend:** $${totalMonthlySpend.toFixed(2)}
**Potential Monthly Savings Identified:** $${potentialSavings.toFixed(2)} (${((potentialSavings / totalMonthlySpend) * 100).toFixed(1)}% waste rate)
**Annualized Savings Potential:** $${(potentialSavings * 12).toFixed(2)}

### Detected Resource Leaks:
${leakSummary}

---

Generate a comprehensive audit report with the following sections:

1. **EXECUTIVE SUMMARY** — State the financial impact in 2-3 brutal sentences. Include the monthly and annual savings figure.

2. **CRITICAL ACTIONS (DO THESE TODAY)** — For each detected leak, provide:
   - The exact resource ID and its monthly waste
   - The specific AWS CLI command(s) to remediate it immediately
   - The exact dollar saved per action

3. **REMEDIATION PLAYBOOK** — Step-by-step remediation instructions per leak category (UNDERUTILIZED_COMPUTE, ORPHANED_STORAGE, WASTEFUL_GPU), including:
   - Specific AWS CLI commands (use the actual resource IDs from the leak data)
   - How to verify the change was successful
   - Any rollback procedure

4. **ARCHITECTURAL RECOMMENDATIONS** — 3-5 structural changes to prevent this category of waste from recurring (e.g. AWS Cost Anomaly Detection setup, instance scheduler, automated EBS snapshot lifecycle policies)

5. **SAVINGS TIMELINE** — A table showing projected monthly savings broken down by leak type, and cumulative 12-month impact.

Use markdown tables, code blocks for CLI commands, and bold text for dollar amounts. Be precise. Be merciless.`;

  try {
    const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

    if (!baseUrl || !apiKey) {
      // Fallback: generate a detailed static report when AI integration is not available
      const staticReport = generateStaticAuditReport(leaks, totalMonthlySpend, potentialSavings);
      res.json({ report: staticReport });
      return;
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.1",
        max_completion_tokens: 8192,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error({ status: response.status, body: errText }, "AI API error");
      const staticReport = generateStaticAuditReport(leaks, totalMonthlySpend, potentialSavings);
      res.json({ report: staticReport });
      return;
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    const report = data.choices?.[0]?.message?.content ?? "";
    req.log.info({ leakCount: leaks.length }, "AI audit report generated");
    res.json({ report });
  } catch (err) {
    req.log.error({ err }, "AI audit failed, using static fallback");
    const staticReport = generateStaticAuditReport(leaks, totalMonthlySpend, potentialSavings);
    res.json({ report: staticReport });
  }
});

function generateStaticAuditReport(leaks: LeakRecord[], totalSpend: number, potentialSavings: number): string {
  const annualized = (potentialSavings * 12).toFixed(2);
  const wasteRate = ((potentialSavings / totalSpend) * 100).toFixed(1);

  const compute = leaks.filter((l) => l.leakType === "UNDERUTILIZED_COMPUTE");
  const storage = leaks.filter((l) => l.leakType === "ORPHANED_STORAGE");
  const gpu = leaks.filter((l) => l.leakType === "WASTEFUL_GPU");

  const computeSavings = compute.reduce((s, l) => s + l.monthlyWaste, 0);
  const storageSavings = storage.reduce((s, l) => s + l.monthlyWaste, 0);
  const gpuSavings = gpu.reduce((s, l) => s + l.monthlyWaste, 0);

  const cliCommands = [
    ...storage.map(
      (l) => `# Delete orphaned EBS volume ${l.resourceId} — saves $${l.monthlyWaste.toFixed(2)}/mo\naws ec2 delete-volume --volume-id ${l.resourceId} --region ${l.region}`
    ),
    ...compute.map(
      (l) => `# Stop underutilized EC2 instance ${l.resourceId} — saves $${l.monthlyWaste.toFixed(2)}/mo\naws ec2 stop-instances --instance-ids ${l.resourceId} --region ${l.region}`
    ),
    ...gpu.map(
      (l) => `# Stop idle GPU instance ${l.resourceId} — saves $${l.monthlyWaste.toFixed(2)}/mo\naws ec2 stop-instances --instance-ids ${l.resourceId} --region ${l.region}`
    ),
  ];

  return `# CloudDrain AI — AWS Cost Optimization Audit Report

---

## 1. EXECUTIVE SUMMARY

Your AWS infrastructure is hemorrhaging **$${potentialSavings.toFixed(2)}/month** — that's **$${annualized}/year** — on ${leaks.length} identified resource leaks across ${wasteRate}% of your total spend. This is not an optimization opportunity. This is a capital recovery operation. Every day you delay costs you **$${(potentialSavings / 30).toFixed(2)}**. The remediation actions below can be executed in under 60 minutes.

**Total Monthly Spend:** $${totalSpend.toFixed(2)}
**Recoverable Monthly Waste:** **$${potentialSavings.toFixed(2)}**
**12-Month Savings Potential:** **$${annualized}**

---

## 2. CRITICAL ACTIONS (DO THESE TODAY)

${leaks
  .map(
    (l, i) => `### Action ${i + 1}: ${l.resourceId} — **$${l.monthlyWaste.toFixed(2)}/mo**

**Type:** ${l.leakType.replace(/_/g, " ")}
**Region:** \`${l.region}\`
**Issue:** ${l.details}

\`\`\`bash
aws ec2 ${l.leakType === "ORPHANED_STORAGE" ? `delete-volume --volume-id ${l.resourceId}` : `stop-instances --instance-ids ${l.resourceId}`} --region ${l.region}
\`\`\``
  )
  .join("\n\n")}

---

## 3. REMEDIATION PLAYBOOK

### UNDERUTILIZED COMPUTE (${compute.length} instances — **$${computeSavings.toFixed(2)}/mo**)

\`\`\`bash
# Step 1: Verify current utilization
aws cloudwatch get-metric-statistics \\
  --namespace AWS/EC2 \\
  --metric-name CPUUtilization \\
  --dimensions Name=InstanceId,Value=<INSTANCE_ID> \\
  --start-time $(date -u -v-30d +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 86400 --statistics Average

# Step 2: Rightsize or stop the instance
aws ec2 stop-instances --instance-ids <INSTANCE_ID> --region <REGION>

# Step 3: Change instance type to right-size (while stopped)
aws ec2 modify-instance-attribute --instance-id <INSTANCE_ID> --instance-type t3.medium --region <REGION>
\`\`\`

### ORPHANED STORAGE (${storage.length} volumes — **$${storageSavings.toFixed(2)}/mo**)

\`\`\`bash
# Step 1: List all detached volumes
aws ec2 describe-volumes --filters Name=status,Values=available \\
  --query 'Volumes[*].[VolumeId,Size,CreateTime,Tags]' \\
  --output table

# Step 2: Create final snapshot before deletion (optional safety net)
aws ec2 create-snapshot --volume-id <VOLUME_ID> --description "Final snapshot before deletion" --region <REGION>

# Step 3: Delete the orphaned volume
aws ec2 delete-volume --volume-id <VOLUME_ID> --region <REGION>
\`\`\`

### WASTEFUL GPU (${gpu.length} instances — **$${gpuSavings.toFixed(2)}/mo**)

\`\`\`bash
# Step 1: Verify no active training jobs
aws ec2 get-console-output --instance-id <INSTANCE_ID> --region <REGION>

# Step 2: Stop idle GPU instances immediately
aws ec2 stop-instances --instance-ids <INSTANCE_ID> --region <REGION>

# Step 3: Consider Reserved Instances or Spot Instances for future GPU workloads
aws ec2 describe-reserved-instances-offerings --instance-type p3.2xlarge --offering-type "All Upfront"
\`\`\`

---

## 4. ARCHITECTURAL RECOMMENDATIONS

1. **Enable AWS Cost Anomaly Detection** — Set a $50/day threshold alert per service. Takes 5 minutes to configure and catches runaway spend before it compounds.
   \`\`\`bash
   aws ce create-anomaly-monitor --anomaly-monitor '{"MonitorName":"CloudDrainMonitor","MonitorType":"DIMENSIONAL","MonitorDimension":"SERVICE"}'
   \`\`\`

2. **Deploy EC2 Instance Scheduler** — Use AWS Instance Scheduler to automatically stop dev/staging instances outside business hours (saves ~65% on non-prod compute).

3. **Implement EBS Lifecycle Policies** — Automatically snapshot and delete volumes detached for >7 days. Use AWS Data Lifecycle Manager.

4. **Tag Everything as Policy** — Enforce \`Owner\`, \`Project\`, \`Environment\` tags via Service Control Policies. Untagged resources get auto-stopped after 72h.

5. **Switch GPU Workloads to Spot Instances** — ML training jobs are spot-interruptible. p3.2xlarge spot price is ~70% cheaper than on-demand. Implement spot interruption handlers in your training code.

---

## 5. SAVINGS TIMELINE

| Leak Type | Resources | Monthly Savings | 6-Month | 12-Month |
|-----------|-----------|----------------|---------|----------|
| Underutilized Compute | ${compute.length} instances | **$${computeSavings.toFixed(2)}** | $${(computeSavings * 6).toFixed(2)} | $${(computeSavings * 12).toFixed(2)} |
| Orphaned Storage | ${storage.length} volumes | **$${storageSavings.toFixed(2)}** | $${(storageSavings * 6).toFixed(2)} | $${(storageSavings * 12).toFixed(2)} |
| Wasteful GPU | ${gpu.length} instances | **$${gpuSavings.toFixed(2)}** | $${(gpuSavings * 6).toFixed(2)} | $${(gpuSavings * 12).toFixed(2)} |
| **TOTAL** | **${leaks.length} resources** | **$${potentialSavings.toFixed(2)}** | **$${(potentialSavings * 6).toFixed(2)}** | **$${annualized}** |

---

*Report generated by CloudDrain AI — Automated AWS Cost Intelligence*
*Execute all CLI commands with appropriate IAM permissions. Verify resources before deletion.*`;
}

export default router;
