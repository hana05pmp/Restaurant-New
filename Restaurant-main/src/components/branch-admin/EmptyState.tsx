import { motion } from "framer-motion";
import { Ban, CookingPot, Inbox, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  title = "Nothing here yet",
  description = "Try adjusting filters or come back after some activity.",
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className,
}: {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-card/70 px-6 py-16 text-center shadow-sm",
        className,
      )}
    >
      <span className="grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-primary/15 to-transparent text-primary ring-1 ring-border/70 shadow-sm">
        <Icon className="size-7" />
      </span>
      <div className="space-y-1">
        <h3 className="font-display text-xl tracking-wide text-foreground md:text-2xl">{title}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <Button onClick={onAction} className="mt-2 rounded-full px-5">
          {actionLabel}
        </Button>
      ) : null}
    </motion.div>
  );
}

export const EmptyPresets = {
  orders: { title: "No orders match these filters", description: "Clear a status filter, pick a different branch, or place a test order.", icon: ShoppingBag },
  bookings: { title: "No reservations right now", description: "Try another date, or approve the incoming requests once guests book.", icon: CookingPot },
  reviews: { title: "Waiting on reviews", description: "Customer ratings and comments will appear here once customers leave feedback.", icon: Ban },
};
