import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { FormEvent } from "react";
import type { LoginRequest } from "@/types";
import { GithubIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface LoginFieldsProps {
  loginFormData: LoginRequest;
  setLoginFormData: React.Dispatch<React.SetStateAction<LoginRequest>>;
  handleSubmit?: (e: FormEvent<HTMLFormElement>) => void;
}

export const LoginFields = ({
  loginFormData,
  setLoginFormData,
  handleSubmit,
}: LoginFieldsProps) => {
  return (
    <form className={"flex flex-col gap-6"} onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            value={loginFormData.email}
            onChange={(e) =>
              setLoginFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            id="email"
            type="email"
            placeholder="m@example.com"
            required
          />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input
            value={loginFormData.password}
            onChange={(e) =>
              setLoginFormData((prev) => ({
                ...prev,
                password: e.target.value,
              }))
            }
            id="password"
            type="password"
            required
          />
        </Field>
        <Field>
          <Button className="cursor-pointer" type="submit">
            Login
          </Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <Button variant="outline" type="button" className="cursor-pointer">
            <GithubIcon />
            Login with GitHub
          </Button>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="underline underline-offset-4">
              Sign up
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
};
