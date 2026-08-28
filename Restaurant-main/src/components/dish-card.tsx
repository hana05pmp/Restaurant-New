import { Link } from "@tanstack/react-router";
import { Heart, Star, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { Dish } from "@/lib/data";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function DishCard({ dish, index = 0 }: { dish: Dish; index?: number }) {
  const { addToCart, isFavorite, toggleFavorite } = useStore();
  const fav = isFavorite(dish.id);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: Math.min(index, 6) * 0.05 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-elegant transition-shadow hover:shadow-ember"
    >
      <Link to="/dish/$id" params={{ id: dish.id }} className="relative block aspect-[4/3] overflow-hidden">
        <img
          src={dish.image}
          alt={dish.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {dish.newArrival && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
            New
          </span>
        )}
      </Link>
      <button
        type="button"
        aria-label={fav ? "Remove from favorites" : "Add to favorites"}
        onClick={() => {
          toggleFavorite(dish.id);
          toast.success(fav ? "Removed from favorites" : "Saved to favorites");
        }}
        className={cn(
          "absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-background/90 shadow-sm transition-colors",
          fav ? "text-accent" : "text-muted-foreground hover:text-accent",
        )}
      >
        <Heart className={cn("size-4", fav && "fill-current")} />
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to="/dish/$id" params={{ id: dish.id }} className="font-display text-lg leading-tight hover:text-primary">
            {dish.name}
          </Link>
          <span className="shrink-0 font-display text-lg text-primary">${dish.price.toFixed(2)}</span>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{dish.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3.5 fill-primary text-primary" />
            <span className="font-semibold text-foreground">{dish.rating}</span>
            <span>({dish.reviewCount})</span>
          </div>
          <button
            type="button"
            onClick={() => {
              addToCart(dish.id, 1);
              toast.success(`${dish.name} added to cart`);
            }}
            className="inline-flex items-center gap-1 rounded-full bg-gradient-ember px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-105"
          >
            <Plus className="size-3.5" /> Add
          </button>
        </div>
      </div>
    </motion.article>
  );
}