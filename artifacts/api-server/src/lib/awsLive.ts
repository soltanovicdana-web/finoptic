import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import {
  CostExplorerClient,
  GetCostAndUsageWithResourcesCommand,
  GetCostAndUsageCommand,
} from "@aws-sdk/client-cost-explorer";
import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
} from "@aws-sdk/client-cloudwatch";
import { logger } from "./logger";

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────
export interface AwsTempCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
}

export interface CostResourceRecord {
  resourceId: string;
  service: string;
  instanceType: string;
  region: string;
  monthlyCost: number;
}

// ─────────────────────────────────────────────────────────
// CUSTOM ERROR — carries actionable remediation text
// ─────────────────────────────────────────────────────────
export class AwsAccessError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly remediation: string
  ) {
    super(message);
    this.name = "AwsAccessError";
  }
}

function classifyAwsError(err: unknown): AwsAccessError {
  const msg = String(err instanceof Error ? err.message : err);
  const errCode =
    (err as Record<string, string>)?.Code ??
    (err as Record<string, string>)?.name ??
    "";

  if (
    /AccessDenied|NotAuthorized|UnauthorizedOperation/.test(errCode) ||
    /AccessDenied|is not authorized/.test(msg)
  ) {
    return new AwsAccessError(
      "IAM role does not have the required permissions.",
      "ACCESS_DENIED",
      [
        "Attach this inline policy to the IAM role you created for FinOptic:",
        "",
        "```json",
        '{',
        '  "Version": "2012-10-17",',
        '  "Statement": [{',
        '    "Effect": "Allow",',
        '    "Action": [',
        '      "ce:GetCostAndUsageWithResources",',
        '      "ce:GetCostAndUsage",',
        '      "cloudwatch:GetMetricStatistics",',
        '      "cloudwatch:ListMetrics"',
        '    ],',
        '    "Resource": "*"',
        '  }]',
        '}',
        "```",
        "",
        "Also confirm the trust policy allows sts:AssumeRole from your AWS account and that the External ID matches exactly.",
      ].join("\n")
    );
  }

  if (/ThrottlingException|RequestLimitExceeded/.test(errCode)) {
    return new AwsAccessError(
      "AWS API rate limit reached. Please retry in 30 seconds.",
      "THROTTLED",
      "Cost Explorer allows ~1 request/second. Wait 30 seconds and try again."
    );
  }

  if (
    /InvalidClientTokenId|MalformedPolicyDocument|ValidationError/.test(errCode) ||
    /invalid/.test(msg.toLowerCase())
  ) {
    return new AwsAccessError(
      "Invalid Role ARN or External ID format.",
      "INVALID_ARN",
      [
        "Check the Role ARN format: arn:aws:iam::123456789012:role/FinOpticReadOnly",
        "Check the External ID exactly matches the value in the trust policy.",
        "Ensure the IAM role trust policy includes: \"sts:ExternalId\": \"<your-external-id>\"",
      ].join("\n")
    );
  }

  return new AwsAccessError(
    `AWS error: ${msg}`,
    "AWS_ERROR",
    "Check AWS CloudTrail for the exact denied action. Ensure your IAM role trust policy allows sts:AssumeRole and that the External ID is correct."
  );
}

// ─────────────────────────────────────────────────────────
// STS: AssumeRole → temporary credentials
// ─────────────────────────────────────────────────────────
export async function assumeRole(
  roleArn: string,
  externalId: string
): Promise<AwsTempCredentials> {
  const sts = new STSClient({ region: "us-east-1" });
  try {
    const res = await sts.send(
      new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: "FinOpticAudit",
        ExternalId: externalId,
        DurationSeconds: 3600,
      })
    );
    const c = res.Credentials;
    if (!c?.AccessKeyId || !c?.SecretAccessKey || !c?.SessionToken) {
      throw new Error("STS returned incomplete credentials");
    }
    logger.info({ roleArn: roleArn.replace(/[^:/]+$/, "***") }, "STS role assumed successfully");
    return {
      accessKeyId: c.AccessKeyId,
      secretAccessKey: c.SecretAccessKey,
      sessionToken: c.SessionToken,
    };
  } catch (err) {
    if (err instanceof AwsAccessError) throw err;
    throw classifyAwsError(err);
  }
}

