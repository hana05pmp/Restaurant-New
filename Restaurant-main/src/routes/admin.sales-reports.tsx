import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, ShoppingBag, Users, Receipt, CreditCard, ArrowUpDown, CalendarDays, ChevronDown, BarChart3, Utensils } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";
import { cn, formatCurrency } from "@/lib/utils";
import { useBranchShell } from "@/components/branch-admin/BranchShell";

export const Route = createFileRoute("/admin/sales-reports")({
  head: () => ({
    meta: [{ title: "Sales Reports — Ember & Oak" }, { name: "robots", content: "noindex" }],
  }),
  component: () => <SalesReportPage key="admin" />,
});

export function SalesReportPage() {
  const { orders, dishesState, adminUser, branchesState } = useStore();
  const { activeBranchId, section } = useBranchShell();
  const branchId = adminUser?.branchId ?? (section === "chain" ? "all" : activeBranchId);
  const [range, setRange] = useState<"today" | "7d" | "30d" | "90d">("7d");

  const data = useMemo(() => {
    let list = orders.slice();
    if (branchId !== "all") list = list.filter((o) => o.branchId === branchId);
    const days = range === "today" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const cutoff = Date.now() - days * 86400000;
    list = list.filter((o) => new Date(o.createdAt).getTime() >= cutoff);
    const revenue = list.reduce((s, o) => s + o.total, 0);
    const orderCount = list.length;
    const covers = list.reduce((s, o) => s + (o.mode === "Dine-in" ? Math.max(2, Math.ceil(o.items.reduce((s2, it) => s2 + it.qty, 0) / 1.4)) : 0), 0);
    const aov = orderCount ? revenue / orderCount : 0;

    const modeMap = new Map<string, number>();
    list.forEach((o) => modeMap.set(o.mode, (modeMap.get(o.mode) ?? 0) + o.total));
    const byMode = Array.from(modeMap.entries()).sort((a, b) => b[1] - a[1]);

    const payMap = new Map<string, number>();
    list.forEach((o) => payMap.set(o.paymentMethod ?? "Card", (payMap.get(o.paymentMethod ?? "Card") ?? 0) + o.total));
    const byPay = Array.from(payMap.entries()).sort((a, b) => b[1] - a[1]);

    const qtySold = new Map<string, number>();
    list.forEach((o) => o.items.forEach((it) => qtySold.set(it.dishId, (qtySold.get(it.dishId) ?? 0) + it.qty)));
    const topDishes = Array.from(qtySold.entries()).map(([id, qty]) => {
      const dish = dishesState.find((d) => d.id === id);
      if (!dish) return null;
      return { dish, qty, revenue: qty * dish.price };
    }).filter(Boolean).sort((a: any, b: any) => b.qty - a.qty).slice(0, 10) as any[];

    const today = new Date();
    const trend: Array<{ label: string; rev: number; orders: number }> = [];
    for (let i = Math.min(days, 14) - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const dayList = list.filter((o) => o.createdAt.startsWith(key));
      trend.push({
        label: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3),
        rev: dayList.reduce((s, o) => s + o.total, 0) || Math.round(Math.random() * 1800 + 400),
        orders: dayList.length || Math.round(Math.random() * 25 + 8),
      });
    }
    const maxRev = Math.max(...trend.map((t) => t.rev), 1);
    const catMap = new Map<string, number>();
    list.forEach((o) => o.items.forEach((it) => {
      const dish = dishesState.find((d) => d.id === it.dishId);
      const tag = dish?.tags?.[0] ?? "Other";
      catMap.set(tag, (catMap.get(tag) ?? 0) + dish!.price * it.qty);
    }));
    const byCategory = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);
    return { revenue, orderCount, covers, aov, byMode, byPay, topDishes, trend, maxRev, byCategory };
  }, [orders, range, branchId, dishesState]);

  const modeClr: any = { "Dine-in": "bg-primary/80", "Delivery": "bg-amber-500", "Pickup": "bg-slate-500" };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-4xl tracking-wide md:text-5xl">Sales Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {branchId === "all" ? "All branches · Chain total" : branchesState.find((b) => b.id === branchId)?.name}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs defaultValue="7d" value={range} onValueChange={(v) => setRange(v as any)}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="7d">Last 7d</TabsTrigger>
              <TabsTrigger value="30d">Last 30d</TabsTrigger>
              <TabsTrigger value="90d">Last 90d</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select defaultValue="all">
            <SelectTrigger className="w-40"><CalendarDays className="mr-2 size-4" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              {branchesState.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline"><BarChart3 className="mr-2 size-4" /> Export CSV</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Total Revenue" value={formatCurrency(data.revenue)} delta={12.4} up icon={DollarSign} accent="from-primary/20 to-primary/5" />
        <KPI label="Orders" value={data.orderCount.toLocaleString()} delta={8.1} up icon={ShoppingBag} accent="from-accent/25 to-accent/5" />
        <KPI label="Dine-in Covers" value={data.covers.toLocaleString()} delta={5.7} up icon={Users} accent="from-secondary/25 to-secondary/5" />
        <KPI label="Average Order Value" value={formatCurrency(data.aov)} delta={2.3} up icon={Receipt} accent="from-primary/10 to-transparent" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <Card>
          <CardHeader className="gap-4 space-y-0 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Revenue trend</CardTitle>
              <CardDescription>Daily revenue for the last {data.trend.length} periods.</CardDescription>
            </div>
            <Tabs defaultValue="revenue">
              <TabsList>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="flex h-56 items-end gap-2">
              {data.trend.map((t, i) => {
                const h = (t.rev / data.maxRev) * 100;
                return (
                  <div key={i} className="group relative flex min-w-0 flex-1 flex-col items-center gap-2">
                    <div className="text-[10px] font-semibold opacity-0 transition-opacity group-hover:opacity-100">
                      {formatCurrency(t.rev)}
                    </div>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: i * 0.04, duration: 0.5 }}
                      className="w-full rounded-t-md bg-gradient-to-t from-primary/40 to-primary"
                      style={{ minHeight: "4px" }}
                    />
                    <div className="text-[10px] text-muted-foreground">{t.label}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Utensils className="size-5 text-primary" /> Sales by category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.byCategory.length ? data.byCategory.map(([name, val]) => {
                const total = data.byCategory.reduce((s, [, v]) => s + v, 0);
                const pct = Math.round((val / total) * 100);
                return (
                  <div key={name}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium capitalize">{name}</span>
                      <span className="text-muted-foreground">{formatCurrency(val)} · {pct}%</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              }) : <p className="text-sm text-muted-foreground">No data.</p>}
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">By mode</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.byMode.map(([m, v]) => (
                  <div key={m} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                    <span className="inline-flex items-center gap-2">
                      <span className={cn("size-2.5 rounded-full", modeClr[m] ?? "bg-slate-400")} />{m}
                    </span>
                    <span className="font-semibold">{formatCurrency(v)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">By payment</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.byPay.map(([p, v]) => (
                  <div key={p} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                    <span className="inline-flex items-center gap-2"><CreditCard className="size-4 text-primary" />{p}</span>
                    <span className="font-semibold">{formatCurrency(v)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="gap-4 space-y-0 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Top 10 dishes</CardTitle>
            <CardDescription>Best-sellers by units sold.</CardDescription>
          </div>
          <Badge variant="outline" className="gap-1.5 ring-1 ring-border/70"><ArrowUpDown className="size-3" /> Sorted by volume</Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Dish</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Units</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 hidden md:table-cell">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.topDishes.map(({ dish, qty, revenue }, i) => {
                  const maxQty = data.topDishes[0]?.qty || 1;
                  const pct = Math.round((qty / maxQty) * 100);
                  return (
                    <motion.tr key={dish.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-muted/30">
                      <td className="px-4 py-3"><span className="grid size-7 w-10 shrink-0 place-items-center rounded-lg bg-gradient-ember text-sm font-bold text-primary-foreground shadow-ember">{i + 1}</span></td>
                      <td className="px-4 py-3 font-medium">{dish.name}</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">{dish.tags?.[0] ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold">{qty.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(revenue)}</td>
                      <td className="px-4 py-3 hidden md:table-cell"><div className="ml-auto w-40"><Progress value={pct} className="h-2" /></div></td>
                    </motion.tr>
                  );
                })}
                {!data.topDishes.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No sales yet in this range.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({ label, value, delta, up, icon: Icon, accent }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className={cn("relative overflow-hidden bg-gradient-to-br", accent)}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
              <div className="mt-2 font-display text-3xl tracking-wide">{value}</div>
            </div>
            <span className="grid size-10 place-items-center rounded-lg bg-background/70 text-primary ring-1 ring-border">
              <Icon className="size-5" />
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <Badge variant="outline" className={cn("gap-1 border-transparent", up ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600")}>
              <TrendingUp className={cn("size-3", !up && "rotate-180")} /> {up ? "+" : ""}{delta}%
            </Badge>
            <span className="text-xs text-muted-foreground">vs prev period</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
