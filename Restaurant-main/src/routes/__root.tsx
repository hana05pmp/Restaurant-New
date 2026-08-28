import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { StoreProvider, useStore } from "@/lib/store";
import { Toaster } from "sonner";
import { defaultRouteForRole, getUnauthorizedRedirect, isAuthEntryRoute } from "@/lib/auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ember & Oak — Chain of Fire-Kitchen Restaurants" },
      {
        name: "description",
        content:
          "Order from Ember & Oak's fire-kitchen menu. Browse dishes, track orders, and discover chef picks across our branches.",
      },
      { name: "author", content: "Ember & Oak" },
      { property: "og:title", content: "Ember & Oak — Chain of Fire-Kitchen Restaurants" },
      {
        property: "og:description",
        content:
          "Order from Ember & Oak's fire-kitchen menu. Browse dishes, track orders, and discover chef picks across our branches.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <AppSessionGate>
          <Outlet />
        </AppSessionGate>
        <Toaster position="top-right" richColors />
      </StoreProvider>
    </QueryClientProvider>
  );
}

function AppSessionGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  const { isAuthenticated, currentRole } = useStore();

  useEffect(() => {
    const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/login";
    const isLoginRoute = isAuthEntryRoute(pathname);

    // ==========================================
    // 1. ADMIN PAGES
    // ==========================================
    if (isAdminRoute) {
      // Not logged in → Login
      if (!isAuthenticated) {
        navigate({
          to: "/login",
          replace: true,
        });
        return;
      }

      // Customer cannot access admin
      if (currentRole !== "main_admin" && currentRole !== "branch_manager") {
        navigate({
          to: "/",
          replace: true,
        });
        return;
      }

      // Admin / Branch Manager can stay in admin
      return;
    }

    // ==========================================
    // 2. LOGIN / REGISTER
    // ==========================================
    if (isLoginRoute && isAuthenticated) {
      navigate({
        to: defaultRouteForRole(currentRole),
        replace: true,
      });
      return;
    }

    // ==========================================
    // 3. PUBLIC CUSTOMER PAGES
    // ==========================================
    // Home, Menu, Branches, Offers, etc.
    // are allowed without redirecting to /admin.
  }, [currentRole, isAuthenticated, navigate, pathname]);

  return <>{children}</>;
}
