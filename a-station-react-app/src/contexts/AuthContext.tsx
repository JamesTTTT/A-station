import {
  createContext,
  useState,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import {
  login,
  register,
  refreshToken,
  logout as logoutApi,
} from "@/api/auth-api";
import {
  type LoginRequest,
  type RegisterRequest,
  type ApiResult,
  type AuthResponse,
  type UserResponse,
} from "@/types/auth";

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
}

interface AuthContextType {
  authState: AuthState;
  login: (credentials: LoginRequest) => Promise<ApiResult<AuthResponse>>;
  register: (userData: RegisterRequest) => Promise<ApiResult<UserResponse>>;
  logout: () => Promise<void>;
  refresh: () => Promise<ApiResult<AuthResponse>>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    handleRefresh();
  }, []);

  const handleLogin = async (credentials: LoginRequest) => {
    const result = await login(credentials);
    if (result.success) {
      setAuthState({
        isAuthenticated: true,
        token: result.data.access_token,
      });
    }
    return result;
  };

  const handleRegister = async (userData: RegisterRequest) => {
    const result = await register(userData);
    if (result.success) {
      console.log("Registration successful");
    } else {
      console.log(result.error);
    }
    return result;
  };

  const handleLogout = async () => {
    if (authState.token) {
      await logoutApi(authState.token);
    }
    setAuthState({
      isAuthenticated: false,
      token: null,
    });
  };

  const handleRefresh = async () => {
    const result = await refreshToken();
    if (result.success) {
      setAuthState({
        isAuthenticated: true,
        token: result.data.access_token,
      });
    } else {
      setAuthState({
        isAuthenticated: false,
        token: null,
      });
    }
    setIsLoading(false);
    return result;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        authState,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        refresh: handleRefresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthProvider, useAuth, type AuthContextType };
