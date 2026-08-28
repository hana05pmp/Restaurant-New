import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { DishCard } from "@/components/dish-card";
import { getRecommendations } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/recommendations")({
  head: () => ({
    meta: [
      { title: "For you — Ember & Oak" },
      { name: "description", content: "Personalized dish recommendations picked from your favorites and recent orders." },
      { property: "og:title", content: "For you — Ember & Oak" },
    ],
  }),
  component: RecommendationsPage,
});

function RecommendationsPage() {
  const { favorites, orders } = useStore();
  const recentIds = Array.from(new Set(orders.flatMap((o) => o.items.map((i) => i.dishId))));
  const list = getRecommendations(favorites, recentIds);

  return (
    <SiteLayout>
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent">
            <Sparkles className="size-3.5" /> Just for you
          </span>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">Handpicked by our AI sommelier</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            {favorites.length + recentIds.length > 0
              ? "Based on the dishes you've loved and ordered."
              : "A curated starter set — add favorites and place orders to sharpen these picks."}
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((d, i) => <DishCard key={d.id} dish={d} index={i} />)}
        </div>
      </section>
    </SiteLayout>
  );
}