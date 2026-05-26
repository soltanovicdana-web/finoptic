import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AuditReportProps {
  report: string;
}

export function AuditReport({ report }: AuditReportProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      toast({ title: "Copied", description: "Report copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Could not access clipboard.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div>
          <h2 className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
            AI Audit Report
          </h2>
          <p className="text-sm text-muted-foreground/60 mt-0.5">
            Actionable remediation with CLI commands
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground border border-white/[0.08] hover:border-white/15 transition-all duration-150"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* Report content */}
      <div className="prose prose-sm max-w-none
        prose-invert
        prose-p:text-white/60 prose-p:leading-relaxed prose-p:font-light
        prose-headings:text-white/85 prose-headings:font-medium prose-headings:tracking-[-0.02em]
        prose-h1:text-2xl prose-h1:font-light
        prose-h2:text-base prose-h2:mt-8 prose-h2:mb-3
        prose-h3:text-sm prose-h3:mt-6 prose-h3:mb-2
        prose-strong:text-white/85 prose-strong:font-medium
        prose-a:text-white/60 prose-a:underline prose-a:underline-offset-2 prose-a:decoration-white/20
        prose-code:text-white/70 prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-white/[0.04] prose-pre:border prose-pre:border-white/[0.08] prose-pre:rounded-lg prose-pre:p-5
        prose-pre:text-white/70 prose-pre:[&_code]:bg-transparent prose-pre:[&_code]:p-0
        prose-blockquote:border-white/20 prose-blockquote:text-white/50 prose-blockquote:not-italic
        prose-hr:border-white/[0.07]
        prose-table:text-sm
        prose-thead:border-white/[0.08]
        prose-th:text-white/60 prose-th:font-medium prose-th:text-xs prose-th:uppercase prose-th:tracking-wider prose-th:py-3
        prose-td:text-white/55 prose-td:py-3 prose-td:border-white/[0.06]
        prose-tr:border-white/[0.06]
        prose-li:text-white/60 prose-li:marker:text-white/25
      ">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {report}
        </ReactMarkdown>
      </div>
    </div>
  );
}
