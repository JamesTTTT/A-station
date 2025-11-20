import {
  createRootRoute,
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
  WorkspaceSelect,
} from "@/pages/index.tsx";
import { useAuthStore } from "@/stores/authStore";

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

const workspaceSelectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/workspaces/select",
  component: () => <WorkspaceSelect />,
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => <Dashboard />,
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
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
