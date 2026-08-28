const burger = "";
const pizza = "";
const steak = "";
const salad = "";
const pasta = "";
const dessert = "";
const wings = "";

export type Category = { id: string; name: string; emoji: string };

export type Dish = {
  id: string;
  name: string;
  description: string;
  price: number;
  costPrice?: number;
  availableStatus?: "Available" | "Unavailable";
  image: string;
  categoryId: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  featured?: boolean;
  popular?: boolean;
  newArrival?: boolean;
  prepTime: number; // minutes
  calories: number;
};

export type Branch = {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  hours: string;
};

export type Zone = "indoor" | "patio" | "bar" | "private";
export type TableShape = "round" | "square" | "booth";
export type Table = {
  id: string;
  branchId: string;
  label: string;
  seats: number;
  zone: Zone;
  shape: TableShape;
  x: number; // percentage on 100x60 viewBox
  y: number;
  w: number;
  h: number;
};

export const zoneMeta: Record<Zone, { name: string; color: string; tint: string }> = {
  indoor: { name: "Indoor", color: "hsl(18 88% 55%)", tint: "hsl(18 88% 55% / 0.06)" },
  patio: { name: "Patio", color: "hsl(150 45% 45%)", tint: "hsl(150 45% 45% / 0.08)" },
  bar: { name: "Bar", color: "hsl(34 92% 58%)", tint: "hsl(34 92% 58% / 0.08)" },
  private: { name: "Private", color: "hsl(280 40% 55%)", tint: "hsl(280 40% 55% / 0.08)" },
};

export const occasions = [
  "None",
  "Birthday",
  "Anniversary",
  "Date night",
  "Business meal",
  "Family gathering",
  "Other",
] as const;

export type Promotion = {
  id: string;
  title: string;
  description: string;
  code: string;
  discount: string;
};

