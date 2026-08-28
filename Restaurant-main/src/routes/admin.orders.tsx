import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranchShell } from "@/components/branch-admin/BranchShell";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Live Orders - Admin" }] }),
  component: OrdersAdmin,
});

type OrderStatus = "pending" | "placed" | "preparing" | "ready" | "completed" | "cancelled";

const statusColor: Record<OrderStatus, string> = {
  pending: "bg-orange-500/10 text-orange-700",
  placed: "bg-blue-500/10 text-blue-600",
  preparing: "bg-amber-500/10 text-amber-700",
  ready: "bg-emerald-500/10 text-emerald-700",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-red-500/10 text-red-600",
};

function OrdersAdmin() {
  const { adminUser } = useStore();
  const { activeBranchId, section } = useBranchShell();
  const [orders, setOrders] = useState<any[]>([]);
  const [status, setStatus] = useState<OrderStatus | "all">("all");

  const isManager = adminUser?.role === "branch_manager";
  const activeBranch = isManager ? adminUser?.branchId : section === "chain" ? "all" : activeBranchId || "all";

  useEffect(() => {
    if (isManager && !adminUser?.branchId) return;

    const url = activeBranch === "all"
      ? "http://127.0.0.1:8000/api/orders/all"
      : `http://127.0.0.1:8000/api/orders/${activeBranch}`;

    const loadOrders = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Unable to load orders");
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch {
        setOrders([]);
      }
    };
    loadOrders();
    const timer = window.setInterval(loadOrders, 5000);
    return () => window.clearInterval(timer);
  }, [activeBranch, adminUser?.branchId, isManager]);

  const filtered = useMemo(
    () => orders.filter((order) =>
      (status === "all" || order.status === status) &&
      (activeBranch === "all" || String(order.branchId ?? order.branch_id) === String(activeBranch)),
    ),
    [orders, status, activeBranch],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-display text-4xl">Live Orders</h1>
        <p className="text-sm text-muted-foreground">
          {activeBranch === "all" ? "All branches" : "Selected branch"}
        </p>
      </div>

      {!isManager && (
        <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus | "all")}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.keys(statusColor).map((value) => (
              <SelectItem key={value} value={value}>{value}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Card>
        <CardHeader><CardTitle>{filtered.length} orders</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left"><th className="p-2">Order</th><th className="p-2">Branch</th><th className="p-2">Total</th><th className="p-2">Status</th></tr></thead>
            <tbody>
              {filtered.map((order) => {
                const id = String(order.id ?? order._id ?? "");
                const total = Number(order.total_amount ?? order.total ?? 0);
                return <tr key={id} className="border-b last:border-0"><td className="p-2 font-mono text-xs">#{id.slice(-6)}</td><td className="p-2 text-xs">{order.branchId ?? order.branch_id ?? "-"}</td><td className="p-2">${total.toFixed(2)}</td><td className="p-2"><Badge variant="outline" className={statusColor[order.status as OrderStatus] ?? ""}>{order.status ?? "pending"}</Badge></td></tr>;
              })}
              {!filtered.length && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No orders found.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
