import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore.ts";

export const useAuthInit = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const refresh = useAuthStore((state) => state.refresh);
  useEffect(() => {
    const initAuth = async () => {
      await refresh();
      setIsInitialized(true);
    };
    initAuth();
  }, [refresh]);
  return { isInitialized };
};
