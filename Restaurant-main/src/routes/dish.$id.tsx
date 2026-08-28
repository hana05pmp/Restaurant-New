import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Star, Clock, Flame, Heart, Minus, Plus, ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site-layout";
import { DishCard } from "@/components/dish-card";
import { getDish, getReviewsForDish, dishes } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dish/$id")({
  component: DishDetail,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-4xl">Dish not found</h1>
        <p className="mt-2 text-muted-foreground">We couldn't find that dish.</p>
        <Link to="/menu" className="mt-6 inline-flex rounded-full bg-gradient-ember px-5 py-2.5 font-semibold text-primary-foreground">
          Back to menu
        </Link>
      </div>
    </SiteLayout>
  ),
});

function DishDetail() {
  const { id } = Route.useParams();
  const dish = getDish(id);
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite, selectedBranchId } = useStore();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [apiDish, setApiDish] = useState<typeof dish>();

  useEffect(() => {
    if (dish || !selectedBranchId) return;
    fetch(`http://127.0.0.1:8000/api/menu?branch_id=${encodeURIComponent(selectedBranchId)}`)
      .then((response) => response.json())
      .then((items) => {
        const item = (Array.isArray(items) ? items : []).find(
          (entry: { id?: number | string; MenuItemId?: number }) => String(entry.id ?? entry.MenuItemId) === id,
        );
        if (item) setApiDish({
          id, name: item.name ?? item.MenuItemName ?? "Menu item",
          description: item.description ?? item.MenuItemDescription ?? "",
          price: Number(item.price ?? 0), image: item.image ?? "", categoryId: "other",
          rating: 4.5, reviewCount: 0, tags: [], prepTime: 15, calories: 0,
        });
      })
      .catch(() => undefined);
  }, [dish, id, selectedBranchId]);

  const activeDish = dish ?? apiDish;

  if (!activeDish) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="font-display text-4xl">Dish not found</h1>
          <Link to="/menu" className="mt-6 inline-block text-primary">Back to menu →</Link>
        </div>
      </SiteLayout>
    );
  }

  const fav = isFavorite(activeDish.id);
  const reviews = getReviewsForDish(activeDish.id);
  const similar = dishes.filter((d) => d.categoryId === activeDish.categoryId && d.id !== activeDish.id).slice(0, 3);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <Link to="/menu" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ChevronLeft className="size-4" /> Back to menu
        </Link>

        <div className="mt-6 grid gap-10 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="overflow-hidden rounded-3xl shadow-elegant">
            <img src={activeDish.image} alt={activeDish.name} width={900} height={900} className="h-full w-full object-cover" />
          </motion.div>

          <div>
            <div className="flex flex-wrap gap-2">
              {activeDish.tags.map((t) => (
                <span key={t} className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-accent">{t}</span>
              ))}
            </div>
            <h1 className="mt-3 font-display text-5xl md:text-6xl">{activeDish.name}</h1>
            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Star className="size-4 fill-primary text-primary" /><b className="text-foreground">{activeDish.rating}</b> ({activeDish.reviewCount} reviews)</span>
              <span className="inline-flex items-center gap-1"><Clock className="size-4" /> {activeDish.prepTime} min</span>
              <span className="inline-flex items-center gap-1"><Flame className="size-4" /> {activeDish.calories} kcal</span>
            </div>
            <p className="mt-5 text-lg text-muted-foreground">{activeDish.description}</p>

            <div className="mt-6 flex items-center gap-6">
              <span className="font-display text-4xl text-primary">${activeDish.price.toFixed(2)}</span>
              <div className="inline-flex items-center rounded-full border border-border">
                <button className="grid size-10 place-items-center hover:text-primary" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease"><Minus className="size-4" /></button>
                <span className="w-8 text-center font-semibold">{qty}</span>
                <button className="grid size-10 place-items-center hover:text-primary" onClick={() => setQty((q) => q + 1)} aria-label="Increase"><Plus className="size-4" /></button>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  for (let index = 0; index < qty; index += 1) addItem(dish);
                  toast.success(`${qty} × ${activeDish.name} added to cart`);
                }}
                className="flex-1 rounded-full bg-gradient-ember px-6 py-3 font-semibold text-primary-foreground shadow-ember transition-transform hover:scale-[1.02]"
              >
                Add to cart · ${(activeDish.price * qty).toFixed(2)}
              </button>
              <button
                onClick={() => {
                  for (let index = 0; index < qty; index += 1) addItem(dish);
                  navigate({ to: "/checkout" });
                }}
                className="rounded-full border-2 border-primary px-6 py-3 font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Order now
              </button>
              <button
                aria-label="Toggle favorite"
                onClick={() => toggleFavorite(activeDish.id)}
                className={cn("grid size-12 shrink-0 place-items-center rounded-full border-2 transition-colors", fav ? "border-accent text-accent" : "border-border text-muted-foreground hover:border-accent hover:text-accent")}
              >
                <Heart className={cn("size-5", fav && "fill-current")} />
              </button>
            </div>
          </div>
        </div>

        <section className="mt-16">
          <h2 className="font-display text-3xl">Reviews</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {reviews.length === 0 && <p className="text-muted-foreground">No reviews yet — be the first to leave one.</p>}
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{r.author}</span>
                  <span className="inline-flex items-center gap-1 text-sm text-primary">
                    {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="size-3.5 fill-current" />)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
                <span className="mt-2 block text-xs text-muted-foreground/70">{r.createdAt}</span>
              </div>
            ))}
          </div>
        </section>

        {similar.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-3xl">You may also like</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((d, i) => <DishCard key={d.id} dish={d} index={i} />)}
            </div>
          </section>
        )}
      </div>
    </SiteLayout>
  );
}