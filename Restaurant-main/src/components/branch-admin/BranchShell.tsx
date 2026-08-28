import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShoppingBag,
  CalendarDays,
  UtensilsCrossed,
  Building2,
  BookOpen,
  Flame,
  ArrowLeft,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Home,
  Menu as MenuIcon,
  Package,
  PanelLeftClose,
  Search as SearchIcon,
  Star,
  Store,
  TrendingUp,
  X,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import type { Branch } from "@/lib/data";
import { branches as canonicalBranches } from "@/lib/data";

export type BranchManagerNavId =
  | "dashboard"
  | "orders"
  | "inventory"
  | "reports"
  | "settings"
  | "overview"
  | "branches"
  | "menu-editor"
  | "menu-insights";

export type BranchManagerNavItem = {
  id: BranchManagerNavId;
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section: "branch" | "chain";
  badge?: string;
  description?: string;
};

export const branchManagerNav: BranchManagerNavItem[] = [

  {
    id: "overview",
    to: "/admin/overview",
    label: "Branch Performance",
    icon: TrendingUp,
    section: "chain",
    description: "Compare overall branch performance",
  },

  {
    id:"dashboard",
    to:"/branch-manager",
    label:"Dashboard",
    icon:LayoutDashboard,
    section:"branch",
    description:"Today's KPIs, charts & activity feed",
  },


  {
    id:"orders",
    to:"/branch-manager/orders",
    label:"Orders",
    icon:ShoppingBag,
    section:"branch",
    description:"Manage live orders",
  },


  {
    id:"inventory",
    to:"/branch-manager/inventory",
    label:"Inventory",
    icon:Package,
    section:"branch",
    description:"Ingredient stock levels & alerts",
  },


  {
    id:"reports",
    to:"/branch-manager/sales-reports",
    label:"Reports",
    icon:TrendingUp,
    section:"branch",
    description:"Revenue and sales analysis",
  },


  {
    id:"branches",
    to:"/admin/branches",
    label:"Branches",
    icon:Building2,
    section:"chain",
    description:"Manage branches",
  },


  {
    id:"menu-editor",
    to:"/admin/menu",
    label:"Menu Management",
    icon:BookOpen,
    section:"chain",
    description:"Chain-wide menu",
  },

  {
    id:"menu-insights",
    to:"/admin/menu-insights",
    label:"Menu Insights",
    icon:BarChart3,
    section:"chain",
    description:"Menu performance analysis",
  },

];

type ShellCtx = {
  collapsed: boolean;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  activeBranchId: string;
  setActiveBranchId: (id: string) => void;
  branch: Branch | null;
  branches: Branch[];
  section: "branch" | "chain";
  setSection: (section: "branch" | "chain") => void;
};

const Ctx = createContext<ShellCtx | null>(null);

export function useBranchShell() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBranchShell must be used within <BranchShellProvider>");
  return ctx;
}

