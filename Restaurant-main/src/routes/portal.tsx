import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/portal")({
  head: () => ({ meta: [{ title: "Login — Ember & Oak" }] }),
  component: PortalRedirect,
});

function PortalRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/login", replace: true });
  }, [navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-muted/30 text-sm text-muted-foreground">
      Redirecting to login…
    </div>
  );
}
