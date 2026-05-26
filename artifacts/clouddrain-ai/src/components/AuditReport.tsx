import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AuditReportProps {
  report: string;
  onClose?: () => void;
}

export function AuditReport({ report, onClose }: AuditReportProps) {
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
    <div className="pt-6 space-y-6">
      {/* Report header bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
            AI Optimization Audit
          </p>
          <p className="text-sm text-muted-foreground/50 mt-0.5">
            Detailed remediation plan with CLI commands
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground border border-white/[0.08] hover:border-white/15 transition-all duration-150"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy report"}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground border border-white/[0.08] hover:border-white/15 transition-all duration-150"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Reader container */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-8 py-8 md:px-12 md:py-10">
        <div className="prose prose-sm max-w-none
          prose-invert
          prose-p:text-white/55 prose-p:leading-7 prose-p:font-light
          prose-headings:text-white/85 prose-headings:font-medium prose-headings:tracking-[-0.02em]
          prose-h1:text-xl prose-h1:font-medium prose-h1:mb-6
          prose-h2:text-base prose-h2:mt-10 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-white/[0.06]
          prose-h3:text-sm prose-h3:mt-6 prose-h3:mb-2 prose-h3:text-white/70
          prose-strong:text-white/80 prose-strong:font-medium
          prose-a:text-white/55 prose-a:underline prose-a:underline-offset-2 prose-a:decoration-white/20 prose-a:transition-colors hover:prose-a:text-white/80
          prose-code:text-white/70 prose-code:bg-white/[0.07] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/[0.09] prose-pre:rounded-xl prose-pre:p-5 prose-pre:my-4
          prose-pre:text-white/65 prose-pre:[&_code]:bg-transparent prose-pre:[&_code]:p-0
          prose-blockquote:border-l prose-blockquote:border-white/20 prose-blockquote:text-white/45 prose-blockquote:not-italic prose-blockquote:pl-4
          prose-hr:border-white/[0.07] prose-hr:my-8
          prose-table:text-sm
          prose-thead:border-b prose-thead:border-white/[0.08]
          prose-th:text-white/55 prose-th:font-medium prose-th:text-xs prose-th:uppercase prose-th:tracking-wider prose-th:py-3 prose-th:pr-6
          prose-td:text-white/50 prose-td:py-3 prose-td:pr-6 prose-td:align-top
          prose-tr:border-b prose-tr:border-white/[0.05] last:prose-tr:border-0
          prose-li:text-white/55 prose-li:leading-7 prose-li:marker:text-white/20
          prose-ul:space-y-1 prose-ol:space-y-1
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {report}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
