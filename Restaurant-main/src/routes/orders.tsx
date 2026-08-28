import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { useStore } from "@/lib/store";
import { getDish, branches } from "@/lib/data";
import { Package } from "lucide-react";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Your orders — Ember & Oak" }, { name: "robots", content: "noindex" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { orders } = useStore();

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-12 md:px-6">
        <h1 className="font-display text-5xl">Your orders</h1>

        {orders.length === 0 ? (
          <div className="mt-10 grid place-items-center rounded-3xl border border-dashed border-border bg-muted/30 py-20 text-center">
            <Package className="size-10 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No orders yet.</p>
            <Link to="/menu" className="mt-6 inline-flex rounded-full bg-gradient-ember px-6 py-3 font-semibold text-primary-foreground">Start ordering</Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {orders.map((o) => {
              const b = branches.find((x) => x.id === o.branchId);
              return (
                <li key={o.id}>
                  <Link to="/orders/$id" params={{ id: o.id }} className="block rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-primary/50 hover:shadow-elegant">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-mono text-xs text-muted-foreground">{o.id}</div>
                        <div className="font-display text-xl">{o.items.reduce((s, i) => s + i.qty, 0)} items · {b?.name}</div>
                        <div className="mt-1 text-sm text-muted-foreground line-clamp-1">
                          {o.items.map((i) => `${i.qty}× ${getDish(i.dishId)?.name ?? "Item"}`).join(", ")}
                        </div>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={o.status} />
                        <div className="mt-2 font-display text-xl text-primary">${o.total.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SiteLayout>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    placed: "bg-primary/15 text-primary",
    preparing: "bg-accent/15 text-accent",
    ready: "bg-chart-4/20 text-foreground",
    completed: "bg-emerald-500/15 text-emerald-700",
    confirmed: "bg-primary/15 text-primary",
    seated: "bg-accent/15 text-accent",
    cancelled: "bg-muted text-muted-foreground",
  };
  const label = status.replace(/_/g, " ");
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${map[status] ?? "bg-muted"}`}>{label}</span>;
}