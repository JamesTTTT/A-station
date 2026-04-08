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
import type { RegisterRequest } from "@/types";
import { GithubIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface RegisterFieldsProps {
  registerFormData: RegisterRequest;
  setRegisterFormData: React.Dispatch<React.SetStateAction<RegisterRequest>>;
  handleSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  error?: string | null;
  isLoading?: boolean;
}

export const RegisterFields = ({
  registerFormData,
  setRegisterFormData,
  handleSubmit,
  error,
  isLoading,
}: RegisterFieldsProps) => {
  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Fill in the details below to get started.
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input
            value={registerFormData.username}
            onChange={(e) =>
              setRegisterFormData((prev) => ({
                ...prev,
                username: e.target.value,
              }))
            }
            id="username"
            type="text"
            placeholder="johndoe"
            required
            disabled={isLoading}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            value={registerFormData.email}
            onChange={(e) =>
              setRegisterFormData((prev) => ({
                ...prev,
                email: e.target.value,
              }))
            }
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            disabled={isLoading}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            value={registerFormData.password}
            onChange={(e) =>
              setRegisterFormData((prev) => ({
                ...prev,
                password: e.target.value,
              }))
            }
            id="password"
            type="password"
            required
            disabled={isLoading}
          />
        </Field>
        {error && <p className="text-sm text-destructive text-center">{error}</p>}
        <Field>
          <Button className="cursor-pointer" type="submit" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Sign Up"}
          </Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <Button variant="outline" type="button" className="cursor-pointer">
            <GithubIcon />
            Sign up with GitHub
          </Button>
          <FieldDescription className="text-center">
            Already have an account?{" "}
            <Link to="/login" className="underline underline-offset-4">
              Log in
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
};
