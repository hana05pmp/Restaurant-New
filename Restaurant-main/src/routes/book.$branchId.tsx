import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Clock, Users, MapPin, Info, ChevronRight } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { FloorPlan } from "@/components/floor-plan";
import { branches, tables, occasions, zoneMeta } from "@/lib/data";
import { useStore } from "@/lib/store";
import {
  DEFAULT_DURATION_MIN,
  depositFor,
  takenTablesFor,
  timeSlots,
  todayIso,
} from "@/lib/bookings";

export const Route = createFileRoute("/book/$branchId")({
  head: () => ({ meta: [{ title: "Choose your seating — Ember & Oak" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ preorder: s.preorder === 1 || s.preorder === "1" ? 1 : undefined }),
  loader: ({ params }) => {
    const branch = branches.find((b) => b.id === params.branchId);
    if (!branch) throw notFound();
    return { branch };
  },
  component: BookBranch,
});

function BookBranch() {
  const { branch } = Route.useLoaderData();
  const { preorder } = Route.useSearch();
  const navigate = useNavigate();
  const { bookings, createBooking, user, cart, clearCart } = useStore();
  const attachPreorder = !!preorder && cart.length > 0;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState("19:00");
  const [partySize, setPartySize] = useState(2);
  const [tableId, setTableId] = useState<string | null>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [occasion, setOccasion] = useState<string>("None");
  const [notes, setNotes] = useState("");
  const [zoneFilter, setZoneFilter] = useState<"all" | "indoor" | "patio" | "bar" | "private">("all");

  const branchTables = useMemo(() => tables.filter((t) => t.branchId === branch.id), [branch.id]);
  const taken = useMemo(
    () => takenTablesFor(bookings, branch.id, date, time),
    [bookings, branch.id, date, time],
  );
  const visibleTables = useMemo(
    () => (zoneFilter === "all" ? branchTables : branchTables.filter((t) => t.zone === zoneFilter)),
    [branchTables, zoneFilter],
  );
  const selectedTable = branchTables.find((t) => t.id === tableId) ?? null;
  const deposit = depositFor(partySize);

  const goStep2 = () => {
    if (!date || !time || partySize < 1) return toast.error("Set date, time and party size");
    setStep(2);
  };
  const goStep3 = () => {
    if (!tableId) return toast.error("Pick a table on the floor plan");
    setStep(3);
  };
  const confirm = () => {
    if (!tableId) return;
    if (!name || !phone) return toast.error("Add your name and phone");
    const b = createBooking({
      branchId: branch.id,
      tableId,
      date,
      time,
      durationMin: DEFAULT_DURATION_MIN,
      partySize,
      guestName: name,
      phone,
      occasion: occasion === "None" ? undefined : occasion,
      notes: notes || undefined,
      preOrderItems: attachPreorder ? cart : [],
      depositHeld: deposit,
    });
    if (attachPreorder) clearCart();
    toast.success(`Table ${selectedTable?.label} booked — ${b.id}`);
    navigate({ to: "/bookings/$id", params: { id: b.id } });
  };

  const slots = timeSlots();

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <Link to="/book" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> All branches
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-5xl">Book at {branch.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5" /> {branch.address}, {branch.city} · {branch.hours}
            </p>
          </div>
          <Stepper step={step} />
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-elegant md:p-8">
            <h2 className="font-display text-2xl">When and how many?</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              <Field icon={<Calendar className="size-4" />} label="Date">
                <input type="date" min={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} className="input" />
              </Field>
              <Field icon={<Clock className="size-4" />} label="Time">
                <select value={time} onChange={(e) => setTime(e.target.value)} className="input">
                  {slots.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field icon={<Users className="size-4" />} label="Party size">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setPartySize((n) => Math.max(1, n - 1))} className="grid size-10 place-items-center rounded-full border border-border hover:border-primary">−</button>
                  <div className="flex-1 rounded-xl border border-input bg-background py-2.5 text-center text-lg font-display">{partySize}</div>
                  <button type="button" onClick={() => setPartySize((n) => Math.min(20, n + 1))} className="grid size-10 place-items-center rounded-full border border-border hover:border-primary">+</button>
                </div>
              </Field>
            </div>
            {deposit > 0 && (
              <p className="mt-5 flex items-start gap-2 rounded-xl bg-accent/10 p-3 text-sm text-foreground">
                <Info className="mt-0.5 size-4 shrink-0 text-accent" />
                Parties of 6+ hold a refundable deposit of <b className="mx-1">${deposit}</b> ({partySize} × $10). Cancellations more than 2h before start are refunded.
              </p>
            )}
            <div className="mt-6 flex justify-end">
              <button onClick={goStep2} className="inline-flex items-center gap-2 rounded-full bg-gradient-ember px-6 py-3 font-semibold text-primary-foreground shadow-ember">
                Pick seating <ChevronRight className="size-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-elegant md:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-display text-2xl">Choose your table</div>
                  <div className="text-sm text-muted-foreground">{date} · {time} · party of {partySize}</div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <ZoneChip active={zoneFilter === "all"} onClick={() => setZoneFilter("all")} label="All" />
                  {(Object.keys(zoneMeta) as Array<keyof typeof zoneMeta>).map((z) => (
                    <ZoneChip
                      key={z}
                      active={zoneFilter === z}
                      onClick={() => setZoneFilter(z)}
                      label={zoneMeta[z].name}
                      color={zoneMeta[z].color}
                    />
                  ))}
                </div>
              </div>
              <FloorPlan
                tables={visibleTables}
                takenIds={taken}
                selectedId={tableId}
                partySize={partySize}
                onSelect={(id) => setTableId(id)}
              />
              {/* Mobile inline selection feedback */}
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 p-3 lg:hidden">
                {selectedTable ? (
                  <div className="min-w-0">
                    <div className="font-display text-lg leading-tight">Table {selectedTable.label}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {zoneMeta[selectedTable.zone].name} · seats {selectedTable.seats}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Tap an available table above.</div>
                )}
                <button
                  onClick={goStep3}
                  disabled={!tableId}
                  className="shrink-0 rounded-full bg-gradient-ember px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-ember disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>

            <aside className="hidden h-fit rounded-2xl border border-border bg-card p-6 shadow-elegant lg:block">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selected table</div>
              {selectedTable ? (
                <>
                  <div className="mt-2 font-display text-3xl">Table {selectedTable.label}</div>
                  <div className="mt-1 text-sm">
                    <span className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: zoneMeta[selectedTable.zone].tint, color: zoneMeta[selectedTable.zone].color }}>
                      {zoneMeta[selectedTable.zone].name}
                    </span>
                    <span className="ml-2 text-muted-foreground">Seats up to {selectedTable.seats}</span>
                  </div>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Tap an available table on the plan.</p>
              )}
              <div className="mt-6 space-y-2">
                <button onClick={goStep3} disabled={!tableId} className="block w-full rounded-full bg-gradient-ember py-3 text-center font-semibold text-primary-foreground shadow-ember disabled:opacity-50">
                  Continue
                </button>
                <button onClick={() => setStep(1)} className="block w-full rounded-full border border-border py-2.5 text-sm font-semibold hover:border-primary">
                  Back
                </button>
              </div>
            </aside>
          </motion.div>
        )}

        {step === 3 && selectedTable && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="font-display text-2xl">Your details</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Full name"><input required value={name} onChange={(e) => setName(e.target.value)} className="input" /></Field>
                  <Field label="Phone"><input required value={phone} onChange={(e) => setPhone(e.target.value)} className="input" /></Field>
                  <Field label="Occasion">
                    <select value={occasion} onChange={(e) => setOccasion(e.target.value)} className="input">
                      {occasions.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Notes (allergies, seating)">
                    <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. gluten-free, quiet corner" className="input" />
                  </Field>
                </div>
              </div>
              {deposit > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="font-display text-2xl">Deposit (demo)</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Card is authorised for <b>${deposit}</b> and only captured on no-show.</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label="Card"><input className="input" defaultValue="4242 4242 4242 4242" /></Field>
                    <Field label="Expiry / CVC"><input className="input" defaultValue="12/28 · 123" /></Field>
                  </div>
                </div>
              )}
            </div>

            <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-elegant">
              <h2 className="font-display text-2xl">Confirm booking</h2>
              <ul className="mt-4 space-y-2 text-sm">
                <SummaryRow label="Branch" value={branch.name} />
                <SummaryRow label="Date" value={date} />
                <SummaryRow label="Time" value={`${time} · ${DEFAULT_DURATION_MIN} min`} />
                <SummaryRow label="Party" value={`${partySize} guests`} />
                <SummaryRow label="Table" value={`${selectedTable.label} · ${zoneMeta[selectedTable.zone].name}`} />
                <SummaryRow label="Deposit" value={deposit > 0 ? `$${deposit}` : "None"} />
                {attachPreorder && (
                  <SummaryRow label="Pre-order" value={`${cart.reduce((s, i) => s + i.qty, 0)} item(s)`} />
                )}
              </ul>
              <div className="mt-6 space-y-2">
                <button onClick={confirm} className="block w-full rounded-full bg-gradient-ember py-3 text-center font-semibold text-primary-foreground shadow-ember">
                  Confirm reservation
                </button>
                <button onClick={() => setStep(2)} className="block w-full rounded-full border border-border py-2.5 text-sm font-semibold hover:border-primary">
                  Back to seating
                </button>
                <p className="pt-2 text-center text-xs text-muted-foreground">You can add dishes to pre-order from the booking page after confirming.</p>
              </div>
            </aside>
          </motion.div>
        )}
      </div>
      <style>{`.input{width:100%;border-radius:0.75rem;border:1px solid var(--color-input);background:var(--color-background);padding:0.75rem 1rem;font-size:0.875rem;outline:none}.input:focus{border-color:var(--color-primary);box-shadow:0 0 0 3px color-mix(in oklab,var(--color-primary) 20%,transparent)}`}</style>
    </SiteLayout>
  );
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["When", "Seating", "Confirm"];
  return (
    <ol className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold uppercase tracking-wider">
      {labels.map((l, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const active = step === n;
        const done = step > n;
        return (
          <li key={l} className="flex items-center gap-1.5">
            <span className={`grid size-5 place-items-center rounded-full text-[10px] ${done ? "bg-gradient-ember text-primary-foreground" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{n}</span>
            <span className={active ? "text-primary" : "text-muted-foreground"}>{l}</span>
            {n < 3 && <span className="mx-1 text-muted-foreground/60">/</span>}
          </li>
        );
      })}
    </ol>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between border-b border-border/60 pb-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </li>
  );
}

function ZoneChip({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
      style={color && active ? { borderColor: color, color, background: `${color}14` } : undefined}
    >
      {label}
    </button>
  );
}