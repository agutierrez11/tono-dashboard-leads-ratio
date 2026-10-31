import React from "react";

interface SalesforceGaugeProps {
  value: number;
  target?: number;
  label?: string;
  sublabel?: string;
}

export const SalesforceGauge: React.FC<SalesforceGaugeProps> = ({
  value,
  target = 15,
  label = "Adopción de Meta Diaria",
  sublabel = "Toques de prospección realizados hoy",
}) => {
  // Cap between 0 and target * 1.2
  const maxDisplay = target;
  const clampedValue = Math.max(0, Math.min(value, maxDisplay));
  const percentage = (clampedValue / maxDisplay) * 100;

  // Gauge needle angle from -90deg (0%) to +90deg (100%)
  const needleAngle = -90 + (percentage / 100) * 180;

  // Zone status
  let statusText = "Ritmo Bajo";
  let statusColor = "text-rose-600";
  let statusBadge = "bg-rose-500/10 text-rose-600 border-rose-500/20";
  if (value >= 12) {
    statusText = "Ritmo Óptimo (MELI Tier 1)";
    statusColor = "text-emerald-600";
    statusBadge = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  } else if (value >= 8) {
    statusText = "Ritmo Base (Meta Mínima)";
    statusColor = "text-amber-600";
    statusBadge = "bg-amber-500/10 text-amber-600 border-amber-500/20";
  }

  return (
    <div className="flex flex-col items-center justify-between p-4 bg-card rounded-xl border shadow-sm h-full">
      <div className="w-full flex items-center justify-between pb-1">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </h4>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge}`}>
          {statusText}
        </span>
      </div>

      {/* SVG Semi-Circle Gauge */}
      <div className="relative w-48 h-28 my-2 flex items-center justify-center">
        <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
          <defs>
            {/* Soft shadow for needle */}
            <filter id="gauge-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Background Arc: Red (0 - 47%), Yellow (47% - 73%), Green (73% - 100%) */}
          {/* Red Zone (0 - 7) */}
          <path
            d="M 20 100 A 80 80 0 0 1 58 43"
            fill="none"
            stroke="#ef4444"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Yellow Zone (8 - 11) */}
          <path
            d="M 64 38 A 80 80 0 0 1 136 38"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="16"
          />
          {/* Green Zone (12 - 15+) */}
          <path
            d="M 142 43 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#10b981"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Needle */}
          <g
            transform={`rotate(${needleAngle} 100 100)`}
            className="transition-transform duration-700 ease-out"
          >
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="28"
              stroke="#0f172a"
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#gauge-shadow)"
            />
            <circle cx="100" cy="100" r="7" fill="#0f172a" />
            <circle cx="100" cy="100" r="3" fill="#ffffff" />
          </g>

          {/* Threshold markers */}
          <text x="22" y="116" fontSize="10" fill="#94a3b8" textAnchor="middle">0</text>
          <text x="60" y="24" fontSize="10" fill="#94a3b8" textAnchor="middle">7</text>
          <text x="140" y="24" fontSize="10" fill="#94a3b8" textAnchor="middle">11</text>
          <text x="178" y="116" fontSize="10" fill="#94a3b8" textAnchor="middle">15+</text>
        </svg>

        {/* Current Value Display */}
        <div className="absolute bottom-0 text-center">
          <span className="text-3xl font-extrabold tracking-tight text-foreground block leading-none">
            {value}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            / {target} toques
          </span>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground text-center mt-1">
        {sublabel}
      </p>
    </div>
  );
};
