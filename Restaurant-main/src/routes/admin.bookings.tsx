import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore, type Booking, type BookingStatus } from "@/lib/store";
import { getTablesForBranch, tables as allTables } from "@/lib/data";
import { FloorPlan } from "@/components/floor-plan";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/bookings")({
  head: () => ({ meta: [{ title: "Bookings — Admin" }, { name: "robots", content: "noindex" }] }),
  component: BookingsAdmin,
});

const statusColor: Record<BookingStatus, string> = {
  confirmed: "bg-blue-500/10 text-blue-600",
  seated: "bg-amber-500/10 text-amber-700",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-red-500/10 text-red-600",
};

export function BookingsAdmin() {
  const { bookings, adminUser, branchesState, updateBookingStatus, cancelBooking } = useStore();
  const isManager = adminUser?.role === "branch_manager";
  const forcedBranch = isManager ? adminUser?.branchId : undefined;
  const firstBranch = branchesState[0]?.id;
  const [branchFilter, setBranchFilter] = useState<string>(forcedBranch ?? firstBranch ?? "all");
  const activeBranch = forcedBranch ?? branchFilter;
  const today = format(new Date(), "yyyy-MM-dd");
  const [dateFilter, setDateFilter] = useState<string>(today);

  const filtered = useMemo(
    () =>
      bookings
        .filter((b) => activeBranch === "all" || b.branchId === activeBranch)
        .filter((b) => !dateFilter || b.date === dateFilter)
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [bookings, activeBranch, dateFilter],
  );

  const takenIds = useMemo(() => {
    const s = new Set<string>();
    for (const b of filtered) {
      if (b.status === "confirmed" || b.status === "seated") s.add(b.tableId);
    }
    return s;
  }, [filtered]);

  const branchTables = activeBranch === "all" ? allTables : getTablesForBranch(activeBranch);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-3xl tracking-wide md:text-4xl">Bookings</h1>
          <p className="text-sm text-muted-foreground">Reservations &amp; floor plan.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isManager && (
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {branchesState.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <input
            type="date"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          <Button variant="ghost" size="sm" onClick={() => setDateFilter("")}>All dates</Button>
        </div>
      </div>

      {activeBranch !== "all" && (
        <Card>
          <CardHeader>
            <CardTitle>Floor plan</CardTitle>
            <CardDescription>
              {branchesState.find((b) => b.id === activeBranch)?.name}
              {dateFilter ? ` · ${format(new Date(dateFilter), "EEE, MMM d")}` : " · all dates"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FloorPlan tables={branchTables} takenIds={takenIds} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Reservations</CardTitle>
          <CardDescription>{filtered.length} booking{filtered.length === 1 ? "" : "s"}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No bookings match this filter.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">When</th>
                  <th className="py-2 pr-4 font-medium">Guest</th>
                  <th className="py-2 pr-4 font-medium">Party</th>
                  <th className="py-2 pr-4 font-medium">Table</th>
                  <th className="py-2 pr-4 font-medium">Occasion</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <BookingRow
                    key={b.id}
                    booking={b}
                    onSeat={() => { updateBookingStatus(b.id, "seated"); toast.success("Guest seated"); }}
                    onComplete={() => { updateBookingStatus(b.id, "completed"); toast("Booking completed"); }}
                    onCancel={() => { cancelBooking(b.id); toast("Booking cancelled"); }}
                  />
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BookingRow({
  booking,
  onSeat,
  onComplete,
  onCancel,
}: {
  booking: Booking;
  onSeat: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const tableLabel = booking.tableId.split("-").slice(1).join("-").toUpperCase();
  return (
    <tr className="border-b last:border-0 align-top">
      <td className="py-3 pr-4">
        <div className="font-medium">{format(new Date(booking.date), "EEE, MMM d")}</div>
        <div className="text-xs text-muted-foreground">{booking.time} · {booking.durationMin}m</div>
      </td>
      <td className="py-3 pr-4">
        <div>{booking.guestName}</div>
        <div className="text-xs text-muted-foreground">{booking.phone}</div>
      </td>
      <td className="py-3 pr-4">{booking.partySize}</td>
      <td className="py-3 pr-4 font-mono text-xs">{tableLabel}</td>
      <td className="py-3 pr-4 text-xs">{booking.occasion ?? "—"}</td>
      <td className="py-3 pr-4">
        <Badge variant="outline" className={statusColor[booking.status]}>{booking.status}</Badge>
      </td>
      <td className="py-3 pr-4 text-right">
        <div className="flex justify-end gap-2">
          {booking.status === "confirmed" && <Button size="sm" onClick={onSeat}>Seat</Button>}
          {booking.status === "seated" && <Button size="sm" onClick={onComplete}>Complete</Button>}
          {(booking.status === "confirmed" || booking.status === "seated") && (
            <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
          )}
        </div>
      </td>
    </tr>
  );
}
