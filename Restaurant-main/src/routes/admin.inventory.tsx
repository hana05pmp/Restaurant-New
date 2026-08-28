import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Package, AlertTriangle, TrendingDown, Warehouse, ArrowDownToLine, Filter, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useBranchShell } from "@/components/branch-admin/BranchShell";

export const Route = createFileRoute("/admin/inventory")({
  head: () => ({
    meta: [{ title: "Inventory — Ember & Oak" }, { name: "robots", content: "noindex" }],
  }),
  component: () => <InventoryPage key="admin" />,
});

type InvItem = {
  id: string;
  name: string;
  category: "Protein" | "Produce" | "Dairy" | "Dry Goods" | "Beverage" | "Packaging";
  inStock: number;
  unit: string;
  reorderLevel: number;
  supplier: string;
  lastRestock: string;
};

const INV_DATA: InvItem[] = [
  { id: "i1", name: "Wagyu Beef Patty 150g", category: "Protein", inStock: 124, unit: "pcs", reorderLevel: 80, supplier: "Prime Meats Co.", lastRestock: "2026-07-25" },
  { id: "i2", name: "Dry-Aged Ribeye 12oz", category: "Protein", inStock: 18, unit: "pcs", reorderLevel: 25, supplier: "Prime Meats Co.", lastRestock: "2026-07-22" },
  { id: "i3", name: "Fior di Latte Mozzarella", category: "Dairy", inStock: 42, unit: "balls", reorderLevel: 30, supplier: "Latticini Italia", lastRestock: "2026-07-24" },
  { id: "i4", name: "San Marzano Tomato 400g", category: "Dry Goods", inStock: 220, unit: "cans", reorderLevel: 100, supplier: "Mediterranean Foods", lastRestock: "2026-07-20" },
  { id: "i5", name: "Heirloom Tomatoes", category: "Produce", inStock: 6, unit: "kg", reorderLevel: 15, supplier: "Green Valley Farm", lastRestock: "2026-07-26" },
  { id: "i6", name: "Brioche Hamburger Buns", category: "Dry Goods", inStock: 0, unit: "pcs", reorderLevel: 60, supplier: "Artisan Bakery", lastRestock: "2026-07-21" },
  { id: "i7", name: "Pecorino Romano Grated", category: "Dairy", inStock: 5.2, unit: "kg", reorderLevel: 4, supplier: "Latticini Italia", lastRestock: "2026-07-23" },
  { id: "i8", name: "Oak Hardwood Logs", category: "Dry Goods", inStock: 34, unit: "kg", reorderLevel: 50, supplier: "Hearth Supply", lastRestock: "2026-07-18" },
  { id: "i9", name: "Buffalo Wings (frozen)", category: "Protein", inStock: 88, unit: "kg", reorderLevel: 40, supplier: "Poultry Plus", lastRestock: "2026-07-25" },
  { id: "i10", name: "Arugula / Rocket", category: "Produce", inStock: 1.5, unit: "kg", reorderLevel: 3, supplier: "Green Valley Farm", lastRestock: "2026-07-26" },
  { id: "i11", name: "Craft Beer IPA 330ml", category: "Beverage", inStock: 216, unit: "btl", reorderLevel: 120, supplier: "Hop Nation", lastRestock: "2026-07-24" },
  { id: "i12", name: "Ember Aioli 1L", category: "Dairy", inStock: 11, unit: "L", reorderLevel: 15, supplier: "Signature Sauces", lastRestock: "2026-07-20" },
  { id: "i13", name: "Takeout Box Large", category: "Packaging", inStock: 540, unit: "pcs", reorderLevel: 250, supplier: "GreenPack", lastRestock: "2026-07-19" },
  { id: "i14", name: "Guanciale Diced", category: "Protein", inStock: 2.8, unit: "kg", reorderLevel: 5, supplier: "Prime Meats Co.", lastRestock: "2026-07-22" },
  { id: "i15", name: "Bucatini Pasta 500g", category: "Dry Goods", inStock: 76, unit: "packs", reorderLevel: 40, supplier: "Mediterranean Foods", lastRestock: "2026-07-24" },
];

