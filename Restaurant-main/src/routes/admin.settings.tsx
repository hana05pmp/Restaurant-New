import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { User, Store, Clock, Receipt, KeyRound, Mail, Smartphone, Save, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/lib/store";
import { branches } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [{ title: "Settings — Ember & Oak" }, { name: "robots", content: "noindex" }],
  }),
  component: () => <SettingsPage key="admin" />,
});

export function SettingsPage() {
  const { adminUser } = useStore();
  const isMain = adminUser?.role === "main_admin";
  const branch = branches.find((b) => b.id === adminUser?.branchId);
  const initials = (adminUser?.name ?? "BM").split(" ").map((w) => w[0]).slice(0, 2).join("");
  const [saved, setSaved] = useState(false);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-4xl tracking-wide md:text-5xl">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isMain ? "Chain-wide & account preferences" : `Branch-specific preferences · ${branch?.name ?? "Branch"}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">✓ Saved just now</Badge>}
          <Button className="bg-gradient-ember text-primary-foreground shadow-ember hover:opacity-90" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}>
            <Save className="mr-2 size-4" /> Save changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-xl">
          <TabsTrigger value="profile" className="gap-2"><User className="size-4" /> Profile</TabsTrigger>
          <TabsTrigger value="branch" className="gap-2"><Store className="size-4" /> Branch</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle>Account details</CardTitle>
                <CardDescription>Update your name, email, and password.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                  <Avatar className="size-20 ring-4 ring-border">
                    <AvatarFallback className="bg-gradient-ember text-2xl text-primary-foreground">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2 text-center sm:text-left">
                    <div className="font-display text-xl">{adminUser?.name ?? "Staff"}</div>
                    <div className="text-sm text-muted-foreground">{isMain ? "Main Admin · HQ" : `Branch Manager · ${branch?.name}`}</div>
                    <Button variant="outline" size="sm"><RefreshCw className="mr-2 size-3.5" /> Change photo</Button>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="p-name">Full name</Label>
                    <Input id="p-name" defaultValue={adminUser?.name ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p-email">Email</Label>
                    <Input id="p-email" type="email" defaultValue={adminUser?.role === "main_admin" ? "alex.chen@emberandoak.com" : "manager." + (branch?.slug ?? "branch") + "@emberandoak.com"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p-phone">Phone</Label>
                    <Input id="p-phone" defaultValue={isMain ? "+1 (555) 010-0001" : "+1 (555) 010-0012"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p-role">Role</Label>
                    <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2 text-sm font-semibold">
                      {isMain ? "🏢 Main Admin (Chain HQ)" : "📍 Branch Manager"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><KeyRound className="size-5 text-primary" /> Security</CardTitle>
              <CardDescription>Change your password and login settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-1">
                  <Label>Current password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label>New password</Label>
                  <Input type="password" placeholder="At least 8 chars" />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label>Confirm new password</Label>
                  <Input type="password" placeholder="Repeat" />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/30 p-4">
                <div>
                  <div className="text-sm font-semibold">Two-factor authentication</div>
                  <div className="text-xs text-muted-foreground">Required for all staff accounts.</div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branch" className="mt-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Branch info</CardTitle>
                <CardDescription>Displayed to customers when they browse branches.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Branch name</Label>
                  <Input defaultValue={branch?.name ?? branches[0].name} />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input defaultValue={branch?.address ?? branches[0].address} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input defaultValue={branch?.city ?? branches[0].city} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input defaultValue={branch?.phone ?? branches[0].phone} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Receipt / footer greeting</Label>
                  <Textarea rows={2} defaultValue={"Thanks for dining with us! 🔥 — " + (branch?.name ?? branches[0].name)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="size-5 text-primary" /> Operations</CardTitle>
                <CardDescription>Hours, ordering and stock thresholds.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Open time</Label>
                    <Input defaultValue="11:00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Close time</Label>
                    <Input defaultValue="22:30" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Last kitchen order</Label>
                  <Select defaultValue="21:30">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["20:00", "20:30", "21:00", "21:30", "22:00"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/70 p-4">
                  <div>
                    <div className="text-sm font-semibold">Accept online orders</div>
                    <div className="text-xs text-muted-foreground">Toggle off when kitchen is overwhelmed.</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/70 p-4">
                  <div>
                    <div className="text-sm font-semibold">Auto 86 at stock</div>
                    <div className="text-xs text-muted-foreground">Mark items unavailable automatically below this %.</div>
                  </div>
                  <Select defaultValue="15"><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent>{["5", "10", "15", "20", "25"].map((v) => <SelectItem key={v} value={v}>{v}%</SelectItem>)}</SelectContent></Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle>Notify me about</CardTitle>
                <CardDescription>Pick where you want to receive each alert.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border/70">
                  {[
                    { title: "New orders", desc: "Push when a new customer order arrives.", default: true },
                    { title: "Low stock warnings", desc: "When items fall below reorder threshold.", default: true },
                    { title: "New customer reviews", desc: "Every review, especially negative ones.", default: true },
                    { title: "Reservation changes", desc: "Cancellations, edits, and no-shows.", default: false },
                    { title: "Daily close-of-day report", desc: "End-of-shift revenue snapshot.", default: true },
                    { title: "Staff clock-in / out", desc: "Only for managers on shift.", default: false },
                  ].map((row, i) => (
                    <div key={i} className="grid grid-cols-1 gap-3 py-4 md:grid-cols-[1fr,auto,auto] md:items-center">
                      <div>
                        <div className="text-sm font-semibold">{row.title}</div>
                        <div className="text-xs text-muted-foreground">{row.desc}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="size-4 text-muted-foreground" />
                        <Switch defaultChecked={row.default} />
                      </div>
                      <div className="flex items-center gap-3">
                        <Smartphone className="size-4 text-muted-foreground" />
                        <Switch defaultChecked={row.default && i < 2} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-2 border-t border-border/70 bg-muted/30 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Receipt className="size-4" /> Notification summary delivered by email at shift close.
                </div>
                <Button variant="outline" size="sm">Send test email</Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