export function BranchShellProvider({ children }: { children: React.ReactNode }) {
  const { adminUser, branchesState, logoutAdmin } = useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [section, setSection] = useState<"branch" | "chain">(
    adminUser?.role === "main_admin" ? "chain" : "branch",
  );

  const isMainAdmin = adminUser?.role === "main_admin";
  const forcedBranch = adminUser?.branchId;
  const branches = canonicalBranches;

  const [activeBranchId, setActiveBranchId] = useState<string>(() => {
    if (forcedBranch) return forcedBranch;
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("ember-oak-admin-branch");
      return saved === "all" || branches.some((branch) => branch.id === saved) ? saved ?? "all" : "all";
    }
    return "all";
  });

  useEffect(() => {
    if (!forcedBranch) window.localStorage.setItem("ember-oak-admin-branch", activeBranchId);
  }, [activeBranchId, forcedBranch]);

  useEffect(() => {
    if (!forcedBranch) return;
    setActiveBranchId(forcedBranch);
  }, [forcedBranch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const branch = useMemo(() => {
    if (!branches?.length) return null;
    return branches.find((b) => b.id === activeBranchId) ?? null;
  }, [branches, activeBranchId]);

  const ctxValue: ShellCtx = {
    collapsed,
    toggleCollapsed: () => setCollapsed((v) => !v),
    mobileOpen,
    setMobileOpen,
    searchOpen,
    setSearchOpen,
    activeBranchId,
    setActiveBranchId,
    branch,
    branches,
    section,
    setSection,
  };

  const initials =
    (adminUser?.name ?? "BM")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "BM";

  const isLogin = pathname === "/admin/login";

  if (isLogin || !adminUser) {
    return <Ctx.Provider value={ctxValue}>{children}</Ctx.Provider>;
  }

  const visibleNav = branchManagerNav.filter((n) => {
    if (n.section === "chain" && !isMainAdmin) return false;
    return n.section === section;
  });

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const crumbs = useMemo(
    () => buildBreadcrumbs(pathname, section, isMainAdmin),
    [pathname, section, isMainAdmin],
  );

  return (
    <Ctx.Provider value={ctxValue}>
      <div className="flex min-h-screen bg-[color:var(--background)] text-foreground">
        <AnimatePresence>
          {mobileOpen ? (
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-charcoal/40 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
          ) : null}
        </AnimatePresence>

        <motion.aside
          animate={
            mobileOpen
              ? { x: 0, opacity: 1 }
              : collapsed
                ? { width: 76, opacity: 1 }
                : { width: 280, opacity: 1 }
          }
          transition={{ type: "spring", stiffness: 260, damping: 28, mass: 0.9 }}
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-border/60 bg-[color:var(--card)] shadow-elegant/40 md:sticky md:top-0 md:h-screen",
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          <div className="flex items-center gap-3 border-b border-border/60 px-4 py-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-ember shadow-ember">
              <Flame className="size-5 text-primary-foreground" />
            </span>
            <AnimatePresence initial={false}>
              {!collapsed ? (
                <motion.div
                  key="brand"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="min-w-0 leading-tight"
                >
                  <div className="truncate font-display text-lg tracking-wide">Ember &amp; Oak</div>
                  <div className="truncate text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {section === "chain" ? "Chain Ops" : "Branch Manager"}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
            <div className="ml-auto hidden md:block">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed((v) => !v)}
                className="rounded-full text-muted-foreground hover:text-foreground"
              >
                <PanelLeftClose
                  className={cn("size-4 transition-transform", collapsed && "rotate-180")}
                />
              </Button>
            </div>
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                className="rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          <div className={cn("px-3 pt-3", collapsed && "px-2")}>
            {isMainAdmin ? (
              <div
                className={cn(
                  "flex rounded-xl border border-border/70 bg-muted/30 p-1",
                  collapsed && "flex-col",
                )}
              >
                <NavSectionToggle
                  active={section === "branch"}
                  onClick={() => setSection("branch")}
                  label="Branch"
                  icon={Store}
                  compact={collapsed}
                />
                <NavSectionToggle
                  active={section === "chain"}
                  onClick={() => setSection("chain")}
                  label="Chain"
                  icon={Building2}
                  compact={collapsed}
                />
              </div>
            ) : null}
          </div>

          <div>
            {!forcedBranch && branches.length > 0 ? (
              <div className={cn("w-full px-3", collapsed && "px-2")}>
                <Select
                  value={activeBranchId}
                  onValueChange={(v) => setActiveBranchId(v)}
                  disabled={Boolean(forcedBranch)}
                >
                  <SelectTrigger
                    className={cn(
                      "w-full rounded-xl border border-border/70 bg-background/70 shadow-sm",
                      collapsed && "justify-center px-0 text-[0px]",
                    )}
                  >
                    {collapsed ? (
                      <>
                        <Store className="size-4 text-primary shrink-0" />
                        <SelectValue className="sr-only" />
                      </>
                    ) : (
                      <div className="flex items-center gap-2 w-full min-w-0">
                        <Store className="size-4 text-primary shrink-0" />
                        <span className="flex min-w-0 flex-1 flex-col items-start leading-tight overflow-hidden">
                          <span className="truncate w-full text-left font-medium">
                            {branch?.name ?? (
                              <SelectValue
                                placeholder="Select branch"
                                className="text-foreground"
                              />
                            )}
                          </span>
                          {branch?.city ? (
                            <span className="truncate w-full text-left text-[11px] text-muted-foreground">
                              {branch.city}
                            </span>
                          ) : null}
                        </span>
                        <SelectValue className="sr-only" />
                      </div>
                    )}
                  </SelectTrigger>
                  <SelectContent align="start" side="bottom" sideOffset={6}>
                    <SelectItem value="all" className="gap-2 py-2.5">
                      <span className="font-semibold">All branches</span>
                    </SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id} className="gap-2 py-2.5">
                        <div className="flex flex-col items-start leading-tight">
                          <span className="font-semibold">{b.name}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {b.city} · {b.address.split(",")[0]}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className={cn("px-3", collapsed && "px-2")}>
                <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-sm shadow-sm overflow-hidden">
                  <Store className="size-4 text-primary shrink-0" />
                  <div
                    className={cn(
                      "flex min-w-0 flex-1 flex-col items-start leading-tight overflow-hidden",
                      collapsed && "hidden",
                    )}
                  >
                    <span className="truncate w-full text-left font-medium">
                      {branch?.name ?? branches[0]?.name ?? "Branch"}
                    </span>
                    {branch?.city ? (
                      <span className="truncate w-full text-left text-[11px] text-muted-foreground">
                        {branch.city}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>

          <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-2 pb-4">
            {visibleNav.map((n) => {
              const active =
                pathname === n.to ||
                (n.id === "dashboard" && (pathname === "/admin" || pathname === "/branch-manager"));
              const linkTo = n.to;
              return (
                <Link
                  key={n.id}
                  to={linkTo}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    collapsed && "justify-center px-2 py-3",
                    active
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-foreground/75 hover:bg-muted/70 hover:text-foreground",
                  )}
                  title={collapsed ? n.label : undefined}
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
                      active
                        ? "bg-gradient-ember text-primary-foreground shadow-ember/40"
                        : "bg-muted/60 text-muted-foreground group-hover:bg-background group-hover:text-primary",
                    )}
                  >
                    <n.icon className="size-4" />
                  </span>
                  {!collapsed ? <span className="flex-1 truncate">{n.label}</span> : null}
                  {!collapsed && n.badge ? (
                    <Badge variant="outline" className="ml-auto rounded-full px-2 py-0 text-[10px]">
                      {n.badge}
                    </Badge>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border/60 p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/70",
                    collapsed && "justify-center",
                  )}
                >
                  <Avatar className={cn("size-9 ring-1 ring-border", collapsed && "size-8")}>
                    <AvatarFallback className="bg-gradient-ember text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed ? (
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium leading-tight">
                        {adminUser.name}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {isMainAdmin ? "Main Admin" : (branch?.name ?? "Branch Manager")}
                      </span>
                    </span>
                  ) : null}
                  {!collapsed ? <ChevronDown className="size-4 text-muted-foreground" /> : null}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="text-sm font-medium">{adminUser.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {isMainAdmin ? "Main Admin" : (branch?.name ?? "Branch Manager")}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setSearchOpen(true)}>
                    <SearchIcon className="size-4" />
                    <span>Quick search</span>
                    <span className="ml-auto rounded border border-border/70 bg-muted/40 px-1.5 text-[10px] text-muted-foreground">
                      ⌘K
                    </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onSelect={() => {
                    logoutAdmin();
                    navigate({ to: "/login" });
                  }}
                >
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-background/85 px-3 py-3 backdrop-blur md:px-6">
            <div className="flex items-center gap-2 md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
                <MenuIcon className="size-5" />
              </Button>
              <span className="grid size-9 place-items-center rounded-xl bg-gradient-ember shadow-ember">
                <Flame className="size-4 text-primary-foreground" />
              </span>
            </div>

            <div className="hidden min-w-0 flex-1 md:flex md:max-w-md">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link
                        to={isMainAdmin ? "/admin" : "/branch-manager"}
                        className="inline-flex items-center gap-1 text-muted-foreground"
                      >
                        <Home className="size-3.5" />
                        {section === "chain" ? "Chain Console" : (branch?.name ?? "Branch")}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {crumbs.map((c, i) => (
                    <FragmentBreadcrumb
                      key={c.label + i}
                      crumb={c}
                      index={i}
                      total={crumbs.length}
                    />
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex md:hidden">
              <Breadcrumb>
                <BreadcrumbList>
                  {crumbs.slice(-1).map((c, i) => (
                    <BreadcrumbItem key={c.label + i}>
                      <BreadcrumbPage className="text-sm">{c.label}</BreadcrumbPage>
                    </BreadcrumbItem>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex flex-1 items-center justify-end gap-2 md:ml-auto md:flex-none" />
          </header>

          <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-8 md:py-8">
            {children}
          </main>
        </div>

        <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
          <DialogContent className="max-w-2xl border border-border/60 p-0 shadow-elegant">
            <DialogHeader className="sr-only">
              <DialogTitle>Search</DialogTitle>
              <DialogDescription>Navigate Branch Manager sections</DialogDescription>
            </DialogHeader>
            <Command className="rounded-2xl">
              <CommandInput placeholder="Search sections, pages and branches…" />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Navigate">
                  {visibleNav.map((n) => (
                    <CommandItem
                      key={n.id}
                      onSelect={() => {
                        navigate({ to: n.to });
                        setSearchOpen(false);
                      }}
                      value={n.label}
                    >
                      <n.icon className="size-4 text-primary" />
                      <span className="font-medium">{n.label}</span>
                      <span className="ml-auto hidden text-xs text-muted-foreground md:inline">
                        {n.description}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {!forcedBranch && branches.length > 0 ? (
                  <>
                    <CommandSeparator />
                    <CommandGroup heading="Branches">
                      {branches.map((b) => (
                        <CommandItem
                          key={b.id}
                          value={b.name}
                          onSelect={() => {
                            setActiveBranchId(b.id);
                            navigate({ to: "/admin" });
                            setSearchOpen(false);
                          }}
                        >
                          <Store className="size-4 text-primary" />
                          <span className="font-medium">{b.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{b.city}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                ) : null}
              </CommandList>
            </Command>
          </DialogContent>
        </Dialog>
      </div>
    </Ctx.Provider>
  );
}

function NavSectionToggle({
  active,
  onClick,
  label,
  icon: Icon,
  compact,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold tracking-wide transition-all duration-200",
        active
          ? "bg-background text-primary shadow-sm ring-1 ring-border/70"
          : "text-muted-foreground hover:text-foreground",
        compact && "py-3",
      )}
    >
      <Icon className="size-4" />
      {!compact ? label : null}
    </button>
  );
}

function FragmentBreadcrumb({
  crumb,
  index,
  total,
}: {
  crumb: { label: string; to?: string };
  index: number;
  total: number;
}) {
  const isLast = index === total - 1;
  return (
    <>
      <BreadcrumbSeparator>
        <ChevronRight className="size-3.5" />
      </BreadcrumbSeparator>
      <BreadcrumbItem>
        {isLast || !crumb.to ? (
          <BreadcrumbPage className="text-sm">{crumb.label}</BreadcrumbPage>
        ) : (
          <BreadcrumbLink asChild>
            <Link to={crumb.to} className="text-sm">
              {crumb.label}
            </Link>
          </BreadcrumbLink>
        )}
      </BreadcrumbItem>
    </>
  );
}

function buildBreadcrumbs(
  pathname: string,
  section: "branch" | "chain",
  isMainAdmin: boolean,
): Array<{ label: string; to?: string }> {
  const prefix = pathname.startsWith("/branch-manager") ? "/branch-manager" : "/admin";
  const P = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const map: Array<{ test: RegExp; label: string; to?: string }> = [
    {
      test: new RegExp(`^${P}\\/?$`),
      label: section === "chain" && isMainAdmin ? "Overview" : "Dashboard",
    },
    { test: new RegExp(`^${P}\\/overview$`), label: "Chain Overview" },
    { test: new RegExp(`^${P}\\/branches$`), label: "Branches", to: `${prefix}/branches` },
    { test: new RegExp(`^${P}\\/menu$`), label: "Menu Management" },
    { test: new RegExp(`^${P}\\/menu-insights$`), label: "Menu Insights" },
    { test: new RegExp(`^${P}\\/orders$`), label: "Orders", to: `${prefix}/orders` },
    { test: new RegExp(`^${P}\\/menu-availability$`), label: "Menu Availability" },
    { test: new RegExp(`^${P}\\/bookings$`), label: "Reservations" },
    { test: new RegExp(`^${P}\\/inventory$`), label: "Inventory" },
    { test: new RegExp(`^${P}\\/sales-reports$`), label: "Sales Reports" },
    { test: new RegExp(`^${P}\\/customer-reviews$`), label: "Customer Reviews" },
    { test: new RegExp(`^${P}\\/settings$`), label: "Settings" },
  ];

  for (const entry of map) {
    if (entry.test.test(pathname)) {
      return [{ label: entry.label, to: entry.to }];
    }
  }
  return [{ label: "Branch Manager" }];
}
