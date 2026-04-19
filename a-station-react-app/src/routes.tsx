import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import LandingLayout from "./Layouts/LandingLayout.tsx";
import {
  LoginPage,
  RegisterPage,
  NotFoundPage,
  Dashboard,
  Home,
  DocsPage,
  DonatePage,
  WorkspaceSelect,
} from "@/pages/index.tsx";
import { AuthGate } from "@/components/AuthGate";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFoundPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <LandingLayout>
      <Home />
    </LandingLayout>
  ),
});

const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs",
  component: () => (
    <LandingLayout>
      <DocsPage />
    </LandingLayout>
  ),
});

const donateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/donate",
  component: () => (
    <LandingLayout>
      <DonatePage />
    </LandingLayout>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => <LoginPage />,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: () => <RegisterPage />,
});

const workspaceSelectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/workspaces/select",
  component: () => (
    <AuthGate>
      <WorkspaceSelect />
    </AuthGate>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  docsRoute,
  donateRoute,
  loginRoute,
  registerRoute,
  workspaceSelectRoute,
  dashboardRoute,
]);

export const router = createRouter({
  routeTree,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
