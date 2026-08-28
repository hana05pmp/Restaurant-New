import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MapPin, Users, CalendarCheck, Sparkles, UtensilsCrossed } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { branches, tables } from "@/lib/data";
import { useStore } from "@/lib/store";
import { StatusBadge } from "./orders";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a table — Ember & Oak" },
      { name: "description", content: "Reserve a table at any Ember & Oak branch. Pick your seating from an interactive floor plan." },
      { property: "og:title", content: "Book a table — Ember & Oak" },
      { property: "og:description", content: "Reserve indoor, patio, bar or private seating at any Ember & Oak branch." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ preorder: s.preorder === 1 || s.preorder === "1" ? 1 : undefined }),
  component: BookPage,
});

function BookPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/book") return <Outlet />;
  return <BookIndex />;
}

function BookIndex() {
  const { bookings, cart } = useStore();
  const { preorder } = Route.useSearch();
  const upcoming = bookings.filter((b) => b.status === "confirmed" || b.status === "seated");

  return (
    <SiteLayout>
      {preorder && cart.length > 0 && (
        <div className="border-b border-primary/30 bg-primary/5">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 text-sm md:px-6">
            <UtensilsCrossed className="size-4 text-primary" />
            <span>
              Pre-ordering <b>{cart.reduce((s, i) => s + i.qty, 0)}</b> item(s) — pick a branch and table to attach them to.
            </span>
          </div>
        </div>
      )}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="size-3.5" /> Interactive seating
            </span>
            <h1 className="mt-4 font-display text-6xl leading-none md:text-7xl">Reserve your table.</h1>
            <p className="mt-4 text-lg text-muted-foreground">Pick the branch, the time, and the exact table from our live floor plan. Booths, patio, bar or private room — it's yours.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <h2 className="font-display text-3xl">Choose a branch</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {branches.map((b, i) => {
            const seats = tables.filter((t) => t.branchId === b.id).reduce((s, t) => s + t.seats, 0);
            const tableCount = tables.filter((t) => t.branchId === b.id).length;
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to="/book/$branchId"
                  params={{ branchId: b.id }}
                  search={preorder ? { preorder: 1 } : undefined}
                  className="group block rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-elegant"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-2xl">{b.name}</h3>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="size-3.5" /> {b.address}, {b.city}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{b.hours}</span>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="size-4" /> {tableCount} tables · {seats} seats
                    </span>
                    <span className="font-semibold text-primary group-hover:underline">Choose seating →</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {upcoming.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16 md:px-6">
          <div className="flex items-center gap-2">
            <CalendarCheck className="size-5 text-primary" />
            <h2 className="font-display text-3xl">Your upcoming bookings</h2>
          </div>
          <ul className="mt-5 space-y-3">
            {upcoming.map((b) => {
              const branch = branches.find((x) => x.id === b.branchId);
              const table = tables.find((t) => t.id === b.tableId);
              return (
                <li key={b.id}>
                  <Link to="/bookings/$id" params={{ id: b.id }} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-primary/50">
                    <div>
                      <div className="font-mono text-xs text-muted-foreground">{b.id}</div>
                      <div className="font-display text-xl">{b.date} · {b.time}</div>
                      <div className="text-sm text-muted-foreground">{branch?.name} · Table {table?.label} · {b.partySize} guests</div>
                    </div>
                    <StatusBadge status={b.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </SiteLayout>
  );
}