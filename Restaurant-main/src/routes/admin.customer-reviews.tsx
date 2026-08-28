import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare, ThumbsUp, Send, User, Calendar, Filter, TrendingUp, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/admin/customer-reviews")({
  head: () => ({
    meta: [{ title: "Customer Reviews — Ember & Oak" }, { name: "robots", content: "noindex" }],
  }),
  component: () => <ReviewsPage key="admin" />,
});

type Review = {
  id: string;
  customerName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  date: string;
  branchId: string;
  branchName: string;
  dishes: string[];
  sentiment: "Positive" | "Neutral" | "Negative";
  headline: string;
  content: string;
  approved: boolean;
  reply?: string;
};

const REVIEWS: Review[] = [
  { id: "r1", customerName: "Sophia Reynolds", rating: 5, date: "2026-07-26", branchId: "BR002", branchName: "Downtown Taste", dishes: ["Oakwood Ribeye 12oz", "Molten Chocolate Oak"], sentiment: "Positive", headline: "Anniversary dinner — perfect!", content: "The ribeye was cooked exactly medium-rare as requested. Our server remembered the occasion and brought a small dessert plate with a candle. Will absolutely be back.", approved: true, reply: "Thank you Sophia! So pleased we could make your anniversary special. — Michael, GM" },
  { id: "r2", customerName: "Daniel Kim", rating: 4, date: "2026-07-26", branchId: "BR001", branchName: "Hlaing Taste", dishes: ["Wood-Fired Margherita"], sentiment: "Positive", headline: "Great crust, slightly salty", content: "Margherita was excellent char from the wood oven. A touch more basil would elevate it further. Will come back for the patio.", approved: true },
  { id: "r3", customerName: "Maya Patel", rating: 2, date: "2026-07-25", branchId: "BR003", branchName: "Sanchaung Kitchen", dishes: ["Smoked Bacon Ember Burger"], sentiment: "Negative", headline: "Buns were stale — very disappointed", content: "The burger patty itself was great but the brioche buns seemed a day or two old. Not what I expect from Ember & Oak.", approved: false },
  { id: "r4", customerName: "Jordan Smith", rating: 5, date: "2026-07-25", branchId: "BR002", branchName: "Downtown Taste", dishes: ["Roman Carbonara", "Ember Buffalo Wings"], sentiment: "Positive", headline: "Carbonara blew me away", content: "Proper guanciale, no cream. Exactly how it's made in Rome. Buffalo wings had great heat. Fantastic overall.", approved: true },
  { id: "r5", customerName: "Ava Thompson", rating: 3, date: "2026-07-24", branchId: "BR004", branchName: "Bahan Kitchen", dishes: ["Harvest Berry Trifle"], sentiment: "Neutral", headline: "Good dessert but slow", content: "Trifle was tasty but our wait for dessert was 28 minutes on a slow Monday. Food OK, service speed could improve.", approved: true },
  { id: "r6", customerName: "Luis Hernandez", rating: 5, date: "2026-07-24", branchId: "BR003", branchName: "Sanchaung Kitchen", dishes: ["Oakwood Ribeye 12oz", "Truffle Parmesan Fries"], sentiment: "Positive", headline: "Perfect grill marks", content: "Best ribeye I've had in the city. Truffle fries were a great side. Friendly staff too.", approved: true },
  { id: "r7", customerName: "Emma Wright", rating: 1, date: "2026-07-23", branchId: "BR001", branchName: "Hlaing Taste", dishes: ["Takeout — Mixed grill"], sentiment: "Negative", headline: "Order was missing sides", content: "Ordered a family takeout, missed 2 sides and the sauces were all wrong. First bad experience in 3 years.", approved: false },
  { id: "r8", customerName: "Noah Chen", rating: 4, date: "2026-07-23", branchId: "BR002", branchName: "Downtown Taste", dishes: ["Smoked Bacon Ember Burger"], sentiment: "Positive", headline: "Lunch combo — solid!", content: "Weekday lunch combo with drink for $15 is great value. Burger was juicy, drink was cold. Good deal.", approved: true },
];