export type Review = {
  id: string;
  dishId: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export const categories: Category[] = [
  { id: "burgers", name: "Burgers", emoji: "🍔" },
  { id: "pizza", name: "Pizza", emoji: "🍕" },
  { id: "grill", name: "Grill", emoji: "🥩" },
  { id: "pasta", name: "Pasta", emoji: "🍝" },
  { id: "salads", name: "Salads", emoji: "🥗" },
  { id: "starters", name: "Starters", emoji: "🍗" },
  { id: "desserts", name: "Desserts", emoji: "🍰" },
];

export const dishes: Dish[] = [
  {
    id: "smoked-bacon-burger",
    name: "Smoked Bacon Ember Burger",
    description:
      "Charred wagyu patty, applewood bacon, aged cheddar, ember aioli on a brioche bun.",
    price: 16.5,
    image: burger,
    categoryId: "burgers",
    rating: 4.8,
    reviewCount: 214,
    tags: ["signature", "spicy"],
    featured: true,
    popular: true,
    prepTime: 18,
    calories: 780,
  },
  {
    id: "wood-fired-margherita",
    name: "Wood-Fired Margherita",
    description: "San Marzano tomato, fior di latte, torn basil, extra-virgin olive oil.",
    price: 14.0,
    image: pizza,
    categoryId: "pizza",
    rating: 4.7,
    reviewCount: 182,
    tags: ["vegetarian"],
    featured: true,
    popular: true,
    prepTime: 15,
    calories: 640,
  },
  {
    id: "ribeye-oakwood",
    name: "Oakwood Ribeye 12oz",
    description: "Grass-fed ribeye grilled over oak, herb butter, charred market vegetables.",
    price: 32.0,
    image: steak,
    categoryId: "grill",
    rating: 4.9,
    reviewCount: 96,
    tags: ["chef pick", "gluten-free"],
    featured: true,
    prepTime: 25,
    calories: 890,
  },
  {
    id: "caesar-crunch",
    name: "Ember Caesar",
    description: "Charred romaine, sourdough croutons, aged parmesan, anchovy dressing.",
    price: 11.5,
    image: salad,
    categoryId: "salads",
    rating: 4.4,
    reviewCount: 63,
    tags: ["vegetarian"],
    prepTime: 8,
    calories: 420,
  },
  {
    id: "carbonara-classic",
    name: "Roman Carbonara",
    description: "Bucatini, guanciale, pecorino romano, cracked black pepper, egg yolk.",
    price: 17.0,
    image: pasta,
    categoryId: "pasta",
    rating: 4.6,
    reviewCount: 141,
    tags: ["classic"],
    popular: true,
    prepTime: 14,
    calories: 720,
  },
  {
    id: "molten-chocolate",
    name: "Molten Chocolate Oak",
    description: "Warm dark chocolate cake, vanilla bean gelato, fresh berries.",
    price: 9.0,
    image: dessert,
    categoryId: "desserts",
    rating: 4.9,
    reviewCount: 208,
    tags: ["signature"],
    featured: true,
    newArrival: true,
    prepTime: 12,
    calories: 560,
  },
  {
    id: "buffalo-wings",
    name: "Ember Buffalo Wings",
    description: "Twice-fried wings tossed in house buffalo sauce, buttermilk ranch.",
    price: 12.5,
    image: wings,
    categoryId: "starters",
    rating: 4.5,
    reviewCount: 178,
    tags: ["spicy"],
    popular: true,
    newArrival: true,
    prepTime: 12,
    calories: 640,
  },
];

export const branches: Branch[] = [
  {
    id: "BR001",
    name: "Hlaing Taste",
    address: "Hlaing",
    city: "Hlaing",
    phone: "",
    hours: "11:00 – 23:00",
  },
  {
    id: "BR002",
    name: "Downtown Taste",
    address: "Kyauktada",
    city: "Kyauktada",
    phone: "",
    hours: "12:00 – 22:30",
  },
  { id: "BR003", name: "Sanchaung Kitchen", address: "Sanchaung", city: "Sanchaung", phone: "", hours: "11:30 – 00:00" },
  { id: "BR004", name: "Bahan Kitchen", address: "Bahan", city: "Bahan", phone: "", hours: "11:00 – 23:00" },
];

export const promotions: Promotion[] = [
  {
    id: "p1",
    title: "Family Feast Friday",
    description: "20% off orders over $60 every Friday night.",
    code: "FEAST20",
    discount: "20% off",
  },
  {
    id: "p2",
    title: "First-Order Ember",
    description: "$10 off your first order — welcome to the fire.",
    code: "FIRST10",
    discount: "$10 off",
  },
  {
    id: "p3",
    title: "Weekday Lunch Combo",
    description: "Any pasta or salad + drink for $15, Mon–Thu 11–3.",
    code: "LUNCH15",
    discount: "Combo $15",
  },
];

// Shared floor-plan template applied to every branch. Coordinates on a 100 x 60 grid.
type TplTable = Omit<Table, "id" | "branchId">;
const layoutTemplate: TplTable[] = [
  // INDOOR (left half)
  { label: "I1", seats: 2, zone: "indoor", shape: "round", x: 7, y: 8, w: 8, h: 8 },
  { label: "I2", seats: 2, zone: "indoor", shape: "round", x: 20, y: 8, w: 8, h: 8 },
  { label: "I3", seats: 4, zone: "indoor", shape: "square", x: 33, y: 6, w: 12, h: 12 },
  { label: "I4", seats: 4, zone: "indoor", shape: "square", x: 7, y: 22, w: 12, h: 12 },
  { label: "I5", seats: 6, zone: "indoor", shape: "square", x: 24, y: 22, w: 14, h: 12 },
  { label: "I6", seats: 4, zone: "indoor", shape: "booth", x: 42, y: 22, w: 12, h: 12 },
  { label: "I7", seats: 2, zone: "indoor", shape: "round", x: 7, y: 40, w: 8, h: 8 },
  { label: "I8", seats: 4, zone: "indoor", shape: "booth", x: 20, y: 40, w: 12, h: 10 },
  // PATIO (top-right)
  { label: "P1", seats: 2, zone: "patio", shape: "round", x: 60, y: 6, w: 8, h: 8 },
  { label: "P2", seats: 4, zone: "patio", shape: "square", x: 72, y: 6, w: 12, h: 10 },
  { label: "P3", seats: 4, zone: "patio", shape: "square", x: 60, y: 20, w: 12, h: 10 },
  // BAR (mid-right)
  { label: "B1", seats: 2, zone: "bar", shape: "round", x: 78, y: 22, w: 7, h: 7 },
  { label: "B2", seats: 2, zone: "bar", shape: "round", x: 88, y: 22, w: 7, h: 7 },
  // PRIVATE (bottom)
  { label: "V1", seats: 8, zone: "private", shape: "booth", x: 40, y: 44, w: 22, h: 12 },
  { label: "V2", seats: 10, zone: "private", shape: "booth", x: 66, y: 40, w: 28, h: 16 },
];

export const tables: Table[] = branches.flatMap((b) =>
  layoutTemplate.map((t, i) => ({ ...t, id: `${b.id}-${t.label.toLowerCase()}`, branchId: b.id })),
);

export const getTable = (id: string) => tables.find((t) => t.id === id);
export const getBranch = (id: string) => branches.find((b) => b.id === id);
export const getTablesForBranch = (branchId: string) => tables.filter((t) => t.branchId === branchId);

export const reviews: Review[] = [
  { id: "r1", dishId: "smoked-bacon-burger", author: "Maya P.", rating: 5, comment: "Best burger in the city. The ember aioli is unreal.", createdAt: "2025-11-02" },
  { id: "r2", dishId: "smoked-bacon-burger", author: "Jordan K.", rating: 4, comment: "Bun was slightly overtoasted but flavor was excellent.", createdAt: "2025-11-14" },
  { id: "r3", dishId: "wood-fired-margherita", author: "Sara L.", rating: 5, comment: "Blistered crust, bright tomato — spot on.", createdAt: "2025-11-20" },
  { id: "r4", dishId: "ribeye-oakwood", author: "Chris W.", rating: 5, comment: "Worth every dollar. Perfect medium-rare.", createdAt: "2025-11-18" },
  { id: "r5", dishId: "molten-chocolate", author: "Priya S.", rating: 5, comment: "Molten center, cold gelato — dessert of the year.", createdAt: "2025-11-22" },
];

export const getDish = (id: string) => dishes.find((d) => d.id === id);
export const getCategory = (id: string) => categories.find((c) => c.id === id);
export const getReviewsForDish = (id: string) => reviews.filter((r) => r.dishId === id);

/** Naive "frequently bought together" heuristic for the recommendation UI. */
export const getRecommendations = (favIds: string[], recentIds: string[]): Dish[] => {
  const seen = new Set([...favIds, ...recentIds]);
  const scored = dishes
    .filter((d) => !seen.has(d.id))
    .map((d) => ({
      d,
      score:
        d.rating * 2 +
        (d.popular ? 2 : 0) +
        (d.featured ? 1.5 : 0) +
        (favIds.some((fid) => dishes.find((x) => x.id === fid)?.categoryId === d.categoryId) ? 3 : 0),
    }))
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 4).map((s) => s.d);
};