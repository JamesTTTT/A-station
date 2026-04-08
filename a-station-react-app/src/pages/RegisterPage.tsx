import { RegisterFields } from "@/components/RegisterFIelds";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";
import type { RegisterRequest } from "@/types";

export const RegisterPage = () => {
  const register = useAuthStore((state) => state.register);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate({ from: "/register" });

  const [registerFormData, setRegisterFormData] = useState<RegisterRequest>({
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const registerResult = await register(registerFormData);

    if (!registerResult.success) {
      setError(registerResult.error?.message || registerResult.error?.detail || "Registration failed");
      setIsLoading(false);
      return;
    }

    // Auto-login after registration
    const loginResult = await login({
      email: registerFormData.email,
      password: registerFormData.password,
    });

    setIsLoading(false);

    if (loginResult.success) {
      await navigate({ to: "/workspaces/select", replace: true });
    } else {
      setError("Account created but auto-login failed. Please log in manually.");
    }
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <RegisterFields
              registerFormData={registerFormData}
              setRegisterFormData={setRegisterFormData}
              handleSubmit={handleSubmit}
              error={error}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
};
