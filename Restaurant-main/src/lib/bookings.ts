import type { Booking } from "@/lib/store";

export const DEFAULT_DURATION_MIN = 90;

/** Generate 30-min slot list for a branch (11:00–22:00). */
export function timeSlots(): string[] {
  const out: string[] = [];
  for (let h = 11; h <= 22; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 22) out.push(`${String(h).padStart(2, "0")}:30`);
  }
  return out;
}

/** Convert YYYY-MM-DD + HH:mm into a Date. */
export function toDateTime(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
}

/** Range overlap: [aStart, aEnd) vs [bStart, bEnd). */
function overlaps(aS: Date, aE: Date, bS: Date, bE: Date) {
  return aS < bE && bS < aE;
}

/** Returns Set of table ids that are taken for the given slot at the branch. */
export function takenTablesFor(
  bookings: Booking[],
  branchId: string,
  date: string,
  time: string,
  durationMin: number = DEFAULT_DURATION_MIN,
): Set<string> {
  const start = toDateTime(date, time);
  const end = new Date(start.getTime() + durationMin * 60_000);
  const taken = new Set<string>();
  for (const b of bookings) {
    if (b.branchId !== branchId) continue;
    if (b.status === "cancelled" || b.status === "completed") continue;
    const bS = toDateTime(b.date, b.time);
    const bE = new Date(bS.getTime() + (b.durationMin ?? DEFAULT_DURATION_MIN) * 60_000);
    if (overlaps(start, end, bS, bE)) taken.add(b.tableId);
  }
  return taken;
}

/** Deposit rule: $10/seat for parties of 6+, otherwise $0. */
export function depositFor(partySize: number): number {
  return partySize >= 6 ? partySize * 10 : 0;
}

/** Local today in YYYY-MM-DD. */
export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Whether a booking may still be cancelled (>2h before start). */
export function canCancel(b: Booking): boolean {
  if (b.status === "cancelled" || b.status === "completed") return false;
  const start = toDateTime(b.date, b.time);
  return start.getTime() - Date.now() > 2 * 60 * 60_000;
}