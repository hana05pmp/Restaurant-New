import { createFileRoute } from "@tanstack/react-router";
import { ReviewsPage } from "./admin.customer-reviews";

export const Route = createFileRoute("/branch-manager/customer-reviews")({
  head: () => ({
    meta: [{ title: "Reviews — Branch Manager" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <div className="space-y-4">
      <div className="mx-auto max-w-[1400px] px-4 pt-4 md:px-8 md:pt-8">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="text-sm font-semibold text-primary">🔒 Branch Manager View</div>
          <div className="text-xs text-muted-foreground">Reviews are filtered to your branch only.</div>
        </div>
      </div>
      <ReviewsPage />
    </div>
  ),
});
