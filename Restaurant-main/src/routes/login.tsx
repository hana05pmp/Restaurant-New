import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Flame, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { branches } from "@/lib/data";
import { defaultRouteForRole } from "@/lib/auth";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login - Ember & Oak" }] }),
  component: LoginPage,
});

export function LoginPage({ adminOnly = false }: { adminOnly?: boolean }) {
  const navigate = useNavigate();
  const { authenticate, selectedBranchId, selectBranch } = useStore();
  const [accountType, setAccountType] = useState<"admin" | "customer" | "branch">(adminOnly ? "admin" : "customer");
  const [identifier, setIdentifier] = useState(adminOnly ? "admin" : "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const branchNumber = branches.findIndex((branch) => branch.id === selectedBranchId) + 1;

  function setType(type: "admin" | "customer" | "branch") {
    setAccountType(type);
    setIdentifier(type === "admin" ? "admin" : branchNumber > 0 ? `${type === "customer" ? "customer" : "branch"}${branchNumber}` : "");
    setPassword("");
    setError("");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (accountType !== "admin" && !selectedBranchId) {
      setError("Please choose a branch.");
      return;
    }
    if (!password || (accountType === "admin" && !identifier.trim())) {
      setError("Please enter your password.");
      return;
    }
    const loginName = accountType === "customer"
      ? `customer${branchNumber}`
      : accountType === "branch"
        ? `branch${branchNumber}`
        : identifier.trim();
    try {
      setLoading(true);
      const role = await authenticate(loginName, password);
      if (adminOnly && role !== "main_admin" && role !== "branch_manager") {
        throw new Error("Please use an admin or branch manager account.");
      }
      toast.success("Login successful");
      navigate({ to: defaultRouteForRole(role), replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-muted/30 px-4 py-10">
      <div className="m-auto w-full max-w-md rounded-[2rem] border bg-card p-8 shadow-elegant">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-ember">
          <Flame className="size-7 text-white" />
        </div>
        <h1 className="mt-5 text-center font-display text-5xl">Login</h1>
        <p className="mt-3 text-center text-sm text-muted-foreground">Choose your account and branch</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <select value={accountType} onChange={(event) => setType(event.target.value as typeof accountType)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="admin">Admin</option>
            {!adminOnly && <option value="customer">Customer</option>}
            {!adminOnly && <option value="branch">Branch Manager</option>}
          </select>
          {accountType !== "admin" && (
            <select value={selectedBranchId ?? ""} onChange={(event) => { selectBranch(event.target.value); const number = branches.findIndex((branch) => branch.id === event.target.value) + 1; setIdentifier(`${accountType === "customer" ? "customer" : "branch"}${number}`); }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Choose branch</option>
              {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
          )}
          {accountType === "admin" && <Input placeholder="Admin username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />}
          <div className="relative">
            <Input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-3" aria-label="Show password">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {error && <div className="rounded-lg bg-red-100 p-3 text-sm text-red-600">{error}</div>}
          <Button disabled={loading} className="h-12 w-full rounded-full">
            {loading ? <Loader2 className="animate-spin" /> : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}
