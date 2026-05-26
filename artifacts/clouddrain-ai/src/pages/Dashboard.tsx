import { useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { MetricCards } from "@/components/MetricCards";
import { LeaksTable } from "@/components/LeaksTable";
import { AuditReport } from "@/components/AuditReport";
import { GhostPreview } from "@/components/GhostPreview";
import { WasteChart } from "@/components/WasteChart";
import { useSimulateDemoData, useRunAiAudit, type AnalysisResult } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  const simulateMutation = useSimulateDemoData();
  const auditMutation = useRunAiAudit();

  const handleSimulate = () => {
    simulateMutation.mutate(undefined, {
      onSuccess: (data) => {
        setAnalysis(data);
        setReport(null);
        setShowReport(false);
      },
    });
  };

  const handleUploadSuccess = (data: AnalysisResult) => {
    setAnalysis(data);
    setReport(null);
    setShowReport(false);
  };

  const handleRunAudit = () => {
    if (!analysis || analysis.leaks.length === 0) return;
    auditMutation.mutate(
      {
        data: {
          leaks: analysis.leaks,
          totalMonthlySpend: analysis.totalMonthlySpend,
          potentialSavings: analysis.potentialSavings,
        },
      },
      {
        onSuccess: (data) => {
          setReport(data.report);
          setShowReport(true);
        },
      }
    );
  };

  const handleReset = () => {
    setAnalysis(null);
    setReport(null);
    setShowReport(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/[0.07] px-8 md:px-16 lg:px-24">
        <div className="max-w-5xl mx-auto h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-semibold text-foreground tracking-[-0.02em]">CloudDrain</span>
            <span className="text-[15px] font-light text-muted-foreground tracking-[-0.01em]">AI</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-[6px] h-[6px] rounded-full bg-white/25" />
            {analysis && (
              <button
                onClick={handleReset}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-4"
              >
                New analysis
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 md:px-16 lg:px-24">

        {/* ── EMPTY STATE: upload + ghost preview ── */}
        {!analysis && (
          <div className="animate-in fade-in duration-500">
            <div className="pt-20 pb-12">
              <h1 className="text-4xl font-light text-foreground tracking-[-0.03em] leading-tight mb-3">
                Cut your AWS bill.
              </h1>
              <p className="text-base text-muted-foreground font-light leading-relaxed max-w-md">
                Upload a Cost and Usage Report to detect cloud waste — idle compute,
                orphaned storage, and unused GPU instances.
              </p>
            </div>

            <UploadZone
              onUploadSuccess={handleUploadSuccess}
              onSimulate={handleSimulate}
              isSimulating={simulateMutation.isPending}
            />

            {/* Ghost preview of what the dashboard will look like */}
            <GhostPreview />
          </div>
        )}

        {/* ── LOADED STATE: live dashboard ── */}
        {analysis && (
          <div className="py-16 space-y-14 animate-in fade-in duration-600">

            {/* Metric cards */}
            <MetricCards analysis={analysis} />

            {/* Cumulative waste chart */}
            <div className="pt-2">
              <WasteChart monthlyWaste={analysis.potentialSavings} />
            </div>

            {/* Detected leaks section */}
            <div className="space-y-6 pt-2 border-t border-white/[0.06]">
              <div className="flex items-start justify-between pt-6">
                <div>
                  <h2 className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                    Detected leaks
                  </h2>
                  <p className="text-sm text-muted-foreground/50 mt-1">
                    {analysis.leaks.length} resource{analysis.leaks.length !== 1 ? "s" : ""} flagged across {new Set(analysis.leaks.map(l => l.region)).size} regions
                  </p>
                </div>

                <button
                  onClick={handleRunAudit}
                  disabled={auditMutation.isPending || analysis.leaks.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-white text-black hover:bg-white/92 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-lg"
                >
                  {auditMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Generating audit…
                    </>
                  ) : (
                    "Run AI Optimization Audit"
                  )}
                </button>
              </div>

              <LeaksTable leaks={analysis.leaks} />
            </div>

            {/* Audit report reader — slides in below the table */}
            {showReport && report && (
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-600 pt-2 border-t border-white/[0.06]">
                <AuditReport
                  report={report}
                  onClose={() => setShowReport(false)}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
