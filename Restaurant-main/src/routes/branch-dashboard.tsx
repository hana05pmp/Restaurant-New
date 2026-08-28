import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/branch-dashboard")({
  component: BranchDashboardRedirect,
});

function BranchDashboardRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/branch-manager", replace: true });
  }, [navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-muted/30 text-sm text-muted-foreground">
      Redirecting…
    </div>
  );
}
