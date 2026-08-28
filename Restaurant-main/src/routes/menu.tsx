import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Loader2,
  Plus,
  ShoppingCart,
} from "lucide-react";

import { SiteLayout } from "@/components/site-layout";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      {
        title: "Menu — Ember & Oak",
      },
      {
        name: "description",
        content: "Explore restaurant menu.",
      },
    ],
  }),

  component: MenuPage,
});


// =====================================================
// TYPES
// =====================================================

type Dish = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  prepTime: number;
  calories: number;
  imageSearchText?: string;
  availableStatus?: "Available" | "Unavailable";
};

type ApiMenuItem = {
  id?: number | string;

  name?: string;
  description?: string;

  MenuItemName?: string;
  MenuItemDescription?: string;

  category?: string;

  price?: number;

  image?: string;
};

type ApiBranch = { branchId: string; branchName: string; city: string };

type SortKey =
  | "popular"
  | "price-asc"
  | "price-desc"
  | "rating";


// =====================================================
// CATEGORIES
// =====================================================

const categories = [
  {
    id: "all",
    name: "All",
    emoji: "🍽️",
  },

  {
    id: "sandwiches",
    name: "Sandwiches",
    emoji: "🥪",
  },

  {
    id: "pizza",
    name: "Pizza",
    emoji: "🍕",
  },

  {
    id: "drinks",
    name: "Drinks",
    emoji: "🥤",
  },

  {
    id: "desserts",
    name: "Desserts",
    emoji: "🍰",
  },

  {
    id: "other",
    name: "Other",
    emoji: "🍴",
  },
];


// =====================================================
// DEFAULT PRICE
// =====================================================

function getDefaultPrice(category: string) {
  switch (category) {
    case "pizza":
      return 7;

    case "sandwiches":
      return 5;

    case "drinks":
      return 2;

    case "desserts":
      return 1.5;

    default:
      return 5;
  }
}


// =====================================================
// FORMAT MENU NAME
// =====================================================

