import { Flame } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-secondary text-secondary-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-gradient-ember">
              <Flame className="size-5 text-primary-foreground" />
            </span>
            <span className="font-display text-2xl">Ember &amp; Oak</span>
          </div>
          <p className="mt-3 text-sm text-secondary-foreground/70">
            Fire-kitchen classics, delivered from four kitchens across the country.
          </p>
        </div>
        <div>
          <h4 className="font-display text-lg">Menu</h4>
          <ul className="mt-3 space-y-2 text-sm text-secondary-foreground/70">
            <li>Signature dishes</li>
            <li>Wood-fired pizza</li>
            <li>Grill &amp; steak</li>
            <li>Desserts</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg">Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-secondary-foreground/70">
            <li>Our branches</li>
            <li>Careers</li>
            <li>Press</li>
            <li>Contact</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg">Stay in the loop</h4>
          <p className="mt-3 text-sm text-secondary-foreground/70">
            Weekly specials, new arrivals, and Friday feast codes.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-secondary-foreground/50">
        © {new Date().getFullYear()} Ember &amp; Oak. All rights reserved.
      </div>
    </footer>
  );
}