export function ReviewsPage() {
  const { adminUser, branchesState, reviews, moderateReview, replyToReview } = useStore();
  const [tab, setTab] = useState<"all" | "needs" | "five" | "fourplus">("all");
  const [replying, setReplying] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const branchFilter = adminUser?.branchId ?? "all";
  const stars = (r: number) => Array.from({ length: 5 }).map((_, i) => i < r);

  const toList = (rv: import("@/lib/store").Review) => ({
    id: rv.id,
    customerName: rv.author,
    rating: rv.rating,
    date: new Date(rv.createdAt).toISOString().slice(0, 10),
    branchId: rv.branchId,
    branchName: branchesState.find((b) => b.id === rv.branchId)?.name ?? rv.branchId,
    dishes: rv.dishId ? [rv.dishId] : [],
    sentiment: (rv.sentiment === "positive" ? "Positive" : rv.sentiment === "negative" ? "Negative" : "Neutral") as "Positive" | "Neutral" | "Negative",
    headline: rv.title,
    content: rv.body,
    approved: rv.approved,
    reply: rv.reply,
  });

  const { visible, avgRating, breakdown } = useMemo(() => {
    const list = reviews
      .filter((r) => branchFilter === "all" || r.branchId === branchFilter)
      .map(toList);
    let f = list;
    if (tab === "needs") f = list.filter((r) => !r.reply || !r.approved);
    if (tab === "five") f = list.filter((r) => r.rating === 5);
    if (tab === "fourplus") f = list.filter((r) => r.rating >= 4);
    const avg = list.length ? +(list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1) : 0;
    const counts = [5, 4, 3, 2, 1].map((s) => ({ stars: s, count: list.filter((r) => r.rating === s).length, pct: list.length ? Math.round((list.filter((r) => r.rating === s).length / list.length) * 100) : 0 }));
    return { visible: f, avgRating: avg, breakdown: counts };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, branchFilter, reviews, branchesState]);

  const branchName = (id: string) => branchesState.find((b) => b.id === id)?.name ?? id;
  const totalCount = reviews.filter((r) => branchFilter === "all" || r.branchId === branchFilter).length;
  const pendingCount = reviews.filter((r) => branchFilter === "all" || r.branchId === branchFilter).filter((r) => !r.approved || !r.reply).length;

  const sentimentCls = (s: "Positive" | "Neutral" | "Negative") => s === "Positive" ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20" : s === "Negative" ? "bg-red-500/10 text-red-600 ring-red-500/20" : "bg-slate-500/10 text-slate-600 ring-slate-500/20";

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-4xl tracking-wide md:text-5xl">Customer Reviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">Moderate, reply & learn from guest feedback.</p>
        </div>
        <Badge variant="outline" className="w-fit bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
          <Sparkles className="mr-1 size-3.5" /> {pendingCount} needs your attention
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Overall rating</CardTitle>
            <CardDescription>across {totalCount} reviews</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-end gap-3">
              <div className="font-display text-6xl tracking-wider">{avgRating}<span className="text-3xl text-muted-foreground">/5</span></div>
              <div className="pb-2">
                <div className="flex gap-0.5 text-primary">{stars(Math.round(avgRating)).map((f, i) => <Star key={i} className={cn("size-4", f ? "fill-current" : "fill-none opacity-40")} />)}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{avgRating >= 4.5 ? "Excellent!" : avgRating >= 4 ? "Very good" : avgRating >= 3 ? "Good" : "Needs work"}</div>
              </div>
            </div>
            <div className="space-y-2">
              {breakdown.map((b) => (
                <div key={b.stars} className="flex items-center gap-3 text-xs">
                  <span className="w-12 flex items-center gap-1 font-medium">{b.stars}<Star className="size-3 fill-current text-primary" /></span>
                  <Progress value={b.pct} className="h-2 flex-1" />
                  <span className="w-10 text-right text-muted-foreground">{b.count}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20"><ThumbsUp className="mr-1 size-3" /> {breakdown[0].count + breakdown[1].count} happy</Badge>
              <Badge variant="outline" className="bg-red-500/10 text-red-600 ring-1 ring-red-500/20"><MessageSquare className="mr-1 size-3" /> {pendingCount} reply</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="gap-4 space-y-0 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Latest reviews</CardTitle>
                <CardDescription>{visible.length} reviews shown</CardDescription>
              </div>
              <Tabs defaultValue="all" value={tab} onValueChange={(v) => setTab(v as any)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="needs">Needs action</TabsTrigger>
                  <TabsTrigger value="five">5★ only</TabsTrigger>
                  <TabsTrigger value="fourplus">4★+</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="space-y-4">
              {visible.map((r, i) => (
                <motion.article key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="rounded-2xl border border-border/60 p-5">
                  <header className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
                    <div className="flex items-start gap-3">
                      <Avatar><AvatarFallback className="bg-gradient-ember text-primary-foreground">{r.customerName.split(" ").map((w) => w[0]).slice(0, 2).join("")}</AvatarFallback></Avatar>
                      <div>
                        <div className="font-semibold">{r.customerName}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Calendar className="size-3" />{r.date}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1"><User className="size-3" />{branchName(r.branchId)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={cn("ring-1", sentimentCls(r.sentiment))}>{r.sentiment}</Badge>
                      {!r.approved ? <Badge className="bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20" variant="outline">Awaiting approval</Badge> : null}
                      <div className="flex gap-0.5 text-primary">{stars(r.rating).map((f, i) => <Star key={i} className={cn("size-4", f ? "fill-current" : "fill-none opacity-30")} />)}</div>
                    </div>
                  </header>
                  <h3 className="mt-3 font-semibold">{r.headline}</h3>
                  <p className="mt-1 text-sm text-foreground/80">{r.content}</p>
                  {r.dishes.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {r.dishes.map((d) => <Badge key={d} variant="outline" className="border-border/60 bg-muted/30">🍽️ {d}</Badge>)}
                    </div>
                  )}

                  {r.reply ? (
                    <div className="mt-4 rounded-xl border-l-4 border-primary/60 bg-primary/5 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                        <MessageSquare className="size-3.5" /> Management reply
                      </div>
                      <p className="mt-1 text-sm">{r.reply}</p>
                    </div>
                  ) : (
                    replying === r.id ? (
                      <div className="mt-4 space-y-2 rounded-xl border border-border/70 bg-muted/30 p-3">
                        <Textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Thank you for your feedback..." className="bg-background text-sm" />
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-gradient-ember text-primary-foreground shadow-ember hover:opacity-90" onClick={() => { replyToReview(r.id, draft); setReplying(null); setDraft(""); }}><Send className="mr-1 size-3.5" /> Send reply</Button>
                          <Button size="sm" variant="outline" onClick={() => setReplying(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : null
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {!r.approved && <Button size="sm" variant="outline" onClick={() => moderateReview(r.id, { approved: true })}><TrendingUp className="mr-1 size-3.5" /> Approve &amp; publish</Button>}
                    {!r.reply && replying !== r.id && <Button size="sm" variant="outline" onClick={() => { setReplying(r.id); setDraft(`Hi ${r.customerName.split(" ")[0]}, thank you for ` + (r.rating >= 4 ? "this great review! We're so happy you loved it — please come back soon to try our new seasonal dishes. " : "your honest feedback. We're sorry we fell short, and we'd love to make it right — please email us at care@emberandoak.com with your order details and we'll personally look into it. ")); }}><MessageSquare className="mr-1 size-3.5" /> Write reply</Button>}
                  </div>
                </motion.article>
              ))}
              {visible.length === 0 && (
                <div className="grid place-items-center rounded-xl border border-dashed border-border/70 p-12 text-center text-muted-foreground">
                  <Filter className="mb-2 size-6" /> No reviews match this filter.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
