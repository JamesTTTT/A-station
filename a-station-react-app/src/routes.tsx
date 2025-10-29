import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import LandingLayout from "./Layouts/LandingLayout.tsx";
import {
  LoginPage,
  RegisterPage,
  NotFoundPage,
  Dashboard,
  Home,
} from "@/pages/index.tsx";
import type { AuthContextType } from "@/contexts/AuthContext.tsx";

interface MyRouterContext {
  auth: AuthContextType;
}

const rootRoute = createRootRouteWithContext<MyRouterContext>()({
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

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => <LoginPage />,
  // CASES INFINITE LOADING
  // beforeLoad: ({ context }) => {
  //   console.log(context.auth?.authState.isAuthenticated);
  //   if (!context.auth?.authState.isAuthenticated) {
  //     throw redirect({ to: "/dashboard" });
  //   }
  // },
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: () => <RegisterPage />,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => <Dashboard />,
  beforeLoad: ({ context }) => {
    if (!context.auth?.authState.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  dashboardRoute,
]);

export const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
