import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Flame, Heart, LogOut, Menu as MenuIcon, Shield, ShoppingBag, User, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const customerNav = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/cart", label: "Cart" },
  { to: "/orders", label: "Orders" },
] as const;

export function SiteHeader() {
  const { cartCount, user, adminUser, logoutAll } = useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);
  const staffHome = adminUser?.role === "main_admin" ? "/admin" : "/branch-manager";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-gradient-ember"><Flame className="size-5 text-white" /></span>
          <span className="font-display text-2xl">Ember &amp; Oak</span>
        </Link>
        {!adminUser && <nav className="hidden gap-2 md:flex">{customerNav.map((item) => <Link key={item.to} to={item.to} className={cn("rounded-md px-3 py-2 text-sm", pathname === item.to ? "text-primary" : "text-muted-foreground")}>{item.label}</Link>)}</nav>}
        <div className="flex items-center gap-2">
          {!adminUser && <>
            <Button asChild variant="ghost" size="icon"><Link to="/favorites"><Heart /></Link></Button>
            <Button asChild variant="ghost" size="icon" className="relative"><Link to="/cart"><ShoppingBag />{cartCount > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-xs">{cartCount}</span>}</Link></Button>
          </>}
          {adminUser && <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><Shield /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{adminUser.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate({ to: staffHome })}><Shield /> Console</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onSelect={() => { logoutAll(); navigate({ to: "/login" }); }}><LogOut /> Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>}
          {user && !adminUser && <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><User /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuLabel>{user.name}</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive" onSelect={() => { logoutAll(); navigate({ to: "/login" }); }}><LogOut /> Logout</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>}
          {!user && !adminUser && <Button asChild className="rounded-full"><Link to="/login">Sign in</Link></Button>}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((value) => !value)}>{open ? <X /> : <MenuIcon />}</Button>
        </div>
      </div>
      {open && !adminUser && <nav className="border-t px-4 py-3 md:hidden">{customerNav.map((item) => <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="block py-2 text-sm">{item.label}</Link>)}</nav>}
    </header>
  );
}
