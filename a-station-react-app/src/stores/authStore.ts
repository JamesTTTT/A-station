import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  login as loginApi,
  register as registerApi,
  refreshToken,
  logout as logoutApi,
} from "@/api/auth-api";
import type {
  LoginRequest,
  RegisterRequest,
  ApiResult,
  AuthResponse,
  UserResponse,
} from "@/types/auth";

interface AuthStore {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
  getToken: () => string | null;
  login: (credentials: LoginRequest) => Promise<ApiResult<AuthResponse>>;
  register: (userData: RegisterRequest) => Promise<ApiResult<UserResponse>>;
  logout: () => Promise<void>;
  refresh: () => Promise<ApiResult<AuthResponse>>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

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

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        const result = await loginApi(credentials);
        if (result.success) {
          set({
            token: result.data.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: result.error.message,
          });
        }
        return result;
      },

      register: async (credentials: RegisterRequest) => {
        set({ isLoading: true, error: null });
        const result = await registerApi(credentials);
        if (result.success) {
          set({
            isLoading: false,
            error: null,
          });
        } else {
          set({
            isLoading: false,
            error: result.error.message,
          });
        }
        return result;
      },

      logout: async () => {
        const token = get().token;
        if (token) {
          await logoutApi(token);
        }
        get().clearToken();
      },

      refresh: async () => {
        const result = await refreshToken();

        if (result.success) {
          set({
            token: result.data.access_token,
            isAuthenticated: true,
          });
        } else {
          get().clearToken();
        }

        return result;
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
