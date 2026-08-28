import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { promotions } from "@/lib/data";

export const Route = createFileRoute("/promotions")({
  head: () => ({
    meta: [
      { title: "Offers & promotions — Ember & Oak" },
      { name: "description", content: "Weekly specials, feast codes, and combos at Ember & Oak." },
      { property: "og:title", content: "Offers & promotions — Ember & Oak" },
      { property: "og:description", content: "Weekly specials, feast codes, and combos at Ember & Oak." },
    ],
  }),
  component: PromotionsPage,
});

function PromotionsPage() {
  return (
    <SiteLayout>
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          <h1 className="font-display text-5xl md:text-6xl">Offers &amp; promotions</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">Save your favorite codes and use them at checkout.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          {promotions.map((p) => (
            <article key={p.id} className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-elegant">
              <div className="absolute -right-10 -top-10 size-40 rounded-full bg-gradient-ember opacity-10 blur-2xl" />
              <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent">{p.discount}</span>
              <h2 className="mt-3 font-display text-3xl">{p.title}</h2>
              <p className="mt-2 text-muted-foreground">{p.description}</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted px-3 py-2 text-sm">
                Code <span className="font-mono font-bold text-primary">{p.code}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}