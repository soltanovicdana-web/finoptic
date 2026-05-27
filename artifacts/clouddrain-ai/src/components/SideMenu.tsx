import { useState, useEffect } from "react";

interface SideMenuProps {
  open: boolean;
  onClose: () => void;
}

export function SideMenu({ open, onClose }: SideMenuProps) {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("finoptic_api_key");
    if (stored) setApiKey(stored);
  }, []);

  const handleSave = () => {
    localStorage.setItem("finoptic_api_key", apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  useEffect(() => {
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-[320px] bg-[#0d0d11] border-l border-white/[0.07] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 h-16 border-b border-white/[0.07] shrink-0">
          <span className="text-[13px] font-medium text-white/60 tracking-widest uppercase">Menu</span>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors duration-150 text-[18px] leading-none"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-7 py-8 space-y-10">

          {/* GitHub */}
          <div className="space-y-1">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-[14px] font-medium text-white/80 hover:text-white transition-colors duration-150 group"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                <path d="M7.5 0C3.36 0 0 3.36 0 7.5c0 3.31 2.15 6.12 5.13 7.11.37.07.51-.16.51-.36v-1.27c-2.09.46-2.53-1.01-2.53-1.01-.34-.87-.84-1.1-.84-1.1-.69-.47.05-.46.05-.46.76.05 1.16.78 1.16.78.67 1.15 1.77.82 2.2.63.07-.49.26-.82.48-1.01-1.67-.19-3.42-.83-3.42-3.71 0-.82.29-1.49.78-2.01-.08-.19-.34-.95.07-1.99 0 0 .64-.2 2.09.78A7.3 7.3 0 0 1 7.5 3.8c.65 0 1.3.09 1.91.26 1.45-.98 2.09-.78 2.09-.78.41 1.04.15 1.8.07 1.99.49.52.78 1.19.78 2.01 0 2.89-1.76 3.52-3.43 3.71.27.23.51.69.51 1.39v2.06c0 .2.14.43.51.36C12.85 13.62 15 10.81 15 7.5 15 3.36 11.64 0 7.5 0Z" fill="currentColor"/>
              </svg>
              View on GitHub
            </a>
            <p className="text-[12px] text-white/25 pl-[23px]">Star the repo to stay updated</p>
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.06]" />

          {/* LLM API Settings */}
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 text-[14px] font-medium text-white/80">
                <span className="text-[13px]">⚙</span>
                LLM API Settings
              </div>
              <p className="text-[12px] text-white/25 pl-[23px]">
                Used for AI audit reports. Falls back to a static report if unset.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-medium text-white/35 uppercase tracking-widest">
                OpenAI / Gemini API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-… or AIza…"
                className="w-full bg-white/[0.04] border border-white/[0.09] rounded-md px-3.5 py-2.5 text-[13px] text-white/80 placeholder:text-white/20 outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all duration-150 font-mono"
              />
              <button
                onClick={handleSave}
                className="w-full py-2 rounded-md text-[12px] font-medium border border-white/[0.09] text-white/50 hover:text-white/80 hover:border-white/20 transition-all duration-150"
              >
                {saved ? "Saved ✓" : "Save key locally"}
              </button>
              <p className="text-[11px] text-white/20 leading-relaxed">
                Stored in browser localStorage only — never sent to our servers.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.06]" />

          {/* FinOps Documentation */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-[14px] font-medium text-white/80">
              <span className="text-[13px]">📖</span>
              FinOps Documentation
            </div>

            <div className="space-y-3 text-[12px] text-white/35 leading-relaxed">
              <p>
                <span className="text-white/55 font-medium">How CUR logs are analyzed</span>
              </p>
              <p>
                FinOptic parses your AWS Cost & Usage Report CSV using fuzzy column matching — it works with standard CUR exports, third-party cost tools, or any generic CSV that has a cost column.
              </p>
              <p>
                <span className="text-white/45">Three waste categories are detected:</span>
              </p>
              <ul className="space-y-1.5 pl-3 border-l border-white/[0.08]">
                <li><span className="text-white/50">Underutilized compute</span> — CPU &lt; 5% on instances costing &gt; $144/mo</li>
                <li><span className="text-white/50">Orphaned storage</span> — EBS volumes in <code className="text-white/40 font-mono text-[11px]">available</code> state</li>
                <li><span className="text-white/50">Wasteful GPU</span> — p3/p4/g4/g5 instances at 0% utilization</li>
              </ul>
              <p>
                When no utilization data is present, FinOptic simulates a realistic distribution — ~30% of compute resources land in the idle bucket.
              </p>
              <a
                href="https://docs.aws.amazon.com/cur/latest/userguide/what-is-cur.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors duration-150 mt-1"
              >
                AWS CUR documentation
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 9L9 1M9 1H3M9 1v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-white/[0.07] shrink-0">
          <p className="text-[11px] text-white/20">FinOptic · v0.1.0</p>
        </div>
      </aside>
    </>
  );
}
