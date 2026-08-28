import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dishes as seedDishes, branches as seedBranches, type Dish, type Branch } from "@/lib/data";

export type CartItem = { dishId: string; qty: number; notes?: string };

export type OrderStatus = "placed" | "preparing" | "ready" | "completed" | "cancelled";
export type OrderMode = "dine_in" | "booking";

export type Order = {
  id: string;
  items: CartItem[];
  total: number;
  branchId: string;
  status: OrderStatus;
  createdAt: string;
  mode: OrderMode;
  bookingId?: string;
  guestName?: string;
  phone?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  branchId?: string;
};

export type CustomerAccount = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "customer";
};

export type AdminRole = "main_admin" | "branch_manager";
export type AuthRole = "customer" | AdminRole;
export type AdminUser = {
  name: string;
  role: AdminRole;
  branchId?: string; // required for branch_manager
  branchName?:string;
  username?:string;
};

export type BookingStatus = "confirmed" | "seated" | "completed" | "cancelled";

export type Booking = {
  id: string;
  branchId: string;
  tableId: string;
  date: string;
  time: string;
  durationMin: number;
  partySize: number;
  guestName: string;
  phone: string;
  occasion?: string;
  notes?: string;
  preOrderItems: CartItem[];
  depositHeld: number;
  status: BookingStatus;
  createdAt: string;
  linkedOrderIds: string[];
};

