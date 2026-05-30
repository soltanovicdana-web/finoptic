import { useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { MetricCards } from "@/components/MetricCards";
import { LeaksTable } from "@/components/LeaksTable";
import { AuditReport } from "@/components/AuditReport";
import { GhostPreview } from "@/components/GhostPreview";
import { WasteChart } from "@/components/WasteChart";
import { SideMenu } from "@/components/SideMenu";
import { LiveSyncForm } from "@/components/LiveSyncForm";
import { useSimulateDemoData, useRunAiAudit, type AnalysisResult } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

type InputMode = "csv" | "live";

export default function Dashboard() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<InputMode>("csv");

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

  const handleAnalysisReady = (data: AnalysisResult) => {
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
          <div className="flex items-center">
            <span className="text-[15px] font-semibold text-white tracking-[-0.02em]">FinOptic</span>
          </div>
          <div className="flex items-center gap-4">
            {analysis && (
              <button
                onClick={handleReset}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                New analysis
              </button>
            )}
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="flex flex-col justify-center items-center gap-[5px] w-8 h-8 rounded-md hover:bg-white/[0.06] transition-colors duration-150"
            >
              <span className="block w-[16px] h-[1px] bg-white/50" />
              <span className="block w-[16px] h-[1px] bg-white/50" />
              <span className="block w-[16px] h-[1px] bg-white/50" />
            </button>
          </div>
        </div>
      </header>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="max-w-5xl mx-auto px-8 md:px-16 lg:px-24">

        {/* ── EMPTY STATE ── */}
        {!analysis && (
          <div className="animate-in fade-in duration-500">
            <div className="pt-20 pb-10">
              <h1 className="text-4xl font-light text-foreground tracking-[-0.03em] leading-tight mb-3">
                Cut your AWS bill.
              </h1>
              <p className="text-base text-muted-foreground font-light leading-relaxed max-w-md">
                {mode === "csv"
                  ? "Upload a Cost and Usage Report to detect cloud waste — idle compute, orphaned storage, and unused GPU instances."
                  : "Connect a read-only IAM role and pull live Cost Explorer + CloudWatch data directly from your AWS account."}
              </p>
            </div>

            {/* Mode toggle */}
            <div className="flex items-center gap-0 mb-8 border-b border-white/[0.07]">
              <button
                onClick={() => setMode("csv")}
                className={`relative pb-3 pr-6 text-[13px] font-medium transition-colors duration-150 ${
                  mode === "csv" ? "text-white" : "text-white/35 hover:text-white/60"
                }`}
              >
                Upload CSV
                {mode === "csv" && (
                  <span className="absolute bottom-[-1px] left-0 right-6 h-[1px] bg-white" />
                )}
              </button>
              <button
                onClick={() => setMode("live")}
                className={`relative pb-3 px-6 text-[13px] font-medium transition-colors duration-150 flex items-center gap-2 ${
                  mode === "live" ? "text-white" : "text-white/35 hover:text-white/60"
                }`}
              >
                <span
                  className={`w-[6px] h-[6px] rounded-full transition-colors duration-150 ${
                    mode === "live" ? "bg-emerald-400" : "bg-white/20"
                  }`}
                />
                Live AWS Sync
                {mode === "live" && (
                  <span className="absolute bottom-[-1px] left-0 right-6 h-[1px] bg-white" />
                )}
              </button>
            </div>

            {/* CSV / Simulate mode */}
            {mode === "csv" && (
              <>
                <UploadZone
                  onUploadSuccess={handleAnalysisReady}
                  onSimulate={handleSimulate}
                  isSimulating={simulateMutation.isPending}
                />
                <GhostPreview />
              </>
            )}

            {/* Live AWS Sync mode */}
            {mode === "live" && (
              <LiveSyncForm onSuccess={handleAnalysisReady} />
            )}
          </div>
        )}

        {/* ── LOADED STATE ── */}
        {analysis && (
          <div className="py-16 space-y-14 animate-in fade-in duration-600">

            <MetricCards analysis={analysis} />

            <div className="pt-2">
              <WasteChart monthlyWaste={analysis.potentialSavings} />
            </div>

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
