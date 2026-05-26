import { useState, useMemo } from "react";
import { type LeakRecord, type LeakRecordLeakType } from "@workspace/api-client-react";

interface LeaksTableProps {
  leaks: LeakRecord[];
}

const LEAK_LABELS: Record<LeakRecordLeakType, string> = {
  UNDERUTILIZED_COMPUTE: "Idle compute",
  ORPHANED_STORAGE: "Orphaned storage",
  WASTEFUL_GPU: "Idle GPU",
};

const LEAK_DOT: Record<LeakRecordLeakType, string> = {
  UNDERUTILIZED_COMPUTE: "bg-white/30",
  ORPHANED_STORAGE: "bg-white/20",
  WASTEFUL_GPU: "bg-red-400/50",
};

const FILTER_OPTIONS: Array<{ value: LeakRecordLeakType | "ALL"; label: string }> = [
  { value: "ALL", label: "All types" },
  { value: "UNDERUTILIZED_COMPUTE", label: "Idle compute" },
  { value: "ORPHANED_STORAGE", label: "Orphaned storage" },
  { value: "WASTEFUL_GPU", label: "Idle GPU" },
];

export function LeaksTable({ leaks }: LeaksTableProps) {
  const [filterType, setFilterType] = useState<LeakRecordLeakType | "ALL">("ALL");

  const filteredLeaks = useMemo(() => {
    if (filterType === "ALL") return leaks;
    return leaks.filter((l) => l.leakType === filterType);
  }, [leaks, filterType]);

  const fmt = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-5">
      {/* Filter pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilterType(opt.value)}
            className={`px-3 py-1 rounded-md text-xs transition-all duration-150 ${
              filterType === opt.value
                ? "bg-white/10 text-foreground"
                : "text-muted-foreground hover:text-foreground/70"
            }`}
          >
            {opt.label}
            {opt.value !== "ALL" && (
              <span className="ml-1.5 text-white/30">
                {leaks.filter((l) => l.leakType === opt.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Open table — no gridlines */}
      <div>
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-8 px-0 pb-3 border-b border-white/[0.06]">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">Resource</span>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">Region</span>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">Type</span>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest text-right">Monthly waste</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/[0.04]">
          {filteredLeaks.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No resources matching this filter.
            </div>
          ) : (
            filteredLeaks.map((leak, idx) => (
              <div
                key={`${leak.resourceId}-${idx}`}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-x-8 py-4 hover:bg-white/[0.02] transition-colors duration-100 animate-in fade-in duration-300"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                {/* Resource ID + details */}
                <div className="min-w-0">
                  <p className="text-sm font-mono text-foreground/90 truncate">{leak.resourceId}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5 truncate max-w-sm" title={leak.details}>
                    {leak.details}
                  </p>
                </div>

                {/* Region */}
                <div className="flex items-center">
                  <span className="text-sm font-mono text-muted-foreground whitespace-nowrap">{leak.region}</span>
                </div>

                {/* Type badge — minimal dot + label */}
                <div className="flex items-center">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                    <span className={`w-1.5 h-1.5 rounded-full ${LEAK_DOT[leak.leakType]}`} />
                    {LEAK_LABELS[leak.leakType]}
                  </span>
                </div>

                {/* Waste amount */}
                <div className="flex items-center justify-end">
                  <span className="text-sm font-mono text-red-400/80 font-medium whitespace-nowrap">
                    {fmt(leak.monthlyWaste)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
