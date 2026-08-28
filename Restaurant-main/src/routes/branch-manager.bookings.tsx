import { createFileRoute } from "@tanstack/react-router";
import { BookingsAdmin } from "./admin.bookings";

export const Route = createFileRoute("/branch-manager/bookings")({
  head: () => ({
    meta: [
      { title: "Reservations — Branch Manager" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="text-sm font-semibold text-primary">🔒 Branch Manager View</div>
        <div className="text-xs text-muted-foreground">
          Bookings are scoped to your branch &amp; floor plan.
        </div>
      </div>
      <BookingsAdmin />
    </div>
  ),
});
