import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BranchPerformance = {
  branchId: string;
  branchName: string;
  city: string;
  orders: number;
  completedOrders: number;
  revenue: number;
  averageOrder: number;
  performanceScore: number;
};

export const Route = createFileRoute("/admin/overview")({
  head: () => ({ meta: [{ title: "Branch Performance - Admin" }, { name: "robots", content: "noindex" }] }),
  component: BranchPerformancePage,
});

function BranchPerformancePage() {
  const [branches, setBranches] = useState<BranchPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/admin/branch-performance")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load performance")))
      .then(setBranches)
      .catch(() => setBranches([]))
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = branches.reduce((sum, branch) => sum + branch.revenue, 0);
  const totalOrders = branches.reduce((sum, branch) => sum + branch.orders, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-display text-4xl tracking-wide md:text-5xl">Branch Performance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overall performance across all four branches.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric title="Branches" value={branches.length} />
        <Metric title="Active orders" value={totalOrders} />
        <Metric title="Revenue" value={`$${totalRevenue.toFixed(2)}`} />
      </div>
      <Card>
        <CardHeader><CardTitle>Branch performance analysis</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading performance...</p> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left"><th className="p-3">Branch</th><th className="p-3">Orders</th><th className="p-3">Completed</th><th className="p-3">Revenue</th><th className="p-3">Avg. order</th><th className="p-3">Score</th></tr></thead>
              <tbody>
                {branches.map((branch) => <tr key={branch.branchId} className="border-b last:border-0"><td className="p-3"><div className="font-semibold">{branch.branchName}</div><div className="text-xs text-muted-foreground">{branch.branchId} · {branch.city}</div></td><td className="p-3">{branch.orders}</td><td className="p-3">{branch.completedOrders}</td><td className="p-3">${branch.revenue.toFixed(2)}</td><td className="p-3">${branch.averageOrder.toFixed(2)}</td><td className="p-3 font-semibold text-primary">{branch.performanceScore}/100</td></tr>)}
                {!branches.length && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No performance data available.</td></tr>}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: number | string }) {
  return <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{title}</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{value}</div></CardContent></Card>;
}
