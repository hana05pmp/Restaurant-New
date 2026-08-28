import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ChefHat, PackageCheck, XCircle, Bell } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { useStore } from "@/lib/store";
import { getDish, branches } from "@/lib/data";
import { StatusBadge } from "./orders";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/orders/$id")({
  head: () => ({ meta: [{ title: "Order tracking — Ember & Oak" }, { name: "robots", content: "noindex" }] }),
  component: OrderDetail,
});

const steps = [
  { key: "placed", label: "Order placed", Icon: CheckCircle2 },
  { key: "preparing", label: "In the kitchen", Icon: ChefHat },
  { key: "ready", label: "Ready to collect", Icon: Bell },
  { key: "completed", label: "Completed", Icon: PackageCheck },
] as const;

function OrderDetail() {
  const { id } = Route.useParams();
  const { orders, cancelOrder } = useStore();
  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="font-display text-3xl">Order not found</h1>
          <Link to="/orders" className="mt-4 inline-block text-primary">View all orders →</Link>
        </div>
      </SiteLayout>
    );
  }

  const b = branches.find((x) => x.id === order.branchId);
  const currentStep = order.status === "cancelled" ? -1 : steps.findIndex((s) => s.key === order.status);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
        <Link to="/orders" className="text-sm text-muted-foreground hover:text-primary">← All orders</Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl">Order {order.id}</h1>
            <p className="text-muted-foreground">Placed {new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {order.status === "cancelled" ? (
          <div className="mt-8 rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
            <XCircle className="size-6 text-destructive" />
            <p className="mt-2 font-semibold">This order was cancelled.</p>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-elegant">
            <div className="grid grid-cols-4 gap-4">
              {steps.map((s, i) => {
                const done = i <= currentStep;
                return (
                  <div key={s.key} className="text-center">
                    <div className={cn("mx-auto grid size-12 place-items-center rounded-full transition-colors", done ? "bg-gradient-ember text-primary-foreground shadow-ember" : "bg-muted text-muted-foreground")}>
                      <s.Icon className="size-5" />
                    </div>
                    <div className={cn("mt-2 text-xs font-semibold", done ? "text-foreground" : "text-muted-foreground")}>{s.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="relative mt-4 h-1 rounded-full bg-muted">
              <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-ember transition-all" style={{ width: `${Math.max(0, currentStep) / (steps.length - 1) * 100}%` }} />
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-2xl">Items</h2>
            <ul className="mt-4 divide-y divide-border">
              {order.items.map((i) => {
                const d = getDish(i.dishId);
                if (!d) return null;
                return (
                  <li key={i.dishId} className="flex items-center gap-4 py-3">
                    <img src={d.image} alt="" className="size-14 rounded-lg object-cover" />
                    <div className="flex-1">
                      <div className="font-semibold">{d.name}</div>
                      <div className="text-sm text-muted-foreground">{i.qty} × ${d.price.toFixed(2)}</div>
                    </div>
                    <div className="font-display">${(i.qty * d.price).toFixed(2)}</div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="font-display text-lg">Total paid</span>
              <span className="font-display text-2xl text-primary">${order.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-display text-lg">{order.mode === "booking" ? "For your table" : "Pickup at"}</h3>
              <p className="mt-2 text-sm font-semibold">{b?.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{b?.address} — {b?.city}</p>
              {order.bookingId && (
                <Link to="/bookings/$id" params={{ id: order.bookingId }} className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
                  View booking {order.bookingId} →
                </Link>
              )}
            </div>
            {(order.status === "placed" || order.status === "preparing") && (
              <button onClick={() => cancelOrder(order.id)} className="w-full rounded-full border border-destructive/40 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive hover:text-destructive-foreground">
                Cancel order
              </button>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}