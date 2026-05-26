import { WasteChart } from "@/components/WasteChart";

const GHOST_ROWS = [
  { id: "i-0a3f8c2e9b1d4567", region: "us-east-1", type: "Idle compute", waste: "$635" },
  { id: "i-0b7d3a1f4e2c8901", region: "us-east-2", type: "Idle compute", waste: "$467" },
  { id: "vol-0c9e4d2a7b3f1234", region: "us-west-2", type: "Orphaned storage", waste: "$312" },
  { id: "p3.8xlarge-0xd49a",  region: "eu-west-1", type: "Idle GPU",        waste: "$2,847" },
  { id: "vol-0f8b2c1e5a7d9012", region: "ap-east-1", type: "Orphaned storage", waste: "$89" },
];

export function GhostPreview() {
  return (
    <div className="relative mt-14 select-none pointer-events-none" aria-hidden="true">
      {/* Frosted label */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center z-10">
        <div className="px-4 py-1.5 rounded-full border border-white/10 bg-black/60 backdrop-blur-sm">
          <span className="text-[11px] font-medium text-white/40 uppercase tracking-widest">Preview</span>
        </div>
      </div>

      {/* Blurred content */}
      <div className="blur-[3px] opacity-30 space-y-10">
        {/* Ghost metric cards */}
        <div className="grid grid-cols-3 gap-px bg-white/[0.05] rounded-xl overflow-hidden border border-white/[0.05]">
          {[
            { label: "Monthly spend",      value: "$47,823", sub: "1,247 resources scanned" },
            { label: "Recoverable waste",  value: "$15,758", sub: "32.9% of total spend" },
            { label: "Efficiency score",   value: "67%",     sub: "100% = no detectable waste" },
          ].map((m) => (
            <div key={m.label} className="bg-background px-8 py-7 space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">{m.label}</p>
              <p className="text-3xl font-light text-foreground tracking-[-0.03em] mt-2">{m.value}</p>
              <p className="text-xs text-muted-foreground/60">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Ghost chart */}
        <div className="pt-2">
          <WasteChart monthlyWaste={3400} ghost />
        </div>

        {/* Ghost table */}
        <div className="space-y-0">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-8 pb-3 border-b border-white/[0.06]">
            {["Resource", "Region", "Type", "Monthly waste"].map((h) => (
              <span key={h} className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest last:text-right">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-white/[0.04]">
            {GHOST_ROWS.map((row) => (
              <div key={row.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-8 py-4">
                <p className="text-sm font-mono text-foreground/90 truncate">{row.id}</p>
                <p className="text-sm font-mono text-muted-foreground">{row.region}</p>
                <p className="text-xs text-muted-foreground">{row.type}</p>
                <p className="text-sm font-mono text-red-400/80 font-medium text-right">{row.waste}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient fade-out */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
