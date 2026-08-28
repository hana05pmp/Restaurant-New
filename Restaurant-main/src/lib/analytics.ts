import { branches, categories, dishes } from "@/lib/data";

// Deterministic PRNG so charts stay stable across renders.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type DailyPoint = {
  date: string; // yyyy-mm-dd
  branchId: string;
  revenue: number;
  orders: number;
  customers: number;
};

const DAYS = 180;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function buildSeries(): DailyPoint[] {
  const out: DailyPoint[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const b of branches) {
    const rand = mulberry32(hash(b.id));
    const base = 3200 + rand() * 2200; // per-day base
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dow = d.getDay();
      const weekend = dow === 5 || dow === 6 ? 1.35 : dow === 0 ? 1.15 : 0.95;
      const seasonal = 1 + Math.sin((i / DAYS) * Math.PI * 2) * 0.08;
      const noise = 0.85 + rand() * 0.3;
      const revenue = Math.round(base * weekend * seasonal * noise);
      const orders = Math.round(revenue / (28 + rand() * 8));
      const customers = Math.round(orders * (0.78 + rand() * 0.12));
      out.push({
        date: d.toISOString().slice(0, 10),
        branchId: b.id,
        revenue,
        orders,
        customers,
      });
    }
  }
  return out;
}

export const dailySeries: DailyPoint[] = buildSeries();

export function filterSeries(branchId: string, from: Date, to: Date) {
  const fromKey = from.toISOString().slice(0, 10);
  const toKey = to.toISOString().slice(0, 10);
  return dailySeries.filter(
    (p) =>
      p.date >= fromKey &&
      p.date <= toKey &&
      (branchId === "all" || p.branchId === branchId),
  );
}

export function aggregateByDate(rows: DailyPoint[]) {
  const map = new Map<string, { date: string; revenue: number; orders: number; customers: number }>();
  for (const r of rows) {
    const cur = map.get(r.date) ?? { date: r.date, revenue: 0, orders: 0, customers: 0 };
    cur.revenue += r.revenue;
    cur.orders += r.orders;
    cur.customers += r.customers;
    map.set(r.date, cur);
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function aggregateByBranch(rows: DailyPoint[]) {
  const map = new Map<string, { branchId: string; name: string; revenue: number; orders: number }>();
  for (const r of rows) {
    const b = branches.find((x) => x.id === r.branchId)!;
    const cur = map.get(r.branchId) ?? { branchId: r.branchId, name: b.name, revenue: 0, orders: 0 };
    cur.revenue += r.revenue;
    cur.orders += r.orders;
    map.set(r.branchId, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
}

export type CategoryShare = { name: string; value: number; color: string };

const catColors = [
  "hsl(18 88% 55%)",
  "hsl(0 72% 52%)",
  "hsl(34 92% 58%)",
  "hsl(155 45% 42%)",
  "hsl(210 40% 50%)",
  "hsl(280 40% 55%)",
  "hsl(45 90% 50%)",
];

export function categoryShare(rows: DailyPoint[]): CategoryShare[] {
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  // Weight each category by dish popularity/rating.
  const weights = categories.map((c) => {
    const w = dishes
      .filter((d) => d.categoryId === c.id)
      .reduce((s, d) => s + d.rating * (d.popular ? 2 : 1) * (d.featured ? 1.3 : 1), 0);
    return { c, w: w || 1 };
  });
  const sum = weights.reduce((s, x) => s + x.w, 0);
  return weights.map((x, i) => ({
    name: x.c.name,
    value: Math.round((totalRevenue * x.w) / sum),
    color: catColors[i % catColors.length],
  }));
}

export type Kpi = {
  revenue: number;
  orders: number;
  customers: number;
  avgOrder: number;
  revenueDelta: number;
  ordersDelta: number;
  customersDelta: number;
  avgOrderDelta: number;
};

export function computeKpis(current: DailyPoint[], previous: DailyPoint[]): Kpi {
  const sum = (rs: DailyPoint[]) =>
    rs.reduce(
      (a, r) => ({
        revenue: a.revenue + r.revenue,
        orders: a.orders + r.orders,
        customers: a.customers + r.customers,
      }),
      { revenue: 0, orders: 0, customers: 0 },
    );
  const c = sum(current);
  const p = sum(previous);
  const avg = c.orders ? c.revenue / c.orders : 0;
  const pavg = p.orders ? p.revenue / p.orders : 0;
  const delta = (a: number, b: number) => (b === 0 ? 0 : ((a - b) / b) * 100);
  return {
    revenue: c.revenue,
    orders: c.orders,
    customers: c.customers,
    avgOrder: avg,
    revenueDelta: delta(c.revenue, p.revenue),
    ordersDelta: delta(c.orders, p.orders),
    customersDelta: delta(c.customers, p.customers),
    avgOrderDelta: delta(avg, pavg),
  };
}

export function shiftRange(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 24 * 60 * 60 * 1000);
  const prevFrom = new Date(prevTo.getTime() - ms);
  return { prevFrom, prevTo };
}