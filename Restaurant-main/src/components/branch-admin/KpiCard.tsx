import * as React from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type KpiTrend = { value: number; label?: string };

export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = "from-primary/15 to-transparent",
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  trend?: KpiTrend;
  accent?: string;
  className?: string;
}) {
  const up = (trend?.value ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.35 }}
      className={cn("group", className)}
    >
      <Card
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elegant",
        )}
      >
        <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70", accent)} />
        <div className="relative flex items-start justify-between gap-4 p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {label}
            </div>
            <div className="mt-2 font-display text-3xl leading-none tracking-wide text-foreground md:text-4xl">
              {value}
            </div>
            {trend ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1 border-transparent px-2 py-0.5 text-[11px]",
                    up ? "bg-emerald-500/10 text-emerald-700" : "bg-destructive/10 text-destructive",
                  )}
                >
                  {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {up ? "+" : ""}
                  {trend.value.toFixed(1)}%
                </Badge>
                <span className="text-xs text-muted-foreground">{trend.label ?? "vs prev period"}</span>
              </div>
            ) : null}
          </div>
          <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-border/70 bg-background/80 text-primary shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-ember/20 group-hover:text-accent">
            <Icon className="size-5" />
          </span>
        </div>
      </Card>
    </motion.div>
  );
}
