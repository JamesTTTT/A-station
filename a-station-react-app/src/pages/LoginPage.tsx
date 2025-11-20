import { LoginFields } from "@/components";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore.ts";

export const LoginPage = () => {
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate({ from: "/login" });

  const [loginFormData, setLoginFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await login(loginFormData);

    if (res.success) {
      console.log("Logged in");
      await navigate({
        to: "/workspaces/select",
        replace: true,
      });
    } else {
      console.log(res.error);
    }
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginFields
              loginFormData={loginFormData}
              setLoginFormData={setLoginFormData}
              handleSubmit={handleSubmit}
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
