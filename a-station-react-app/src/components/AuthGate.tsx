import { Navigate } from "@tanstack/react-router";
import { useAuthInit } from "@/hooks/useAuthInit";
import { useAuthStore } from "@/stores/authStore";

export const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { isInitialized } = useAuthInit();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isInitialized) return null;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return <>{children}</>;
};
