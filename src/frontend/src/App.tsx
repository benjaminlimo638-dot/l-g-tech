import { Layout } from "@/components/Layout";
import { AdminPage } from "@/pages/AdminPage";
import { HomePage } from "@/pages/HomePage";
import { LookupPage } from "@/pages/LookupPage";
import { RequestRepairPage } from "@/pages/RequestRepairPage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: Layout,
});

const homeRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/",
  component: HomePage,
});

const requestRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/solicitar",
  validateSearch: (search: Record<string, unknown>): { focus?: string } => ({
    focus: typeof search.focus === "string" ? search.focus : undefined,
  }),
  component: RequestRepairPage,
});

const lookupRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/consultar",
  validateSearch: (
    search: Record<string, unknown>,
  ): { code?: string; phone?: string; focus?: string } => ({
    code: typeof search.code === "string" ? search.code : undefined,
    phone: typeof search.phone === "string" ? search.phone : undefined,
    focus: typeof search.focus === "string" ? search.focus : undefined,
  }),
  component: LookupPage,
});

const adminRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/admin",
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([homeRoute, requestRoute, lookupRoute, adminRoute]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