type Store = {
  selectedBranchId: string | null;
  selectBranch: (branchId: string) => void;
  clearSelectedBranch: () => void;
  // cart
  cart: CartItem[];
  addToCart: (dishId: string, qty?: number) => void;
  removeFromCart: (dishId: string) => void;
  setQty: (dishId: string, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  // favorites
  favorites: string[];
  toggleFavorite: (dishId: string) => void;
  isFavorite: (dishId: string) => boolean;
  // orders
  orders: Order[];
  placeOrder: (o: Omit<Order, "id" | "createdAt" | "status">) => Order;
  cancelOrder: (id: string) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  // bookings
  bookings: Booking[];
  createBooking: (b: Omit<Booking, "id" | "createdAt" | "status" | "linkedOrderIds">) => Booking;
  cancelBooking: (id: string) => void;
  updateBookingStatus: (id: string, status: BookingStatus) => void;
  // auth (customer)
  user: User | null;
  currentRole: AuthRole | null;
  isAuthenticated: boolean;
  authenticate: (identifier: string, password: string) => Promise<AuthRole>;
  signUpCustomer: (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => User;
  login: (email: string, name?: string) => void;
  logout: () => void;
  logoutAll: () => void;
  updateProfile: (u: Partial<User>) => void;
  // admin auth
  adminUser: AdminUser | null;
  loginAdmin: (u: AdminUser) => void;
  logoutAdmin: () => void;
  // editable branches
  branchesState: Branch[];
  addBranch: (b: Omit<Branch, "id"> & { id?: string }) => void;
  updateBranch: (id: string, patch: Partial<Branch>) => void;
  deleteBranch: (id: string) => void;
  // editable dishes
  dishesState: Dish[];
  addDish: (d: Dish) => void;
  updateDish: (id: string, patch: Partial<Dish>) => void;
  deleteDish: (id: string) => void;
  // availability: branchId -> dishId -> inStock
  availability: Record<string, Record<string, boolean>>;
  isAvailable: (branchId: string, dishId: string) => boolean;
  toggleAvailability: (branchId: string, dishId: string) => void;
  // customer reviews
  reviews: Review[];
  submitReview: (r: Omit<Review, "id" | "createdAt" | "approved" | "sentiment">) => Review;
  moderateReview: (id: string, patch: Partial<Review>) => void;
  replyToReview: (id: string, reply: string) => void;
  // branch-local menu (per branch)
  branchMenu: Record<string, BranchMenu>;
  addBranchSpecial: (branchId: string, d: Omit<Dish, "id"> & { id?: string }) => void;
  updateBranchSpecial: (branchId: string, id: string, patch: Partial<Dish>) => void;
  deleteBranchSpecial: (branchId: string, id: string) => void;
  hideChainDish: (branchId: string, dishId: string) => void;
  unhideChainDish: (branchId: string, dishId: string) => void;
  overridePrice: (branchId: string, dishId: string, price: number) => void;
};

export type ReviewSentiment = "positive" | "neutral" | "negative";

export type Review = {
  id: string;
  branchId: string;
  dishId?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  author: string;
  title: string;
  body: string;
  sentiment: ReviewSentiment;
  approved: boolean;
  createdAt: string;
  reply?: string;
  repliedAt?: string;
};

export type BranchMenu = {
  specials: Dish[];
  hiddenChain: string[];
  priceOverrides: Record<string, number>;
};

const StoreContext = createContext<Store | null>(null);

const KEY = "ember-oak-store-v3";

type Persisted = {
  selectedBranchId: string | null;
  cart: CartItem[];
  favorites: string[];
  orders: Order[];
  bookings: Booking[];
  user: User | null;
  adminUser: AdminUser | null;
  customerAccounts: CustomerAccount[];
  branchesState: Branch[];
  dishesState: Dish[];
  availability: Record<string, Record<string, boolean>>;
  reviews: Review[];
  branchMenu: Record<string, BranchMenu>;
};

const STAFF_CREDENTIALS = [
  {
    username: "admin",
    password: "mainadmin",
    role: "main_admin" as const,
    name: "Main Admin",
  },

  {
    username: "branch1",
    password: "b1",
    role: "branch_manager" as const,
    branchId: "BR001",
    name: "Hlaing Taste Manager",
  },

  {
    username: "branch2",
    password: "b2",
    role: "branch_manager" as const,
    branchId: "BR002",
    name: "Downtown Taste Manager",
  },

  {
    username: "branch3",
    password: "b3",
    role: "branch_manager" as const,
    branchId: "BR003",
    name: "Sanchaung Kitchen Manager",
  },

  {
    username: "branch4",
    password: "b4",
    role: "branch_manager" as const,
    branchId: "BR004",
    name: "Bahan Kitchen Manager",
  },
];
const CUSTOMER_CREDENTIALS = [
  { username: "customer1", password: "c1", branchId: "BR001" },
  { username: "customer2", password: "c2", branchId: "BR002" },
  { username: "customer3", password: "c3", branchId: "BR003" },
  { username: "customer4", password: "c4", branchId: "BR004" },
];
const seededReviews: Review[] = [
  {
    id: "r1",
    branchId: "BR003",
    rating: 5,
    author: "Sofia M.",
    title: "Our date-night go-to",
    body: "The smoked ribeye at Westside is legendary. Our server remembered our anniversary — felt so special. Will be back.",
    sentiment: "positive",
    approved: true,
    createdAt: new Date(Date.now() - 864e5 * 3).toISOString(),
  },
  {
    id: "r2",
    branchId: "BR002",
    rating: 4,
    author: "Jordan P.",
    title: "Great lunch menu",
    body: "Downtown location is perfect for work lunches. Only small issue — wait for the table was 20 min past booking. Otherwise 10/10.",
    sentiment: "positive",
    approved: true,
    createdAt: new Date(Date.now() - 864e5 * 6).toISOString(),
  },
  {
    id: "r3",
    branchId: "BR001",
    rating: 3,
    author: "Taylor R.",
    title: "Good but inconsistent",
    body: "Harbor's fire-roasted veggies arrived cold. Otherwise flavor was solid, and the harbor view is unbeatable.",
    sentiment: "neutral",
    approved: false,
    createdAt: new Date(Date.now() - 864e5 * 2).toISOString(),
  },
  {
    id: "r4",
    branchId: "BR003",
    rating: 2,
    author: "Alex K.",
    title: "Long wait, forgotten order",
    body: "Westside was understaffed this Saturday. Waited 45 min, sides came out wrong. Manager handled it well though.",
    sentiment: "negative",
    approved: false,
    createdAt: new Date(Date.now() - 864e5 * 1).toISOString(),
  },
  {
    id: "r5",
    branchId: "BR002",
    rating: 5,
    author: "Priya S.",
    title: "Chef's tasting menu 👌",
    body: "Downtown chef's tasting — every course was a hit. The bone-marrow risotto changed my life. Recommend to anyone.",
    sentiment: "positive",
    approved: true,
    createdAt: new Date(Date.now() - 864e5 * 10).toISOString(),
    reply:
      "Hi Priya! Thrilled you enjoyed the tasting menu. Come back this month — the new summer menu is dropping and we'd love to hear what you think.",
    repliedAt: new Date(Date.now() - 864e5 * 9).toISOString(),
  },
  {
    id: "r6",
    branchId: "BR004",
    rating: 4,
    author: "Morgan L.",
    title: "Uptown is such a vibe",
    body: "Cozy interior, friendly staff. The oak-barrel old fashioned is a must. Will bring friends.",
    sentiment: "positive",
    approved: true,
    createdAt: new Date(Date.now() - 864e5 * 4).toISOString(),
  },
  {
    id: "r7",
    branchId: "BR001",
    rating: 5,
    author: "Samir V.",
    title: "Waterfront + ribs",
    body: "Harbor waterfront table + short ribs = best birthday ever. They gave us a complimentary chocolate ember — class act.",
    sentiment: "positive",
    approved: true,
    createdAt: new Date(Date.now() - 864e5 * 7).toISOString(),
  },
  {
    id: "r8",
    branchId: "BR004",
    rating: 2,
    author: "Chris D.",
    title: "Wait staff seemed rushed",
    body: "Uptown seemed understaffed tonight. Felt like they wanted us out quickly. Food great as always though.",
    sentiment: "negative",
    approved: false,
    createdAt: new Date(Date.now() - 864e5 * 1).toISOString(),
  },
];

const initial = (): Persisted => ({
  selectedBranchId: null,
  cart: [],
  favorites: [],
  orders: [],
  bookings: [],
  user: null,
  adminUser: null,
  customerAccounts: [],
  branchesState: seedBranches,
  dishesState: seedDishes,
  availability: {},
  reviews: seededReviews,
  branchMenu: seedBranches.reduce<Record<string, BranchMenu>>((acc, b) => {
    acc[b.id] = { specials: [], hiddenChain: [], priceOverrides: {} };
    return acc;
  }, {}),
});

const load = (): Persisted => {
  const base = initial();
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      selectedBranchId: parsed.selectedBranchId ?? base.selectedBranchId,
      cart: parsed.cart ?? base.cart,
      favorites: parsed.favorites ?? base.favorites,
      orders: parsed.orders ?? base.orders,
      bookings: parsed.bookings ?? base.bookings,
      user: parsed.user ?? base.user,
      adminUser: parsed.adminUser ?? base.adminUser,
      customerAccounts: parsed.customerAccounts ?? base.customerAccounts,
      branchesState: parsed.branchesState?.length ? parsed.branchesState : base.branchesState,
      dishesState: parsed.dishesState?.length ? parsed.dishesState : base.dishesState,
      availability: parsed.availability ?? base.availability,
      reviews:
        Array.isArray(parsed.reviews) && parsed.reviews.length ? parsed.reviews : base.reviews,
      branchMenu: parsed.branchMenu ?? base.branchMenu,
    };
  } catch {
    return base;
  }
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(() => initial());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const dishMap = useMemo(
    () => new Map<string, Dish>(state.dishesState.map((d) => [d.id, d])),
    [state.dishesState],
  );

  const value: Store = useMemo(() => {
    const patch = (p: Partial<Persisted>) => setState((prev) => ({ ...prev, ...p }));
    const cartSubtotal = state.cart.reduce(
      (sum, it) => sum + (dishMap.get(it.dishId)?.price ?? 0) * it.qty,
      0,
    );
    const currentRole: AuthRole | null = state.adminUser?.role ?? (state.user ? "customer" : null);
    return {
      selectedBranchId: state.selectedBranchId,
      selectBranch: (branchId) => setState((prev) => ({ ...prev, selectedBranchId: branchId })),
      clearSelectedBranch: () => patch({ selectedBranchId: null }),
      cart: state.cart,
      addToCart: (dishId, qty = 1) =>
        setState((prev) => {
          const existing = prev.cart.find((i) => i.dishId === dishId);
          const cart = existing
            ? prev.cart.map((i) => (i.dishId === dishId ? { ...i, qty: i.qty + qty } : i))
            : [...prev.cart, { dishId, qty }];
          return { ...prev, cart };
        }),
      removeFromCart: (dishId) =>
        setState((prev) => ({ ...prev, cart: prev.cart.filter((i) => i.dishId !== dishId) })),
      setQty: (dishId, qty) =>
        setState((prev) => ({
          ...prev,
          cart:
            qty <= 0
              ? prev.cart.filter((i) => i.dishId !== dishId)
              : prev.cart.map((i) => (i.dishId === dishId ? { ...i, qty } : i)),
        })),
      clearCart: () => patch({ cart: [] }),
      cartCount: state.cart.reduce((s, i) => s + i.qty, 0),
      cartSubtotal,

      favorites: state.favorites,
      toggleFavorite: (dishId) =>
        setState((prev) => ({
          ...prev,
          favorites: prev.favorites.includes(dishId)
            ? prev.favorites.filter((x) => x !== dishId)
            : [...prev.favorites, dishId],
        })),
      isFavorite: (dishId) => state.favorites.includes(dishId),

      orders: state.orders,
      placeOrder: (o) => {
        const order: Order = {
          ...o,
          id: `EO-${Date.now().toString(36).toUpperCase()}`,
          createdAt: new Date().toISOString(),
          status: "placed",
        };
        setState((prev) => ({
          ...prev,
          orders: [order, ...prev.orders],
          bookings: order.bookingId
            ? prev.bookings.map((b) =>
                b.id === order.bookingId
                  ? { ...b, linkedOrderIds: [...b.linkedOrderIds, order.id] }
                  : b,
              )
            : prev.bookings,
        }));
        return order;
      },
      cancelOrder: (id) =>
        setState((prev) => ({
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === id && (o.status === "placed" || o.status === "preparing")
              ? { ...o, status: "cancelled" }
              : o,
          ),
        })),
      updateOrderStatus: (id, status) =>
        setState((prev) => ({
          ...prev,
          orders: prev.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        })),

      bookings: state.bookings,
      createBooking: (b) => {
        const booking: Booking = {
          ...b,
          id: `BK-${Date.now().toString(36).toUpperCase()}`,
          createdAt: new Date().toISOString(),
          status: "confirmed",
          linkedOrderIds: [],
        };
        setState((prev) => ({ ...prev, bookings: [booking, ...prev.bookings] }));
        return booking;
      },
      cancelBooking: (id) =>
        setState((prev) => ({
          ...prev,
          bookings: prev.bookings.map((b) =>
            b.id === id && b.status === "confirmed"
              ? { ...b, status: "cancelled", depositHeld: 0 }
              : b,
          ),
        })),
      updateBookingStatus: (id, status) =>
        setState((prev) => ({
          ...prev,
          bookings: prev.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
        })),

      user: state.user,
      currentRole,
      isAuthenticated: Boolean(state.user || state.adminUser),
      authenticate: async (identifier, password) => {
        const customerAccount = CUSTOMER_CREDENTIALS.find(
          (account) => account.username === identifier.trim().toLowerCase() && account.password === password,
        );
        if (customerAccount) {
          const user = { id: customerAccount.username, name: `Customer ${customerAccount.branchId.slice(-1)}`, email: customerAccount.username, phone: "", branchId: customerAccount.branchId };
          patch({ adminUser: null, user, selectedBranchId: customerAccount.branchId });
          return "customer";
        }

        const staffAccount = STAFF_CREDENTIALS.find(
          (account) =>
            account.username === identifier.trim() &&
            account.password === password,
        );

        if (staffAccount) {
          patch({
            user: null,
            adminUser: {
              name: staffAccount.name,
              role: staffAccount.role,
              branchId: staffAccount.branchId,
            },
          });

          return staffAccount.role;
        }

        const response = await fetch("http://127.0.0.1:8000/api/login", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            username: identifier,
            password: password,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Login failed");
        }

        const user = data.user;
        if (user.role === "main_admin" || user.role === "branch_manager") {
          patch({
            user: null,

            adminUser: {
              name: user.name,

              role: user.role,

              branchId: user.branchId,
            },
          });

          return user.role;
        } else {
          patch({
            adminUser: null,

            user: {
              id: user._id,

              name: user.name,

              email: user.username,

              phone: user.phone,
            },
          });

          return "customer";
        }
      },
      signUpCustomer: ({ name, email, phone, password }) => {
        const normalizedEmail = email.trim().toLowerCase();
        if (state.customerAccounts.some((entry) => entry.email.toLowerCase() === normalizedEmail)) {
          throw new Error("An account with this email already exists.");
        }

        const account: CustomerAccount = {
          id: `cust-${Date.now().toString(36)}`,
          name: name.trim(),
          email: normalizedEmail,
          phone: phone.trim(),
          password,
          role: "customer",
        };
        const nextUser: User = {
          id: account.id,
          name: account.name,
          email: account.email,
          phone: account.phone,
        };
        setState((prev) => ({
          ...prev,
          adminUser: null,
          user: nextUser,
          customerAccounts: [...prev.customerAccounts, account],
        }));
        return nextUser;
      },
      login: (email, name) =>
        patch({
          adminUser: null,
          user: { id: `u-${email}`, email, name: name ?? email.split("@")[0] },
        }),
      logout: () => patch({ user: null, adminUser: null }),
      logoutAll: () => patch({ user: null, adminUser: null }),
      updateProfile: (u) =>
        setState((prev) => ({
          ...prev,
          user: prev.user ? { ...prev.user, ...u } : prev.user,
          customerAccounts: prev.user
            ? prev.customerAccounts.map((entry) =>
                entry.id === prev.user?.id ? { ...entry, ...u } : entry,
              )
            : prev.customerAccounts,
        })),

      adminUser: state.adminUser,
      loginAdmin: (u) => patch({ user: null, adminUser: u }),
      logoutAdmin: () => patch({ user: null, adminUser: null }),

      branchesState: state.branchesState,
      addBranch: (b) => {
        const id = b.id ?? `br-${Date.now().toString(36)}`;
        setState((prev) => ({ ...prev, branchesState: [...prev.branchesState, { ...b, id }] }));
      },
      updateBranch: (id, p) =>
        setState((prev) => ({
          ...prev,
          branchesState: prev.branchesState.map((b) => (b.id === id ? { ...b, ...p } : b)),
        })),
      deleteBranch: (id) =>
        setState((prev) => ({
          ...prev,
          branchesState: prev.branchesState.filter((b) => b.id !== id),
        })),

      dishesState: state.dishesState,
      addDish: (d) => setState((prev) => ({ ...prev, dishesState: [...prev.dishesState, d] })),
      updateDish: (id, p) =>
        setState((prev) => ({
          ...prev,
          dishesState: prev.dishesState.map((d) => (d.id === id ? { ...d, ...p } : d)),
        })),
      deleteDish: (id) =>
        setState((prev) => ({
          ...prev,
          dishesState: prev.dishesState.filter((d) => d.id !== id),
        })),

      availability: state.availability,
      isAvailable: (branchId, dishId) => state.availability[branchId]?.[dishId] !== false,
      toggleAvailability: (branchId, dishId) =>
        setState((prev) => {
          const branch = prev.availability[branchId] ?? {};
          const current = branch[dishId] !== false;
          return {
            ...prev,
            availability: {
              ...prev.availability,
              [branchId]: { ...branch, [dishId]: !current },
            },
          };
        }),

      reviews: state.reviews,
      submitReview: (r) => {
        const sentiment: ReviewSentiment =
          r.rating >= 4 ? "positive" : r.rating <= 2 ? "negative" : "neutral";
        const review: Review = {
          ...r,
          id: `RV-${Date.now().toString(36).toUpperCase()}`,
          createdAt: new Date().toISOString(),
          approved: false,
          sentiment,
        };
        setState((prev) => ({ ...prev, reviews: [review, ...prev.reviews] }));
        return review;
      },
      moderateReview: (id, patch) =>
        setState((prev) => ({
          ...prev,
          reviews: prev.reviews.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      replyToReview: (id, reply) =>
        setState((prev) => ({
          ...prev,
          reviews: prev.reviews.map((r) =>
            r.id === id ? { ...r, reply, repliedAt: new Date().toISOString(), approved: true } : r,
          ),
        })),

      branchMenu: state.branchMenu,
      addBranchSpecial: (branchId, d) =>
        setState((prev) => {
          const bm = prev.branchMenu[branchId] ?? {
            specials: [],
            hiddenChain: [],
            priceOverrides: {},
          };
          const id = d.id ?? `sp-${Date.now().toString(36)}`;
          return {
            ...prev,
            branchMenu: {
              ...prev.branchMenu,
              [branchId]: { ...bm, specials: [...bm.specials, { ...d, id } as Dish] },
            },
          };
        }),
      updateBranchSpecial: (branchId, id, patch) =>
        setState((prev) => {
          const bm = prev.branchMenu[branchId];
          if (!bm) return prev;
          return {
            ...prev,
            branchMenu: {
              ...prev.branchMenu,
              [branchId]: {
                ...bm,
                specials: bm.specials.map((x) => (x.id === id ? { ...x, ...patch } : x)),
              },
            },
          };
        }),
      deleteBranchSpecial: (branchId, id) =>
        setState((prev) => {
          const bm = prev.branchMenu[branchId];
          if (!bm) return prev;
          return {
            ...prev,
            branchMenu: {
              ...prev.branchMenu,
              [branchId]: { ...bm, specials: bm.specials.filter((x) => x.id !== id) },
            },
          };
        }),
      hideChainDish: (branchId, dishId) =>
        setState((prev) => {
          const bm = prev.branchMenu[branchId] ?? {
            specials: [],
            hiddenChain: [],
            priceOverrides: {},
          };
          if (bm.hiddenChain.includes(dishId)) return prev;
          return {
            ...prev,
            branchMenu: {
              ...prev.branchMenu,
              [branchId]: { ...bm, hiddenChain: [...bm.hiddenChain, dishId] },
            },
          };
        }),
      unhideChainDish: (branchId, dishId) =>
        setState((prev) => {
          const bm = prev.branchMenu[branchId];
          if (!bm) return prev;
          return {
            ...prev,
            branchMenu: {
              ...prev.branchMenu,
              [branchId]: { ...bm, hiddenChain: bm.hiddenChain.filter((x) => x !== dishId) },
            },
          };
        }),
      overridePrice: (branchId, dishId, price) =>
        setState((prev) => {
          const bm = prev.branchMenu[branchId] ?? {
            specials: [],
            hiddenChain: [],
            priceOverrides: {},
          };
          return {
            ...prev,
            branchMenu: {
              ...prev.branchMenu,
              [branchId]: { ...bm, priceOverrides: { ...bm.priceOverrides, [dishId]: price } },
            },
          };
        }),
    };
  }, [state, dishMap]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
