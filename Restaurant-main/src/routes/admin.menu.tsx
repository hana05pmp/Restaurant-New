import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { categories, type Dish } from "@/lib/data";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/menu")({
  head: () => ({
    meta: [{ title: "Menu Management — Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: MenuAdmin,
});

const empty = (): Dish => ({
  id: "",
  name: "",
  description: "",
  price: 0,
  costPrice: 0,
  availableStatus: "Available",
  image: "",
  categoryId: categories[0]?.id ?? "",
  rating: 4.5,
  reviewCount: 0,
  tags: [],
  prepTime: 15,
  calories: 500,
});

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

function MenuAdmin() {
  const { adminUser, dishesState, addDish, updateDish } = useStore();
  const navigate = useNavigate();
  useEffect(() => {
    if (adminUser && adminUser.role !== "main_admin") navigate({ to: "/admin" });
  }, [adminUser, navigate]);

  const [editing, setEditing] = useState<Dish | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [catalog, setCatalog] = useState<Dish[]>(dishesState);
  const categoryOptions = useMemo(
    () => Array.from(new Set(catalog.map((dish) => dish.categoryId))).filter(Boolean),
    [catalog],
  );

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/menu")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load menu")))
      .then((items: Array<Record<string, unknown>>) => {
        setCatalog(uniqueDishes(items.map((item, index) => ({
          id: String(item.id ?? item.menu_id ?? index),
          name: String(item.name ?? item.menu_name ?? "Unnamed menu item"),
          description: String(item.description ?? ""),
          price: Number(item.price ?? 0),
          costPrice: Number(item.costPrice ?? item.cost_price ?? 0),
          availableStatus: item.availableStatus === "Unavailable" || item.available_status === "Unavailable" ? "Unavailable" : "Available",
          image: String(item.image ?? ""),
          categoryId: normalizeCategory(String(item.category ?? "other")),
          rating: 4.5,
          reviewCount: 0,
          tags: [],
          prepTime: 15,
          calories: 0,
        }))));
      })
      .catch(() => setCatalog(dishesState));
  }, [dishesState]);

  const filteredDishes = useMemo(() => catalog.filter((dish) => {
    const matchesQuery = !query.trim() || `${dish.id} ${dish.name}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "all" || dish.categoryId === category;
    const matchesStatus = status === "all" || (dish.availableStatus ?? "Available") === status;
    return matchesQuery && matchesCategory && matchesStatus;
  }), [catalog, query, category, status]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-wide md:text-4xl">Menu Management</h1>
          <p className="text-sm text-muted-foreground">Chain-wide dish catalog.</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              Add dish
            </Button>
          </DialogTrigger>
          <DishDialog
            editing={editing}
            categoryOptions={categoryOptions}
            onSubmit={(d) => {
              if (editing) {
                updateDish(editing.id, d);
                setCatalog((items) => items.map((item) => item.id === editing.id ? d : item));
                toast.success("Dish updated");
              } else {
                const id = d.id || d.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                addDish({ ...d, id });
                setCatalog((items) => [...items, { ...d, id }]);
                toast.success("Dish added");
              }
              setOpen(false);
              setEditing(null);
            }}
          />
        </Dialog>
      </div>

      <Card>
        <CardContent className="flex flex-wrap gap-3 pt-6">
          <Input className="max-w-sm" placeholder="Search menu" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categoryOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Unavailable">Unavailable</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
        <CardHeader>
          <CardTitle>All dishes</CardTitle>
          <CardDescription>{filteredDishes.length} items</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDishes.map((d) => (
            <div key={d.id} className="flex gap-3 rounded-lg border p-3">
              <img
                src={d.image}
                alt={d.name}
                className="size-20 shrink-0 rounded-md object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium leading-tight">{d.name}</div>
                  <div className="text-sm font-medium">${d.price.toFixed(2)}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                    {d.categoryId} · {d.availableStatus ?? "Available"}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{d.description}</p>
                <div className="mt-2 flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(d);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Delete ${d.name}?`)) {
                        updateDish(d.id, { availableStatus: "Unavailable" });
                        setCatalog((items) => items.map((item) => item.id === d.id ? { ...item, availableStatus: "Unavailable" } : item));
                        toast("Dish marked unavailable");
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function DishDialog({ editing, categoryOptions, onSubmit }: { editing: Dish | null; categoryOptions: string[]; onSubmit: (d: Dish) => void }) {
    const [form, setForm] = useState<Dish>(editing ?? { ...empty(), categoryId: categoryOptions[0] ?? empty().categoryId });
  useEffect(() => {
      setForm(editing ?? { ...empty(), categoryId: categoryOptions[0] ?? empty().categoryId });
    }, [editing, categoryOptions]);
  const set = <K extends keyof Dish>(k: K, v: Dish[K]) => setForm({ ...form, [k]: v });

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{editing ? "Edit dish" : "New dish"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Price ($)</Label>
            <Input
              type="number"
              step="0.5"
              value={form.price}
              onChange={(e) => set("price", Number(e.target.value))}
            />
          </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Cost price ($)</Label>
            <Input type="number" step="0.01" value={form.costPrice ?? 0} onChange={(e) => set("costPrice", Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={form.availableStatus ?? "Available"} onValueChange={(v) => set("availableStatus", v as Dish["availableStatus"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Available">Available</SelectItem><SelectItem value="Unavailable">Unavailable</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
          <div className="space-y-1">
            <Label>Category</Label>
            <Select value={form.categoryId} onValueChange={(v) => set("categoryId", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label>Image URL</Label>
          <Input
            value={form.image}
            onChange={(e) => set("image", e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Prep time (min)</Label>
            <Input
              type="number"
              value={form.prepTime}
              onChange={(e) => set("prepTime", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label>Calories</Label>
            <Input
              type="number"
              value={form.calories}
              onChange={(e) => set("calories", Number(e.target.value))}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Tags (comma-separated)</Label>
          <Input
            value={form.tags.join(", ")}
            onChange={(e) =>
              set(
                "tags",
                e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              )
            }
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={() => {
            if (form.name) onSubmit(form);
          }}
        >
          {editing ? "Save" : "Add dish"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
