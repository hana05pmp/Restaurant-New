import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Ember & Oak" }, { name: "robots", content: "noindex" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, updateProfile, logoutAll, orders, favorites } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  useEffect(() => {
    setName(user?.name ?? "");
    setPhone(user?.phone ?? "");
  }, [user]);

  if (!user) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="font-display text-3xl">Sign in to view your profile</h1>
          <Link to="/login" className="mt-4 inline-flex rounded-full bg-gradient-ember px-6 py-3 font-semibold text-primary-foreground">Sign in</Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
        <h1 className="font-display text-5xl">Profile</h1>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-2xl">Account details</h2>
            <form
              onSubmit={(e) => { e.preventDefault(); updateProfile({ name, phone }); toast.success("Profile updated"); }}
              className="mt-4 space-y-4"
            >
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</span>
                <input value={user.email} disabled className="w-full rounded-xl border border-input bg-muted px-4 py-3 text-sm text-muted-foreground" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary" />
              </label>
              <button type="submit" className="rounded-full bg-gradient-ember px-6 py-2.5 font-semibold text-primary-foreground shadow-ember">Save changes</button>
            </form>
          </div>

          <div className="space-y-4">
            <Stat label="Orders" value={orders.length} to="/orders" />
            <Stat label="Favorites" value={favorites.length} to="/favorites" />
            <button
              onClick={() => { logoutAll(); toast.success("Signed out"); navigate({ to: "/login" }); }}
              className="w-full rounded-full border border-border py-2.5 font-semibold hover:border-destructive hover:text-destructive"
            >Sign out</button>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

function Stat({ label, value, to }: { label: string; value: number; to: string }) {
  return (
    <Link to={to} className="block rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-primary/50">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-3xl text-primary">{value}</div>
    </Link>
  );
}
