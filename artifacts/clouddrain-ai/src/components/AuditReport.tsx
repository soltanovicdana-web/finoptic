import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, CheckCheck, TerminalSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      toast({
        title: "Report copied",
        description: "The audit report has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy report to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-primary flex items-center gap-2 font-sans uppercase">
          <TerminalSquare className="w-5 h-5" />
          AI OPTIMIZATION AUDIT REPORT
        </h2>
        <Button
          onClick={handleCopy}
          variant="outline"
          size="sm"
          className="h-8 rounded-none font-mono text-xs border-border hover:bg-muted"
        >
          {copied ? (
            <><CheckCheck className="w-4 h-4 mr-2 text-secondary" /> COPIED</>
          ) : (
            <><Copy className="w-4 h-4 mr-2" /> COPY REPORT</>
          )}
        </Button>
      </div>

      <div className="bg-card border border-border p-6 md:p-8 font-mono text-sm text-foreground overflow-x-auto shadow-inner relative">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-primary"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-primary"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary"></div>

        <div className="prose prose-invert prose-p:text-muted-foreground prose-headings:text-foreground prose-headings:font-sans prose-a:text-primary prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-sm prose-pre:bg-[#060a14] prose-pre:border prose-pre:border-border max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {report}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
