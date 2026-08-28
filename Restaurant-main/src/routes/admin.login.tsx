import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "./login";


export const Route = createFileRoute("/admin/login")({

  head: () => ({
    meta: [
      {
        title:"Admin Login — Ember & Oak"
      }
    ]
  }),

  component: () => <LoginPage adminOnly />,
});