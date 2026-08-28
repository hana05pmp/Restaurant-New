import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { getCategory } from "@/lib/data";
import { useBranchShell } from "@/components/branch-admin/BranchShell";

export const Route = createFileRoute("/admin/menu-availability")({
  head: () => ({ meta: [{ title: "Menu Availability — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AvailabilityAdmin,
});

export function AvailabilityAdmin() {
  const { dishesState, branchesState, adminUser, isAvailable, toggleAvailability } = useStore();
  const isManager = adminUser?.role === "branch_manager";
  const forced = isManager ? adminUser?.branchId : undefined;
  const { activeBranchId, setActiveBranchId } = useBranchShell();
  const [branchId, setBranchId] = useState<string>(forced ?? activeBranchId);
  const active = forced ?? branchId;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-3xl tracking-wide md:text-4xl">Menu Availability</h1>
          <p className="text-sm text-muted-foreground">
            Toggle dishes in and out of stock for this branch.
          </p>
        </div>
        {!isManager && (
          <Select value={branchId} onValueChange={(value) => { setBranchId(value); setActiveBranchId(value); }}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {branchesState.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{branchesState.find((b) => b.id === active)?.name ?? "Branch"}</CardTitle>
          <CardDescription>{dishesState.length} dishes</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {dishesState.map((d) => {
            const avail = isAvailable(active, d.id);
            const cat = getCategory(d.categoryId);
            return (
              <div key={d.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3">
                  <img src={d.image} alt={d.name} className="size-12 rounded-md object-cover" />
                  <div>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {cat?.emoji} {cat?.name} · ${d.price.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={avail ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-600"}
                  >
                    {avail ? "In stock" : "86'd"}
                  </Badge>
                  <Switch checked={avail} onCheckedChange={() => toggleAvailability(active, d.id)} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
