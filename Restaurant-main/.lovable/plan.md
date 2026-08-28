## Goal

Remove delivery from the app and add a table booking system with an interactive floor plan for seat selection. Customers can either dine-in (walk-in style order/pickup at the counter) or reserve a table with pre-order, deposit hold, and special requests.

## Scope of changes

### 1. Remove delivery
- **`src/lib/store.tsx`** — `Order` type: drop `address`, add `mode: "dine_in" | "booking"` and optional `bookingId`. Update `placeOrder` signature accordingly.
- **`src/routes/checkout.tsx`** — remove address field and delivery fee. Rename flow to "Pickup / Dine-in checkout". Total = subtotal + tax only.
- **`src/routes/orders.$id.tsx`** — replace delivery tracking steps (`out_for_delivery` → gone) with dine-in/pickup steps: `placed → preparing → ready → completed`. Update `OrderStatus` union in store. Remove the "Delivery" address card; show branch + booking link when tied to a booking.
- **`src/components/site-header.tsx` / footer** — remove any "Delivery" copy; update home hero microcopy referencing delivery (in `src/routes/index.tsx`, `branches.tsx`).

### 2. Booking data model (client-side, in `src/lib/store.tsx` + new `src/lib/bookings.ts`)
- New `Table` type per branch: `{ id, branchId, label, seats, zone: "indoor"|"patio"|"bar"|"private", shape: "round"|"square"|"booth", x, y, w, h }` — coordinates on a 100×60 grid used by the SVG floor plan.
- Seed 3 branches × ~14 tables each in `src/lib/data.ts` (extend existing `branches`).
- New `Booking` type: `id, branchId, tableId, date (YYYY-MM-DD), time (HH:mm), durationMin (default 90), partySize, guestName, phone, occasion?, notes?, preOrderItems: CartItem[], depositHeld: number, status: "confirmed"|"seated"|"completed"|"cancelled", createdAt, linkedOrderId?`.
- Store additions: `bookings`, `createBooking`, `cancelBooking`, `getTableAvailability(branchId, date, time, durationMin)` returning the set of taken table IDs (overlap check on time window). Persist via existing localStorage key.

### 3. Booking flow (new routes)
- **`src/routes/book.tsx`** — Step 1: pick branch, date (shadcn DatePicker with `pointer-events-auto`), time (30-min slots 11:00–22:00), party size (1–12). Show live availability count.
- **`src/routes/book.$branchId.tsx`** — Step 2: interactive SVG floor plan.
  - Renders zones as tinted background regions, tables as rounded rects/circles sized by seats, labels inside.
  - States: available (ember), too-small-for-party (muted), taken-for-slot (red hatched, disabled), selected (glow ring + scale via framer-motion).
  - Legend + zone filter chips. Mobile: pinch-zoom via CSS `touch-action`, tables sized min 44px tap target.
- **`src/routes/book.confirm.tsx`** — Step 3: guest details (name, phone, occasion select, notes textarea), optional **pre-order** panel (reuses `DishCard` in compact mode; items stored on booking, kitchen preps ahead), **deposit hold** shown when party ≥ 6 ($10/seat, mocked card block reusing checkout's demo card fields), review card, Confirm button → `createBooking` → redirect to booking detail.
- **`src/routes/bookings.tsx`** — list of user's bookings (upcoming / past tabs) styled like `orders.tsx`.
- **`src/routes/bookings.$id.tsx`** — booking detail: floor-plan mini-map with selected table highlighted, party details, pre-order items with total, deposit status, "Add more to pre-order" link (opens menu with booking context), "Cancel booking" (allowed >2h before, releases deposit), "Order more at the table" button once status = `seated` that seeds a dine-in cart tied to the booking.

### 4. Cart / menu integration
- **`src/routes/cart.tsx`** — add mode toggle at top: **Dine-in now** (walk-in, pick branch) vs **Attach to booking** (dropdown of upcoming confirmed bookings). Passes `mode` + `bookingId` to checkout.
- **`src/routes/checkout.tsx`** — reads mode; if `booking`, prefills branch/name/phone from booking, hides branch selector, shows "Adding to booking #EO-…".
- **`src/routes/menu.tsx` / `dish.$id.tsx`** — small banner "Reserve a table" CTA linking to `/book` (no logic change to add-to-cart).

### 5. Navigation
- **`src/components/site-header.tsx`** — add **Book a table** link (primary CTA style), add **Bookings** to the account menu. Remove any "Delivery" entry.
- **`src/routes/index.tsx`** — replace delivery-oriented hero subcopy with dine-in/booking messaging; add a "Reserve your table" secondary CTA next to the existing "Order now".

### 6. Admin (light touch — matches existing admin dashboard)
- **`src/routes/admin.index.tsx`** — add a **Bookings today** KPI card and a small "Upcoming reservations" list beneath existing KPIs. No CRUD yet; full booking management can be a later module.

## Technical notes

- All state stays in the existing `StoreProvider` + `localStorage` (frontend-only mode, per user preference).
- Floor plan is pure inline SVG with framer-motion on `<g>` elements — no map lib, safe for SSR (render deterministic layout from `tables` data).
- Availability check: booking blocks a table for `[time, time+duration)`; overlap = `aStart < bEnd && bStart < aEnd`. Runs client-side against `bookings`.
- Deposit is display-only (`depositHeld` number stored on booking; no real payment) — matches existing mock checkout.
- Time slot generator: helper in `src/lib/bookings.ts`, respects per-branch `hours` already in `data.ts`.
- Keep the "Ember & Oak" tokens; use `bg-gradient-ember` for selected tables and `shadow-ember` for the confirm CTA, consistent with checkout.

## Files touched

Create: `src/lib/bookings.ts`, `src/routes/book.tsx`, `src/routes/book.$branchId.tsx`, `src/routes/book.confirm.tsx`, `src/routes/bookings.tsx`, `src/routes/bookings.$id.tsx`, `src/components/floor-plan.tsx`.
Edit: `src/lib/store.tsx`, `src/lib/data.ts`, `src/routes/checkout.tsx`, `src/routes/cart.tsx`, `src/routes/orders.tsx`, `src/routes/orders.$id.tsx`, `src/routes/index.tsx`, `src/routes/menu.tsx`, `src/routes/dish.$id.tsx`, `src/routes/branches.tsx`, `src/components/site-header.tsx`, `src/components/site-footer.tsx`, `src/routes/admin.index.tsx`.
