import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarCheck, MapPin, Users, Clock, Sparkles, ShoppingBag, XCircle } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { FloorPlan } from "@/components/floor-plan";
import { useStore } from "@/lib/store";
import { branches, tables, zoneMeta } from "@/lib/data";
import { canCancel } from "@/lib/bookings";
import { StatusBadge } from "./orders";
import { toast } from "sonner";

export const Route = createFileRoute("/bookings/$id")({
  head: () => ({ meta: [{ title: "Booking — Ember & Oak" }, { name: "robots", content: "noindex" }] }),
  component: BookingDetail,
});

function BookingDetail() {
  const { id } = Route.useParams();
  const { bookings, cancelBooking, orders } = useStore();
  const navigate = useNavigate();
  const booking = bookings.find((b) => b.id === id);

  if (!booking) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="font-display text-3xl">Booking not found</h1>
          <Link to="/book" className="mt-4 inline-block text-primary">Make a reservation →</Link>
        </div>
      </SiteLayout>
    );
  }

  const branch = branches.find((b) => b.id === booking.branchId);
  const table = tables.find((t) => t.id === booking.tableId);
  const branchTables = tables.filter((t) => t.branchId === booking.branchId);
  const linked = orders.filter((o) => booking.linkedOrderIds.includes(o.id));

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-12 md:px-6">
        <Link to="/book" className="text-sm text-muted-foreground hover:text-primary">← All bookings</Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-3 font-display text-4xl">
              <CalendarCheck className="size-8 text-primary" /> Booking {booking.id}
            </h1>
            <p className="text-muted-foreground">Created {new Date(booking.createdAt).toLocaleString()}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Fact icon={<CalendarCheck className="size-4" />} label="Date" value={booking.date} />
                <Fact icon={<Clock className="size-4" />} label="Time" value={`${booking.time} · ${booking.durationMin}m`} />
                <Fact icon={<Users className="size-4" />} label="Party" value={`${booking.partySize} guests`} />
                <Fact icon={<MapPin className="size-4" />} label="Table" value={table ? `${table.label} · ${zoneMeta[table.zone].name}` : "—"} />
              </div>
              {(booking.occasion || booking.notes) && (
                <div className="mt-4 rounded-xl bg-muted/50 p-3 text-sm">
                  {booking.occasion && <div><b>Occasion:</b> {booking.occasion}</div>}
                  {booking.notes && <div className="mt-1"><b>Notes:</b> {booking.notes}</div>}
                </div>
              )}
              {booking.depositHeld > 0 && (
                <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-3 text-sm">
                  <b>${booking.depositHeld} deposit</b> held. Refundable on cancellation up to 2h before your table time.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-2xl">Your table on the plan</h2>
                <span className="text-xs text-muted-foreground">{branch?.name}</span>
              </div>
              <FloorPlan
                tables={branchTables}
                selectedId={booking.tableId}
                partySize={booking.partySize}
                compact
              />
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-display text-2xl">
                  <Sparkles className="size-5 text-primary" /> Pre-order for the table
                </h2>
                <Link to="/menu" className="inline-flex items-center gap-1 rounded-full bg-gradient-ember px-4 py-2 text-sm font-semibold text-primary-foreground shadow-ember">
                  Add dishes
                </Link>
              </div>
              {linked.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No pre-orders yet. Add dishes from the menu — we'll have them fired for your arrival.</p>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {linked.map((o) => (
                    <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                      <div>
                        <div className="font-semibold">{o.id}</div>
                        <div className="text-muted-foreground">{o.items.reduce((s, i) => s + i.qty, 0)} items · ${o.total.toFixed(2)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={o.status} />
                        <Link to="/orders/$id" params={{ id: o.id }} className="text-primary hover:underline">View</Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-display text-lg">{branch?.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{branch?.address} — {branch?.city}</p>
              <p className="mt-1 text-sm text-muted-foreground">{branch?.phone}</p>
              <p className="mt-2 text-xs text-muted-foreground">Hours: {branch?.hours}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-display text-lg">Contact for booking</h3>
              <p className="mt-1 text-sm">{booking.guestName}</p>
              <p className="text-sm text-muted-foreground">{booking.phone}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Link to="/cart" className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/40 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10">
                <ShoppingBag className="size-4" /> Go to cart
              </Link>
              {canCancel(booking) && booking.status === "confirmed" && (
                <button
                  onClick={() => {
                    cancelBooking(booking.id);
                    toast.success("Booking cancelled — deposit refunded");
                    navigate({ to: "/book" });
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-destructive/40 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <XCircle className="size-4" /> Cancel booking
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-display text-lg">{value}</div>
    </div>
  );
}