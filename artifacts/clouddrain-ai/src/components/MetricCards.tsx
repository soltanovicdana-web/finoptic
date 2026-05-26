import { type AnalysisResult } from "@workspace/api-client-react";
import { DollarSign, Percent, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardsProps {
  analysis: AnalysisResult;
}

export function MetricCards({ analysis }: MetricCardsProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-card border-border/50 rounded-none shadow-[4px_4px_0_0_hsl(var(--border))]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Current Monthly Spend
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground font-mono">
            {formatCurrency(analysis.totalMonthlySpend)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Across {analysis.resourceCount.toLocaleString()} resources
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-destructive/30 rounded-none shadow-[4px_4px_0_0_hsl(var(--destructive)/0.3)]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-destructive uppercase tracking-wider">
            Potential Savings
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-destructive font-mono">
            {formatCurrency(analysis.potentialSavings)}
          </div>
          <p className="text-xs text-destructive/70 mt-1">
            Identified monthly waste
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-secondary/30 rounded-none shadow-[4px_4px_0_0_hsl(var(--secondary)/0.3)]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-secondary uppercase tracking-wider">
            Cloud Waste Efficiency Score
          </CardTitle>
          <Percent className="h-4 w-4 text-secondary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-secondary font-mono">
            {analysis.efficiencyScore}%
          </div>
          <p className="text-xs text-secondary/70 mt-1">
            100% = perfectly efficient
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
