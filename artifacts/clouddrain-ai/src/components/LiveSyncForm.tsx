import { useState } from "react";
import { useLiveAwsSync, type AnalysisResult } from "@workspace/api-client-react";
import type { LiveSyncError } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface LiveSyncFormProps {
  onSuccess: (data: AnalysisResult) => void;
}

export function LiveSyncForm({ onSuccess }: LiveSyncFormProps) {
  const [accountId, setAccountId] = useState("");
  const [roleArn, setRoleArn] = useState("");
  const [externalId, setExternalId] = useState("");

  const mutation = useLiveAwsSync();

  const errData = mutation.error?.data as LiveSyncError | undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleArn.trim() || !externalId.trim()) return;
    mutation.mutate(
      { data: { accountId: accountId.trim() || undefined, roleArn: roleArn.trim(), externalId: externalId.trim() } },
      { onSuccess }
    );
  };

  return (
    <div className="mt-2 space-y-8">

      {/* Setup instruction strip */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-6 py-5 space-y-3">
        <p className="text-[11px] font-medium text-white/40 uppercase tracking-widest">Before you connect</p>
        <ol className="space-y-2 text-[13px] text-white/45 leading-relaxed list-none">
          <li className="flex gap-3">
            <span className="text-white/20 shrink-0 tabular-nums">1.</span>
            <span>In your AWS console, create an IAM role named <code className="text-white/60 font-mono text-[12px] bg-white/[0.06] px-1.5 py-0.5 rounded">FinOpticReadOnly</code> with the trust policy below.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-white/20 shrink-0 tabular-nums">2.</span>
            <span>Attach the managed policy <code className="text-white/60 font-mono text-[12px] bg-white/[0.06] px-1.5 py-0.5 rounded">ReadOnlyAccess</code> (or the minimal policy from the ⚙ Settings menu).</span>
          </li>
          <li className="flex gap-3">
            <span className="text-white/20 shrink-0 tabular-nums">3.</span>
            <span>Copy the Role ARN and paste your chosen External ID below — it must match the trust policy <code className="text-white/60 font-mono text-[12px] bg-white/[0.06] px-1.5 py-0.5 rounded">sts:ExternalId</code> condition.</span>
          </li>
        </ol>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-white/35 uppercase tracking-widest">
            AWS Account ID <span className="normal-case tracking-normal text-white/20">(optional)</span>
          </label>
          <input
            type="text"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="123456789012"
            maxLength={12}
            className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-4 py-3 text-[14px] text-white/80 placeholder:text-white/20 outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all duration-150 font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-white/35 uppercase tracking-widest">
            IAM Role ARN <span className="text-red-400/60">*</span>
          </label>
          <input
            type="text"
            value={roleArn}
            onChange={(e) => setRoleArn(e.target.value)}
            placeholder="arn:aws:iam::123456789012:role/FinOpticReadOnly"
            required
            className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-4 py-3 text-[14px] text-white/80 placeholder:text-white/20 outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all duration-150 font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-white/35 uppercase tracking-widest">
            External ID <span className="text-red-400/60">*</span>
          </label>
          <input
            type="text"
            value={externalId}
            onChange={(e) => setExternalId(e.target.value)}
            placeholder="finoptic-prod-handshake"
            required
            className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-4 py-3 text-[14px] text-white/80 placeholder:text-white/20 outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all duration-150"
          />
          <p className="text-[12px] text-white/25">
            Must match the <code className="font-mono text-[11px]">sts:ExternalId</code> value in your IAM role trust policy.
          </p>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || !roleArn.trim() || !externalId.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-[14px] font-medium bg-white text-black hover:bg-white/92 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 mt-2"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting to AWS…
            </>
          ) : (
            "Connect & Analyze Live Account"
          )}
        </button>
      </form>

      {/* Error state */}
      {mutation.isError && errData && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-5 space-y-3 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <span className="text-red-400/80 text-[16px] mt-0.5 shrink-0">⚠</span>
            <div className="space-y-1 min-w-0">
              <p className="text-[13px] font-medium text-red-300/90">{errData.error}</p>
              <p className="text-[11px] font-mono text-red-400/40 uppercase tracking-wider">{errData.code}</p>
            </div>
          </div>

          {errData.remediation && (
            <div className="border-t border-red-500/10 pt-4 space-y-2">
              <p className="text-[11px] font-medium text-white/30 uppercase tracking-widest">How to fix</p>
              <div className="text-[12px] text-white/40 leading-relaxed prose prose-invert prose-sm max-w-none
                prose-code:text-white/60 prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[11px]
                prose-pre:bg-white/[0.04] prose-pre:border prose-pre:border-white/[0.08] prose-pre:rounded-lg prose-pre:p-4 prose-pre:text-[12px]
                prose-p:text-white/40 prose-li:text-white/40">
                <ReactMarkdown>{errData.remediation}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generic network error */}
      {mutation.isError && !errData && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-5">
          <p className="text-[13px] text-red-300/80">
            Connection failed. Check that the API server is running and your network is reachable.
          </p>
        </div>
      )}
    </div>
  );
}
