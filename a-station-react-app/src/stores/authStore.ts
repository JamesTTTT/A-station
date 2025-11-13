import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  token: string | null;
  isAuthenticated: boolean;

  setToken: (token: string) => void;
  clearToken: () => void;

  getToken: () => string | null;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      token: null,
      isAuthenticated: false,

      setToken: (token: string) => {
        set({
          token,
          isAuthenticated: !!token,
        });
      },

      clearToken: () => {
        set({
          token: null,
          isAuthenticated: false,
        });
      },

      getToken: () => {
        return get().token;
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
      }),
    },
  ),
);
