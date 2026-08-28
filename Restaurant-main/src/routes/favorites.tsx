import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { DishCard } from "@/components/dish-card";
import { useStore } from "@/lib/store";
import { dishes } from "@/lib/data";

export const Route = createFileRoute("/favorites")({
  head: () => ({ meta: [{ title: "Favorites — Ember & Oak" }, { name: "robots", content: "noindex" }] }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { favorites } = useStore();
  const list = dishes.filter((d) => favorites.includes(d.id));

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <h1 className="font-display text-5xl">Your favorites</h1>

        {list.length === 0 ? (
          <div className="mt-10 grid place-items-center rounded-3xl border border-dashed border-border bg-muted/30 py-20 text-center">
            <Heart className="size-10 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No favorites yet. Tap the heart on a dish to save it here.</p>
            <Link to="/menu" className="mt-6 inline-flex rounded-full bg-gradient-ember px-6 py-3 font-semibold text-primary-foreground">Browse menu</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((d, i) => <DishCard key={d.id} dish={d} index={i} />)}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}