function formatMenuName(name: string, description: string) {
  const readableDescription = description.trim();

  if (readableDescription && readableDescription !== "Delicious menu item.") {
    return readableDescription
      .replace(/\bFtLong\b/gi, "Footlong")
      .replace(/\bFtFbd\b/gi, "Flatbread")
      .replace(/\bFlatBd\b/gi, "Flatbread")
      .replace(/\bFtbk\b/gi, "Breakfast Flatbread")
      .replace(/\b6BkfFb\b/gi, "6-inch Breakfast Flatbread")
      .replace(/\b6Bkf\b/gi, "6-inch Breakfast")
      .replace(/\b6 inch\b/gi, "6-inch");
  }

  const normalizedName = name
    .replace(/^FtL\//i, "Footlong ")
    .replace(/^Six\//i, "6-inch ")
    .replace(/^FfB\//i, "Flatbread ")
    .replace(/^fBd\//i, "Flatbread ")
    .replace(/^Sld\//i, "Salad ")
    .replace(/^Mni\//i, "Mini ")
    .replace(/B\.M\.T\./gi, "B.M.T.")
    .replace(/TrkyHm/gi, "Turkey & Ham")
    .replace(/ChxTry/gi, "Chicken Teriyaki")
    .replace(/ChBcRn/gi, "Chicken Bacon Ranch")
    .replace(/CCTrio/gi, "Cold Cut Combo")
    .replace(/BqRib/gi, "BBQ Rib")
    .replace(/Meatbl/gi, "Meatball")
    .replace(/RstBf/gi, "Roast Beef")
    .replace(/RstChx/gi, "Roast Chicken")
    .replace(/Spicy/gi, "Spicy Italian")
    .replace(/Tuna/gi, "Tuna")
    .replace(/Ham/gi, "Ham")
    .replace(/Turkey/gi, "Turkey");

  return normalizedName;
}


// =====================================================
// DETECT CATEGORY
// Used only if API does not provide category
// =====================================================

function detectCategory(text: string) {
  const n = text.toLowerCase();

  // =======================
  // PIZZA
  // =======================

  if (
    n.includes("pizza") ||
    n.includes("piza") ||
    n.includes("piz")
  ) {
    return "pizza";
  }


  // =======================
  // DRINKS
  // =======================

  if (
    n.includes("coffee") ||
    n.includes("coke") ||
    n.includes("cola") ||
    n.includes("water") ||
    n.includes("fountain") ||
    n.includes("tea") ||
    n.includes("drink")
  ) {
    return "drinks";
  }


  // =======================
  // DESSERT
  // =======================

  if (
    n.includes("cookie") ||
    n.includes("dessert")
  ) {
    return "desserts";
  }


  // =======================
  // SANDWICH
  // =======================

  if (
    n.includes("ham") ||
    n.includes("steak") ||
    n.includes("chicken") ||
    n.includes("turkey") ||
    n.includes("ftl") ||
    n.includes("six") ||
    n.includes("ffb") ||
    n.includes("fbd") ||
    n.includes("ftfbd") ||
    n.includes("flatbd") ||
    n.includes("chse") ||
    n.includes("sub")
  ) {
    return "sandwiches";
  }


  return "other";
}

function normalizeCategory(category: string) {
  const normalized = category.toLowerCase().trim();

  switch (normalized) {
    case "drink":
    case "drinks":
      return "drinks";
    case "dessert":
    case "desserts":
      return "desserts";
    case "main":
    case "mains":
      return "main";
    case "side":
    case "sides":
      return "side";
    default:
      return normalized;
  }
}

function uniqueDishes(dishes: Dish[]) {
  return Array.from(
    new Map(dishes.map((dish) => [dish.id, dish])).values(),
  );
}


// =====================================================
// CONVERT API ITEM → DISH
// =====================================================

function convertMenuItem(
  item: ApiMenuItem,
  index: number
): Dish {
  const rawName =
    item.name?.trim() ||
    item.MenuItemName?.trim() ||
    `Menu Item ${index + 1}`;

  const description =
    item.description ||
    item.MenuItemDescription ||
    "Delicious menu item.";

  const name = formatMenuName(rawName, description);


  // IMPORTANT:
  // Use category from API first.
  // Example:
  // "Sandwiches" → "sandwiches"

  const categoryId = item.category
    ? normalizeCategory(item.category)
    : detectCategory(
        `${name} ${item.description || ""}`
      );


  return {
    id: String(item.id ?? index),

    name,

    description,

    price:
      Number(item.price) ||
      getDefaultPrice(categoryId),

    image: item.image?.trim() || "",

    categoryId,

    rating: 4.5,

    reviewCount: 0,

    tags: [],

    prepTime: 15,

    calories: 0,

    imageSearchText: rawName,
  };
}


// =====================================================
// MENU PAGE
// =====================================================

function MenuPage() {
  const { selectedBranchId, selectBranch } = useStore();
  const [branchOptions, setBranchOptions] = useState<ApiBranch[]>([]);
  const [branchSelectionRequired, setBranchSelectionRequired] = useState(!selectedBranchId);
  const [menu, setMenu] = useState<Dish[]>([]);

  const [query, setQuery] = useState("");

  const [category, setCategory] = useState("all");

  const [sort, setSort] =
    useState<SortKey>("popular");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const { addItem, items } = useCart();
  const selectedBranch = branchOptions.find((branch) => branch.branchId === selectedBranchId);
  const categoryOptions = useMemo(
    () => ["all", ...Array.from(new Set(menu.map((dish) => dish.categoryId)))],
    [menu],
  );

  // =====================================================
  // LOAD MENU FROM API
  // =====================================================

  useEffect(() => {
    async function loadMenu() {
      try {
        setLoading(true);
        setError("");

        const branchResponse = await fetch("http://127.0.0.1:8000/api/branches");
        if (branchResponse.ok) setBranchOptions(await branchResponse.json());


        const response = await fetch(
          `http://127.0.0.1:8000/api/menu?branch_id=${encodeURIComponent(selectedBranchId ?? "")}`
        );


        if (!response.ok) {
          throw new Error(
            `Failed to load menu (${response.status})`
          );
        }


        const data = await response.json();


        // Debug
        console.log(
          "MENU API DATA:",
          data
        );


        const apiItems: ApiMenuItem[] =
          Array.isArray(data)
            ? data
            : Array.isArray(data.items)
              ? data.items
              : [];


        const converted = apiItems.map(
          (
            item: ApiMenuItem,
            index: number
          ) =>
            convertMenuItem(
              item,
              index
            )
        );

        setMenu(uniqueDishes(converted));
      } catch (err) {
        console.error(
          "MENU ERROR:",
          err
        );


        setError(
          err instanceof Error
            ? err.message
            : "Unable to load menu"
        );
      } finally {
        setLoading(false);
      }
    }


    loadMenu();
  }, [selectedBranchId]);

  // =====================================================
  // FILTER AND SORT
  // =====================================================

  const list = useMemo(() => {
    const search =
      query
        .trim()
        .toLowerCase();


    let result = menu.filter(
      (dish) => {
        const categoryMatch =
          category === "all" ||
          dish.categoryId === category;


        const searchMatch =
          !search ||
          dish.name
            .toLowerCase()
            .includes(search) ||
          dish.description
            .toLowerCase()
            .includes(search);


        return (
          categoryMatch &&
          searchMatch
        );
      }
    );


    switch (sort) {
      case "price-asc":
        result.sort(
          (a, b) =>
            a.price - b.price
        );
        break;


      case "price-desc":
        result.sort(
          (a, b) =>
            b.price - a.price
        );
        break;


      case "rating":
        result.sort(
          (a, b) =>
            b.rating - a.rating
        );
        break;


      default:
        result.sort(
          (a, b) =>
            b.reviewCount -
            a.reviewCount
        );
    }


    return result;
  }, [
    menu,
    query,
    category,
    sort,
  ]);

  if (branchSelectionRequired || !selectedBranchId) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Ordering</p>
          <h1 className="mt-2 font-display text-5xl">Choose your branch</h1>
          <p className="mt-3 text-muted-foreground">Select a location before browsing its menu.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {branchOptions.map((branch) => (
              <button key={branch.branchId} type="button" onClick={() => { selectBranch(branch.branchId); setBranchSelectionRequired(false); }} className="rounded-2xl border bg-card p-6 text-left transition hover:border-primary/60 hover:shadow-sm">
                <h2 className="font-display text-2xl">{branch.branchName}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{branch.city}</p>
                <p className="mt-4 text-sm font-semibold text-primary">View menu</p>
              </button>
            ))}
            {!branchOptions.length && <p className="text-sm text-muted-foreground">Loading branches...</p>}
          </div>
        </section>
      </SiteLayout>
    );
  }


  // =====================================================
  // CART COUNT
  // =====================================================

  const cartCount =
    items.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );


  // =====================================================
  // PAGE
  // =====================================================

  return (
    <SiteLayout>

      {/* =================================================
          HEADER
      ================================================= */}

      <section
        className="
          border-b
          bg-muted/20
        "
      >
        <div
          className="
            mx-auto
            max-w-7xl
            px-4
            py-10
          "
        >

          <div
            className="
              flex
              justify-between
              items-start
            "
          >

            {/* TITLE */}

            <div>
              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-widest
                  text-primary
                "
              >
                Ember & Oak
              </p>


              <h1
                className="
                  text-5xl
                  font-bold
                  mt-2
                "
              >
                {selectedBranch?.branchName ?? "Branch"} Menu
              </h1>


              <p
                className="
                  text-muted-foreground
                  mt-3
                "
              >
                Choose your favourite
                menu items
              </p>
            </div>


            {/* CART */}

            <Link
              to="/cart"
              className="
                rounded-full
                border
                px-4
                py-3
                flex
                gap-2
                items-center
              "
            >

              <ShoppingCart
                size={20}
              />

              Cart


              {cartCount > 0 && (
                <span
                  className="
                    rounded-full
                    bg-primary
                    text-white
                    px-2
                  "
                >
                  {cartCount}
                </span>
              )}

            </Link>

          </div>


          {/* =================================================
              CATEGORY BUTTONS
          ================================================= */}

          <div
            className="
              mt-6
              flex
              flex-wrap
              gap-2
            "
          >

            {categoryOptions.map(
              (item) => (
                <button
                  key={item}

                  onClick={() =>
                    setCategory(
                      item
                    )
                  }

                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium",

                    category === item
                      ? "bg-primary text-white"
                      : "bg-card"
                  )}
                >

                  🍽️ {item === "all" ? "All" : item}

                </button>
              )
            )}

          </div>

        </div>
      </section>


      {/* =================================================
          MENU SECTION
      ================================================= */}

      <section
        className="
          mx-auto
          max-w-7xl
          px-4
          py-10
        "
      >

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div
            className="
              flex
              justify-center
              items-center
              gap-2
              p-10
            "
          >

            <Loader2
              className="
                animate-spin
              "
            />

            Loading menu...

          </div>
        )}


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            className="
              rounded-xl
              border
              p-6
              text-center
            "
          >

            <AlertCircle
              className="
                mx-auto
                mb-2
              "
            />

            <p>
              {error}
            </p>

          </div>
        )}


        {/* =================================================
            MENU GRID
        ================================================= */}

        {!loading &&
          !error && (
            <>

              {list.length === 0 ? (
                <div
                  className="
                    text-center
                    py-20
                    text-muted-foreground
                  "
                >
                  No menu items found.
                </div>
              ) : (

                <div
                  className="
                    grid
                    gap-6
                    sm:grid-cols-2
                    lg:grid-cols-3
                    xl:grid-cols-4
                  "
                >

                  {list.map(
                    (dish) => {

                      const categoryInfo = categories.find((c) => c.id === dish.categoryId) ?? {
                        id: dish.categoryId,
                        name: dish.categoryId,
                        emoji: "🍴",
                      };


                      return (
                        <div
                          key={dish.id}

                          className="
                            overflow-hidden
                            rounded-2xl
                            border
                            bg-card
                            shadow-sm
                            hover:shadow-lg
                            transition
                          "
                        >

                          {/* IMAGE */}

                          <div
                            className="
                              h-48
                              bg-muted
                              flex
                              items-center
                              justify-center
                              overflow-hidden
                            "
                          >

                            {dish.image ? (

                              <>

                              <img
                                src={
                                  dish.image
                                }

                                alt={
                                  dish.name
                                }

                                className="
                                  h-full
                                  w-full
                                  object-cover
                                "

                                onError={(
                                  e
                                ) => {
                                  e.currentTarget.style.display =
                                    "none";
                                  const fallback =
                                    e.currentTarget.parentElement?.querySelector(
                                      "[data-image-fallback]"
                                    );
                                  if (fallback instanceof HTMLElement) {
                                    fallback.removeAttribute("hidden");
                                  }
                                }}
                              />

                              <span
                                data-image-fallback
                                hidden
                                className="text-6xl"
                              >
                                {
                                  categoryInfo?.emoji ||
                                  "🍴"
                                }
                              </span>

                              </>

                            ) : (

                              <span
                                className="
                                  text-6xl
                                "
                              >
                                {
                                  categoryInfo?.emoji ||
                                  "🍴"
                                }
                              </span>

                            )}

                          </div>


                          {/* INFO */}

                          <div
                            className="
                              p-4
                            "
                          >

                            <h2
                              className="
                                font-bold
                                text-lg
                              "
                            >
                              <Link to="/dish/$id" params={{ id: dish.id }}>
                                {dish.name}
                              </Link>
                            </h2>


                            <p
                              className="
                                text-sm
                                text-muted-foreground
                                mt-1
                              "
                            >
                              {
                                categoryInfo?.name ||
                                "Other"
                              }
                            </p>


                            <p
                              className="
                                text-sm
                                text-muted-foreground
                                mt-2
                                line-clamp-2
                              "
                            >
                              {
                                dish.description
                              }
                            </p>


                            {/* PRICE + ADD */}

                            <div
                              className="
                                flex
                                justify-between
                                items-center
                                mt-4
                              "
                            >

                              <span
                                className="
                                  font-bold
                                  text-lg
                                "
                              >
                                $
                                {dish.price.toFixed(
                                  2
                                )}
                              </span>


                              <button
                                disabled={dish.availableStatus?.toLowerCase() === "unavailable"}
                                onClick={() => addItem(dish)}

                                className="
                                  rounded-full
                                  bg-primary disabled:cursor-not-allowed disabled:opacity-50
                                  px-4
                                  py-2
                                  text-sm
                                  font-semibold
                                  text-white
                                  flex
                                  items-center
                                  gap-2
                                "
                              >

                                <Plus
                                  size={16}
                                />

                                {dish.availableStatus?.toLowerCase() === "unavailable" ? "Unavailable" : "Add"}

                              </button>

                            </div>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              )}

            </>
          )}

      </section>

    </SiteLayout>
  );
}