import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { zoneMeta, type Table } from "@/lib/data";

export type FloorPlanProps = {
  tables: Table[];
  takenIds?: Set<string>;
  selectedId?: string | null;
  partySize?: number;
  onSelect?: (id: string) => void;
  compact?: boolean;
};

export function FloorPlan({
  tables,
  takenIds = new Set(),
  selectedId = null,
  partySize = 1,
  onSelect,
  compact = false,
}: FloorPlanProps) {
  return (
    <div className={cn("relative w-full overflow-hidden rounded-2xl border border-border bg-muted/20 shadow-elegant", compact ? "aspect-[10/6]" : "aspect-[10/6]")}>
      <svg viewBox="0 0 100 60" className="h-full w-full" role="img" aria-label="Floor plan">
        {/* zone backgrounds */}
        <rect x="2" y="2" width="55" height="36" rx="2" fill={zoneMeta.indoor.tint} />
        <rect x="58" y="2" width="40" height="28" rx="2" fill={zoneMeta.patio.tint} />
        <rect x="75" y="19" width="23" height="12" rx="2" fill={zoneMeta.bar.tint} />
        <rect x="38" y="40" width="60" height="18" rx="2" fill={zoneMeta.private.tint} />
        {/* zone labels */}
        <text x="4" y="7" fontSize="2.4" fill={zoneMeta.indoor.color} fontWeight="700" opacity="0.7">INDOOR</text>
        <text x="60" y="7" fontSize="2.4" fill={zoneMeta.patio.color} fontWeight="700" opacity="0.7">PATIO</text>
        <text x="76.5" y="23.5" fontSize="2.2" fill={zoneMeta.bar.color} fontWeight="700" opacity="0.7">BAR</text>
        <text x="40" y="44.5" fontSize="2.4" fill={zoneMeta.private.color} fontWeight="700" opacity="0.7">PRIVATE</text>

        {/* entrance marker */}
        <rect x="0" y="27" width="2" height="6" fill="hsl(18 88% 55%)" />
        <text x="2.5" y="31.5" fontSize="2" fill="hsl(18 88% 55%)" fontWeight="600">›</text>

        {tables.map((t) => {
          const taken = takenIds.has(t.id);
          const tooSmall = partySize > t.seats;
          const selected = selectedId === t.id;
          const disabled = !onSelect || taken || tooSmall;
          const fill = selected
            ? "url(#emberGrad)"
            : taken
            ? "hsl(0 72% 52% / 0.18)"
            : tooSmall
            ? "hsl(30 6% 55% / 0.2)"
            : "hsl(0 0% 100%)";
          const stroke = selected
            ? "hsl(18 88% 55%)"
            : taken
            ? "hsl(0 72% 52%)"
            : tooSmall
            ? "hsl(30 6% 55%)"
            : zoneMeta[t.zone].color;
          const cursor = disabled ? "not-allowed" : "pointer";
          const isRound = t.shape === "round";
          return (
            <motion.g
              key={t.id}
              whileHover={!disabled ? { scale: 1.05 } : undefined}
              style={{ transformOrigin: `${t.x + t.w / 2}px ${t.y + t.h / 2}px`, cursor }}
              onClick={() => !disabled && onSelect?.(t.id)}
            >
              {isRound ? (
                <circle
                  cx={t.x + t.w / 2}
                  cy={t.y + t.h / 2}
                  r={t.w / 2}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={selected ? 0.7 : 0.35}
                />
              ) : (
                <rect
                  x={t.x}
                  y={t.y}
                  width={t.w}
                  height={t.h}
                  rx={t.shape === "booth" ? 2 : 0.8}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={selected ? 0.7 : 0.35}
                />
              )}
              <text
                x={t.x + t.w / 2}
                y={t.y + t.h / 2 - 0.2}
                fontSize="2.2"
                textAnchor="middle"
                fontWeight="700"
                fill={selected ? "white" : "hsl(20 14% 20%)"}
                style={{ pointerEvents: "none" }}
              >
                {t.label}
              </text>
              <text
                x={t.x + t.w / 2}
                y={t.y + t.h / 2 + 2.2}
                fontSize="1.6"
                textAnchor="middle"
                fill={selected ? "white" : "hsl(30 6% 45%)"}
                style={{ pointerEvents: "none" }}
              >
                {t.seats} seats
              </text>
            </motion.g>
          );
        })}

        <defs>
          <linearGradient id="emberGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(18 88% 55%)" />
            <stop offset="100%" stopColor="hsl(0 72% 52%)" />
          </linearGradient>
        </defs>
      </svg>

      {!compact && (
        <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wider">
          <LegendChip color="hsl(0 0% 100%)" border="hsl(18 88% 55%)" label="Available" />
          <LegendChip color="hsl(0 72% 52% / 0.18)" border="hsl(0 72% 52%)" label="Taken" />
          <LegendChip color="hsl(30 6% 55% / 0.2)" border="hsl(30 6% 55%)" label="Too small" />
          <LegendChip color="hsl(18 88% 55%)" border="hsl(18 88% 55%)" label="Selected" textLight />
        </div>
      )}
    </div>
  );
}

function LegendChip({ color, border, label, textLight = false }: { color: string; border: string; label: string; textLight?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border bg-background/85 px-2 py-0.5 backdrop-blur"
      style={{ borderColor: border, color: textLight ? "white" : undefined, background: textLight ? color : undefined }}
    >
      <span className="size-2 rounded-sm" style={{ background: color, border: `1px solid ${border}` }} />
      {label}
    </span>
  );
}