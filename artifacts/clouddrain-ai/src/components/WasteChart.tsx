interface WasteChartProps {
  monthlyWaste: number;
  ghost?: boolean;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function buildPoints(monthlyWaste: number): number[] {
  return MONTHS.map((_, i) => monthlyWaste * (i + 1));
}

const GHOST_POINTS = buildPoints(3400);

function pointsToPath(values: number[], width: number, height: number, padding = 20): string {
  const max = values[values.length - 1];
  const coords = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - (v / max) * (height - padding * 2);
    return { x, y };
  });

  const line = coords
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const area =
    line +
    ` L ${coords[coords.length - 1].x.toFixed(1)} ${(height - padding).toFixed(1)}` +
    ` L ${coords[0].x.toFixed(1)} ${(height - padding).toFixed(1)} Z`;

  return area;
}

function linePath(values: number[], width: number, height: number, padding = 20): string {
  const max = values[values.length - 1];
  return values
    .map((v, i) => {
      const x = padding + (i / (values.length - 1)) * (width - padding * 2);
      const y = height - padding - (v / max) * (height - padding * 2);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function TooltipLabel({ x, y, value }: { x: number; y: number; value: number }) {
  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
  return (
    <g>
      <circle cx={x} cy={y} r={3} fill="white" opacity={0.7} />
      <rect x={x - 36} y={y - 28} width={72} height={20} rx={4} fill="rgba(0,0,0,0.75)" />
      <text x={x} y={y - 14} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.7)" fontFamily="JetBrains Mono, monospace">
        {fmt}
      </text>
    </g>
  );
}

export function WasteChart({ monthlyWaste, ghost = false }: WasteChartProps) {
  const values = ghost ? GHOST_POINTS : buildPoints(monthlyWaste);
  const W = 800;
  const H = 160;
  const PAD = 24;

  const areaD = pointsToPath(values, W, H, PAD);
  const lineD = linePath(values, W, H, PAD);
  const gradId = ghost ? "ghostGrad" : "liveGrad";
  const strokeColor = ghost ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.6)";
  const fillOpacity = ghost ? 0.04 : 0.1;

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

  const max = values[values.length - 1];
  const xCoords = MONTHS.map((_, i) => PAD + (i / (MONTHS.length - 1)) * (W - PAD * 2));
  const yCoords = values.map((v) => H - PAD - (v / max) * (H - PAD * 2));

  return (
    <div className={ghost ? "pointer-events-none select-none" : ""}>
      <div className="flex items-baseline justify-between mb-5">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
          Cumulative waste · 12 months
        </p>
        {!ghost ? (
          <p className="text-2xl font-light text-foreground tracking-[-0.03em]">
            {fmt(monthlyWaste * 12)}
            <span className="text-sm text-muted-foreground ml-2 font-normal">projected annual</span>
          </p>
        ) : (
          <p className="text-xl font-light text-muted-foreground/30 tracking-[-0.03em]">$40,800</p>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible"
        style={{ height: H }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity={ghost ? 0.06 : 0.14} />
            <stop offset="100%" stopColor="white" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={areaD} fill={`url(#${gradId})`} opacity={fillOpacity * 10} />

        {/* Line */}
        <path d={lineD} fill="none" stroke={strokeColor} strokeWidth={1.5} strokeLinejoin="round" />

        {/* Dot at final value */}
        {!ghost && (
          <circle
            cx={xCoords[xCoords.length - 1]}
            cy={yCoords[yCoords.length - 1]}
            r={3}
            fill="white"
            opacity={0.6}
          />
        )}

        {/* X axis labels */}
        {MONTHS.map((m, i) => (
          <text
            key={m}
            x={xCoords[i]}
            y={H - 2}
            textAnchor="middle"
            fontSize={10}
            fill="rgba(255,255,255,0.22)"
            fontFamily="Inter, sans-serif"
          >
            {m}
          </text>
        ))}

        {/* Hover targets (live only) */}
        {!ghost &&
          xCoords.map((x, i) => (
            <g key={i} className="group">
              <rect
                x={x - 20}
                y={0}
                width={40}
                height={H - PAD}
                fill="transparent"
                className="cursor-crosshair"
              />
              <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                <line x1={x} y1={yCoords[i]} x2={x} y2={H - PAD} stroke="rgba(255,255,255,0.08)" strokeWidth={1} strokeDasharray="3 3" />
                <TooltipLabel x={x} y={yCoords[i]} value={values[i]} />
              </g>
            </g>
          ))}
      </svg>
    </div>
  );
}
