import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Building2, MapPin, Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SectionHeader, ToolbarCard } from "@/components/branch-admin/SectionHeader";
import { useBranchShell } from "@/components/branch-admin/BranchShell";

export const Route = createFileRoute("/admin/branches")({
  head: () => ({ meta: [{ title: "Branches — Ember & Oak" }, { name: "robots", content: "noindex" }] }),
  component: BranchesAdmin,
});

type ApiBranch = { branchId: string; branchName: string; city: string };

function BranchesAdmin() {
  const { setSection } = useBranchShell();
  const [query, setQuery] = useState("");
  const [branches, setBranches] = useState<ApiBranch[]>([]);

  useEffect(() => {
    setSection("chain");
    fetch("http://127.0.0.1:8000/api/branches")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load branches")))
      .then(setBranches)
      .catch(() => setBranches([]));
  }, [setSection]);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    return value ? branches.filter((branch) => `${branch.branchName} ${branch.city} ${branch.branchId}`.toLowerCase().includes(value)) : branches;
  }, [branches, query]);

  return (
    <div className="space-y-8">
      <SectionHeader eyebrow="Chain operations" title="Branches" description="The four branches from branches.csv." />
      <ToolbarCard>
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full md:max-w-md">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or city" className="w-full rounded-full border-border/70 bg-background pl-9 shadow-sm" />
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1">{filtered.length} branches</Badge>
        </div>
        {query && <button className="rounded-full border px-4 py-2 text-sm" onClick={() => setQuery("")}>Clear search</button>}
      </ToolbarCard>
      {!filtered.length ? <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No branches match your search.</p> : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((branch) => (
            <article key={branch.branchId} className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Building2 className="size-6" /></span>
                <div><p className="font-mono text-xs text-muted-foreground">{branch.branchId}</p><h2 className="mt-1 font-display text-2xl">{branch.branchName}</h2><p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-4" />{branch.city}</p></div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