// ─────────────────────────────────────────────────────────
// COST EXPLORER: Fetch last-30-day resource costs
// Tries resource-level first; falls back to service-level
// if the account doesn't have resource-level billing enabled.
// ─────────────────────────────────────────────────────────
export async function fetchResourceCosts(
  creds: AwsTempCredentials
): Promise<CostResourceRecord[]> {
  const ce = new CostExplorerClient({
    region: "us-east-1",
    credentials: creds,
  });

  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  logger.info({ start, end }, "Fetching Cost Explorer data");

  try {
    const res = await ce.send(
      new GetCostAndUsageWithResourcesCommand({
        TimePeriod: { Start: start, End: end },
        Granularity: "MONTHLY",
        Filter: {
          Not: {
            Dimensions: {
              Key: "RECORD_TYPE",
              Values: ["Credit", "Refund", "SavingsPlanNegation"],
            },
          },
        },
        GroupBy: [
          { Type: "DIMENSION", Key: "RESOURCE_ID" },
          { Type: "DIMENSION", Key: "SERVICE" },
        ],
        Metrics: ["UnblendedCost"],
      })
    );

    const resources: CostResourceRecord[] = [];
    for (const period of res.ResultsByTime ?? []) {
      for (const group of period.Groups ?? []) {
        const [resourceId = "", service = ""] = group.Keys ?? [];
        const cost = parseFloat(
          group.Metrics?.UnblendedCost?.Amount ?? "0"
        );
        if (cost <= 0 || !resourceId || resourceId === "NoResourceId") continue;
        resources.push({
          resourceId,
          service,
          instanceType: inferInstanceTypeFromId(resourceId),
          region: "us-east-1",
          monthlyCost: cost,
        });
      }
    }

    logger.info({ count: resources.length }, "Resource-level costs fetched");
    return resources;
  } catch (err) {
    const errCode =
      (err as Record<string, string>)?.Code ??
      (err as Record<string, string>)?.name ??
      "";

    if (
      /BillingConsolidatedAccountException|DataNotAvailableException|Validation|NotOptedIn/.test(
        errCode
      )
    ) {
      logger.warn(
        { errCode },
        "Resource-level costs unavailable — falling back to service-level"
      );
      return fetchServiceLevelCosts(ce, start, end);
    }
    throw classifyAwsError(err);
  }
}

function inferInstanceTypeFromId(resourceId: string): string {
  if (/^p[34]|^g[45]|^g4dn/.test(resourceId)) return "p3.2xlarge";
  if (/^i-[0-9a-f]{8,}/.test(resourceId)) return "m5.large";
  return "";
}

async function fetchServiceLevelCosts(
  ce: CostExplorerClient,
  start: string,
  end: string
): Promise<CostResourceRecord[]> {
  const res = await ce.send(
    new GetCostAndUsageCommand({
      TimePeriod: { Start: start, End: end },
      Granularity: "MONTHLY",
      GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }],
      Metrics: ["UnblendedCost"],
    })
  );

  const resources: CostResourceRecord[] = [];
  let idx = 0;

  for (const period of res.ResultsByTime ?? []) {
    for (const group of period.Groups ?? []) {
      const service = group.Keys?.[0] ?? "Unknown";
      const cost = parseFloat(group.Metrics?.UnblendedCost?.Amount ?? "0");
      if (cost <= 0) continue;

      const isGpu = /SageMaker|Batch.*GPU/i.test(service);
      const isStorage = /S3|EBS|Glacier|FSx|Storage Gateway/i.test(service);
      const isCompute = /EC2|ECS|EKS|Lambda|Fargate|Lightsail/i.test(service);

      const prefix = isGpu ? "p3" : isStorage ? "vol" : isCompute ? "i" : "svc";
      const id = `${prefix}-${String(idx++).padStart(8, "0")}`;

      resources.push({
        resourceId: id,
        service,
        instanceType: isGpu ? "p3.2xlarge" : isCompute ? "m5.large" : "",
        region: "us-east-1",
        monthlyCost: cost,
      });
    }
  }

  logger.info({ count: resources.length }, "Service-level costs fetched (fallback)");
  return resources;
}

// ─────────────────────────────────────────────────────────
// CLOUDWATCH: Fetch 30-day average CPU per EC2 instance
// Returns a map of instanceId → avgCpuPercent (0-100)
// Missing entries = no data (caller falls back to simulation)
// ─────────────────────────────────────────────────────────
export async function fetchCpuUtilization(
  creds: AwsTempCredentials,
  instanceIds: string[]
): Promise<Map<string, number>> {
  if (instanceIds.length === 0) return new Map();

  const result = new Map<string, number>();
  const now = new Date();
  const startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Process in chunks of 20 to avoid CloudWatch throttling
  const chunks: string[][] = [];
  for (let i = 0; i < instanceIds.length; i += 20) {
    chunks.push(instanceIds.slice(i, i + 20));
  }

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (instanceId) => {
        try {
          const cw = new CloudWatchClient({
            region: "us-east-1",
            credentials: creds,
          });
          const res = await cw.send(
            new GetMetricStatisticsCommand({
              Namespace: "AWS/EC2",
              MetricName: "CPUUtilization",
              Dimensions: [{ Name: "InstanceId", Value: instanceId }],
              StartTime: startTime,
              EndTime: now,
              // Use 30-day period to get one average datapoint
              Period: 86400 * 30,
              Statistics: ["Average"],
            })
          );
          const avg = res.Datapoints?.[0]?.Average;
          if (avg !== undefined) {
            result.set(instanceId, avg);
          }
        } catch {
          // Non-fatal: skip this instance, caller uses simulation
        }
      })
    );
  }

  logger.info(
    { queried: instanceIds.length, resolved: result.size },
    "CloudWatch CPU metrics fetched"
  );
  return result;
}
