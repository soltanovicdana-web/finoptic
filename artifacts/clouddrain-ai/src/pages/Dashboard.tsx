import { useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { MetricCards } from "@/components/MetricCards";
import { LeaksTable } from "@/components/LeaksTable";
import { AuditReport } from "@/components/AuditReport";
import { Button } from "@/components/ui/button";
import { useSimulateDemoData, useRunAiAudit, type AnalysisResult } from "@workspace/api-client-react";
import { Terminal, Cpu, Loader2 } from "lucide-react";

export default function Dashboard() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [report, setReport] = useState<string | null>(null);

  const simulateMutation = useSimulateDemoData();
  const auditMutation = useRunAiAudit();

  const handleSimulate = () => {
    simulateMutation.mutate(undefined, {
      onSuccess: (data) => {
        setAnalysis(data);
        setReport(null);
      },
    });
  };

  const handleUploadSuccess = (data: AnalysisResult) => {
    setAnalysis(data);
    setReport(null);
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
        },
      }
    );
  };

  return (
    <div className="min-h-screen p-6 md:p-8 lg:max-w-[1400px] lg:mx-auto space-y-8">
      <header className="flex items-center justify-between border-b border-border pb-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 border border-primary text-primary flex items-center justify-center">
            <Terminal size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary uppercase">CloudDrain<span className="text-foreground">.AI</span></h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-sans">Automated AWS Cost Intelligence</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary))]"></span>
          <span className="text-primary">SYSTEM ONLINE</span>
        </div>
      </header>

      <main className="space-y-8">
        {!analysis ? (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
            <UploadZone
              onUploadSuccess={handleUploadSuccess}
              onSimulate={handleSimulate}
              isSimulating={simulateMutation.isPending}
            />
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <MetricCards analysis={analysis} />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Cpu className="text-destructive w-5 h-5" />
                  DETECTED CLOUD LEAKS
                </h2>
                <Button
                  onClick={handleRunAudit}
                  disabled={auditMutation.isPending || analysis.leaks.length === 0}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider rounded-none border-b-2 border-primary-foreground/50 active:border-b-0 active:translate-y-[2px] transition-all"
                >
                  {auditMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Auditing Systems...
                    </>
                  ) : (
                    "Run AI Optimization Audit"
                  )}
                </Button>
              </div>

              <LeaksTable leaks={analysis.leaks} />
            </div>

            {report && (
              <div className="pt-8 border-t border-border animate-in slide-in-from-bottom-8 fade-in duration-700">
                <AuditReport report={report} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
