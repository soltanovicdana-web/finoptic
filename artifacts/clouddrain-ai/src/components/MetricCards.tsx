import { type AnalysisResult } from "@workspace/api-client-react";

interface MetricCardsProps {
  analysis: AnalysisResult;
}

export function MetricCards({ analysis }: MetricCardsProps) {
  const fmt = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  const wasteRate = analysis.totalMonthlySpend > 0
    ? ((analysis.potentialSavings / analysis.totalMonthlySpend) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.06] rounded-xl overflow-hidden border border-white/[0.06]">
      {/* Monthly spend */}
      <div className="bg-background px-8 py-7 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-400">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
          Monthly spend
        </p>
        <p className="text-3xl font-light text-foreground tracking-[-0.03em] mt-2">
          {fmt(analysis.totalMonthlySpend)}
        </p>
        <p className="text-xs text-muted-foreground/60">
          {analysis.resourceCount.toLocaleString()} resources scanned
        </p>
      </div>

      {/* Recoverable waste */}
      <div className="bg-background px-8 py-7 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-400 delay-75">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
          Recoverable waste
        </p>
        <p className="text-3xl font-light text-red-400/90 tracking-[-0.03em] mt-2">
          {fmt(analysis.potentialSavings)}
        </p>
        <p className="text-xs text-muted-foreground/60">
          {wasteRate}% of total spend
        </p>
      </div>

      {/* Efficiency score */}
      <div className="bg-background px-8 py-7 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-400 delay-150">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
          Efficiency score
        </p>
        <p className="text-3xl font-light text-foreground tracking-[-0.03em] mt-2">
          {analysis.efficiencyScore}
          <span className="text-lg text-muted-foreground ml-0.5">%</span>
        </p>
        <p className="text-xs text-muted-foreground/60">
          100% = no detectable waste
        </p>
      </div>
    </div>
  );
}