export function InventoryPage() {
  const { adminUser } = useStore();
  const { activeBranchId } = useBranchShell();
  const branchId = adminUser?.branchId ?? activeBranchId;
  const [tab, setTab] = useState<"all" | "low" | "out">("all");
  const [q, setQ] = useState("");

  const { filtered, kpis } = useMemo(() => {
    let items = INV_DATA.map((i) => ({ ...i }));
    if (branchId === "BR003") {
      items = items.map((i) => ({ ...i, inStock: Math.max(0, Math.round(i.inStock * 0.55 * 10) / 10) }));
    }
    if (tab === "low") items = items.filter((i) => i.inStock > 0 && i.inStock <= i.reorderLevel);
    if (tab === "out") items = items.filter((i) => i.inStock === 0);
    if (q.trim()) {
      const ql = q.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(ql) || i.category.toLowerCase().includes(ql) || i.supplier.toLowerCase().includes(ql));
    }
    const totalSKUs = items.length;
    const lowStock = INV_DATA.filter((i) => i.inStock > 0 && i.inStock <= i.reorderLevel).length;
    const outStock = INV_DATA.filter((i) => i.inStock === 0).length;
    const stockValue = INV_DATA.reduce((s, i) => s + i.inStock * (i.category === "Protein" ? 8.5 : i.category === "Dairy" ? 5 : i.category === "Beverage" ? 3.2 : 1.8), 0);
    return { filtered: items, kpis: { totalSKUs: INV_DATA.length, lowStock, outStock, stockValue } };
  }, [tab, q, branchId]);

  const statusOf = (i: InvItem) => {
    if (i.inStock <= 0) return { label: "Out of Stock", cls: "bg-red-500/10 text-red-600 ring-red-500/20", icon: AlertTriangle, pct: 0 };
    const pct = Math.min(100, Math.round((i.inStock / Math.max(i.reorderLevel * 2.5, 1)) * 100));
    if (i.inStock <= i.reorderLevel) return { label: "Reorder", cls: "bg-amber-500/10 text-amber-600 ring-amber-500/20", icon: TrendingDown, pct };
    return { label: "In Stock", cls: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20", icon: Warehouse, pct };
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-4xl tracking-wide md:text-5xl">Inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">Stock levels, reorder alerts & supplier info.</p>
        </div>
        <Button className="bg-gradient-ember text-primary-foreground shadow-ember hover:opacity-90">
          <ArrowDownToLine className="mr-2 size-4" /> Create restock order
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Total SKUs" value={kpis.totalSKUs.toString()} icon={Package} accent="from-primary/20 to-primary/5" />
        <KPI label="Low Stock Alerts" value={kpis.lowStock.toString()} icon={TrendingDown} accent="from-amber-500/20 to-amber-500/5" />
        <KPI label="Out of Stock" value={kpis.outStock.toString()} icon={AlertTriangle} accent="from-red-500/20 to-red-500/5" />
        <KPI label="Est. Stock Value" value={`$${kpis.stockValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`} icon={Warehouse} accent="from-secondary/25 to-secondary/5" />
      </div>

      <Card>
        <CardHeader className="gap-4 space-y-0 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Stock list</CardTitle>
            <CardDescription>{filtered.length} items · updated this morning</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Tabs defaultValue="all" value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="low">⚠️ Low stock</TabsTrigger>
                <TabsTrigger value="out">❌ Out</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items, suppliers..." className="w-full pl-9 sm:w-64" />
            </div>
            <Button variant="outline" size="icon" title="Sort"><ArrowUpDown className="size-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">In Stock</th>
                  <th className="px-4 py-3 hidden md:table-cell">Reorder At</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Supplier</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Last Restock</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((it, i) => {
                  const s = statusOf(it);
                  const Icon = s.icon;
                  return (
                    <motion.tr key={it.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">{it.name}</div>
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline" className="border-border/70 bg-background/60">{it.category}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{it.inStock}<span className="ml-1 text-xs font-normal text-muted-foreground">{it.unit}</span></div>
                        <div className="mt-1 w-24"><Progress value={s.pct} className="h-1.5" /></div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{it.reorderLevel} {it.unit}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{it.supplier}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{it.lastRestock}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn("gap-1.5 ring-1", s.cls)}>
                          <Icon className="size-3" /> {s.label}
                        </Badge>
                      </td>
                    </motion.tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No items match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({ label, value, icon: Icon, accent }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={cn("bg-gradient-to-br", accent)}>
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
        </CardContent>
      </Card>
    </motion.div>
  );
}
