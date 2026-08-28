import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  DollarSign,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";

export const Route = createFileRoute("/admin/menu-insights")({
  head: () => ({
    meta: [{ title: "Menu Insights — Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: MenuInsightsPage,
});

type InsightRow = {
  menuId: string;
  menu: string;
  category: string;
  sold: number;
  revenue: number;
  orders: number;
  growth: number | null;
  score: number;
  group: string;
  trend: string;
  action: string;
  profit: number | null;
  image?: string;
};
type Group = { name: string; count: number; example: string | null };
type InsightData = {
  branches: Array<{ id: string; name: string; city: string }>;
  hasProfit: boolean;
  groups: Group[];
  rows: InsightRow[];
  trending: InsightRow[];
};

const groupMeta = {
  "Best Sellers": {
    icon: Sparkles,
    color: "text-primary",
    panel: "bg-primary/10",
    description: "Strongest overall sales",
  },
  "Rising Stars": {
    icon: TrendingUp,
    color: "text-emerald-600",
    panel: "bg-emerald-500/10",
    description: "Fastest recent growth",
  },
  "Popular but Low Margin": {
    icon: DollarSign,
    color: "text-amber-600",
    panel: "bg-amber-500/10",
    description: "Sales are strong; profit unavailable",
  },
  "Needs Attention": {
    icon: AlertTriangle,
    color: "text-destructive",
    panel: "bg-destructive/10",
    description: "Weakest overall performance",
  },
};

const categoryColors: Record<string, string> = {
  burgers: "bg-orange-500/15 text-orange-700",
  chicken: "bg-amber-500/15 text-amber-700",
  drinks: "bg-sky-500/15 text-sky-700",
  desserts: "bg-pink-500/15 text-pink-700",
  salads: "bg-emerald-500/15 text-emerald-700",
};

function groupBadgeClass(group: string) {
  if (group === "Best Sellers") return "border-primary/30 bg-primary/10 text-primary";
  if (group === "Rising Stars") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700";
  if (group === "Popular but Low Margin")
    return "border-amber-500/30 bg-amber-500/10 text-amber-700";
  return "border-destructive/30 bg-destructive/10 text-destructive";
}

function MenuInsightsPage() {
  const [mode, setMode] = useState("overall");
  const [branch, setBranch] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [data, setData] = useState<InsightData | null>(null);
  const [error, setError] = useState("");
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(
      `http://127.0.0.1:8000/api/menu-insights?branch_id=${encodeURIComponent(mode === "branch" ? branch : "all")}`,
    )
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error("Unable to load menu insights")),
      )
      .then(setData)
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : "Unable to load menu insights"),
      );
  }, [mode, branch]);

  const rows = useMemo(
    () => data?.rows.filter((row) => selectedGroup === "all" || row.group === selectedGroup) ?? [],
    [data, selectedGroup],
  );
  const groups = data?.groups ?? [];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-4xl tracking-wide md:text-5xl">Menu Insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Analyze menu performance overall or by branch.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            value={mode}
            onValueChange={(value) => {
              setMode(value);
              setSelectedGroup("all");
            }}
          >
            <TabsList>
              <TabsTrigger value="overall">Overall</TabsTrigger>
              <TabsTrigger value="branch">By Branch</TabsTrigger>
            </TabsList>
          </Tabs>
          {mode === "branch" && data && (
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {data.branches.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}
      {!data && !error && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Loading menu insights...
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {groups.map((group) => {
              const meta = groupMeta[group.name as keyof typeof groupMeta];
              const Icon = meta.icon;
              return (
                <button
                  type="button"
                  key={group.name}
                  onClick={() => {
                    const nextGroup = selectedGroup === group.name ? "all" : group.name;
                    setSelectedGroup(nextGroup);
                    requestAnimationFrame(() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
                  }}
                  aria-pressed={selectedGroup === group.name}
                  className="text-left"
                >
                  <Card
                    className={
                      selectedGroup === group.name
                        ? `border-primary ring-1 ring-primary ${meta.panel}`
                        : `transition hover:border-primary/60 ${meta.panel}`
                    }
                  >
                    <CardHeader className="flex-row items-start justify-between space-y-0">
                      <div>
                        <CardDescription className="font-medium">{group.name}</CardDescription>
                        <CardTitle className="mt-2 text-2xl">{group.count} menus</CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">{meta.description}</p>
                      </div>
                      <span className="rounded-full bg-background/70 p-2">
                        <Icon className={`size-5 ${meta.color}`} />
                      </span>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between text-sm">
                      <span className="truncate font-medium">
                        {group.example ?? "No menu data"}
                      </span>
                      <ArrowUpRight className={`size-4 ${meta.color}`} />
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5 text-primary" /> Menu Performance Ranking
              </CardTitle>
              <CardDescription>
                Higher scores mean stronger overall performance. The score is out of 100.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span>
                  <i className="mr-1.5 inline-block size-2 rounded-full bg-primary" />
                  Overall score
                </span>
                <span>Based on sold, revenue, and orders</span>
              </div>
              {data.rows.slice(0, 10).map((row, index) => (
                <div
                  key={row.menuId}
                  className="grid grid-cols-[24px_minmax(0,1fr)_minmax(100px,2fr)_48px] items-center gap-3 text-sm"
                >
                  <span className="text-xs font-semibold text-muted-foreground">{index + 1}</span>
                  <span className="truncate font-medium">{row.menu}</span>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                      style={{ width: `${Math.max(row.score, 2)}%` }}
                    />
                  </div>
                  <span className="text-right font-bold tabular-nums">{row.score}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <section className="space-y-4">
            <div>
              <h2 className="font-display text-3xl">Trending Menus</h2>
              <p className="text-sm text-muted-foreground">
                Strongest recent sales growth from available order dates.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {data.trending.slice(0, 6).map((row) => (
                <Card key={row.menuId} className="overflow-hidden">
                  {row.image ? <img src={row.image} alt="" className="h-24 w-full object-cover" /> : <div className={`flex h-24 items-center justify-center ${categoryColors[row.category.toLowerCase()] ?? "bg-primary/10 text-primary"}`}><span className="font-display text-3xl">{row.category.slice(0, 1).toUpperCase()}</span></div>}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{row.menu}</CardTitle>
                    <CardDescription>
                      {row.category} · {row.menuId}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-between text-sm">
                    <span>{row.sold} sold</span>
                    <Badge
                      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                      variant="outline"
                    >
                      {row.growth === null
                        ? "No trend data"
                        : `${row.growth > 0 ? "+" : ""}${row.growth}% growth`}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
              {!data.trending.length && (
                <p className="text-sm text-muted-foreground">No trend data.</p>
              )}
            </div>
          </section>

          <Card ref={tableRef}>
            <CardHeader>
              <CardTitle>Menu Performance</CardTitle>
              <CardDescription>
                {selectedGroup !== "all"
                  ? `${rows.length} menus in ${selectedGroup}. The table below shows only these menus.`
                  : data.hasProfit
                  ? "Profit is calculated from available cost data."
                  : "Profit unavailable: menu_items.csv has no cost column."}
              </CardDescription>
              {selectedGroup !== "all" && (
                <Button variant="outline" size="sm" className="mt-3 w-fit" onClick={() => setSelectedGroup("all")}>
                  Clear group filter
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      {[
                        "Menu",
                        "Category",
                        "Sold",
                        "Revenue",
                        "Profit",
                        "Orders",
                        "Trend",
                        "Group",
                        "Suggested Action",
                      ].map((heading) => (
                        <th key={heading} className="px-4 py-3">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.menuId} className="border-t odd:bg-background even:bg-muted/20 hover:bg-primary/5">
                        <td className="px-4 py-3 font-medium">{row.menu}</td>
                        <td className="px-4 py-3">{row.category}</td>
                        <td className="px-4 py-3">{row.sold}</td>
                        <td className="px-4 py-3">{formatCurrency(row.revenue)}</td>
                        <td className="px-4 py-3">
                          {row.profit === null ? "Unavailable" : formatCurrency(row.profit)}
                        </td>
                        <td className="px-4 py-3">{row.orders}</td>
                        <td className={`px-4 py-3 font-medium ${row.growth !== null && row.growth > 0 ? "text-emerald-700" : row.growth !== null && row.growth < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {row.trend}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={groupBadgeClass(row.group)} variant="outline">{row.group}</Badge>
                        </td>
                        <td className="px-4 py-3">{row.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!rows.length && (
                <p className="py-8 text-center text-sm text-muted-foreground">No sales data.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
