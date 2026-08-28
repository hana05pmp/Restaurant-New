import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "./admin.settings";

export const Route = createFileRoute("/branch-manager/settings")({
  head: () => ({
    meta: [{ title: "Settings — Branch Manager" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <div className="space-y-4">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 md:px-8 md:pt-8">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="text-sm font-semibold text-primary">🔒 Branch Manager View</div>
          <div className="text-xs text-muted-foreground">Preferences apply to your branch scope.</div>
        </div>
      </div>
      <SettingsPage />
    </div>
  ),
});
