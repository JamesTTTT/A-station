import {
  Checkbox, Label, Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator, Button, Input
} from "@/components";

import type {FormEvent} from "react";
import type {RegisterRequest} from "@/types";
import {GithubIcon} from "lucide-react";

interface LoginFieldsProps {
  registerFormData: RegisterRequest;
  setRegisterFormData: React.Dispatch<React.SetStateAction<RegisterRequest>>;
  handleSubmit?: (e: FormEvent<HTMLFormElement>) => void;
}

export const RegisterFields = ({
                                 registerFormData,
                                 setRegisterFormData,
                                 handleSubmit,
                               }: LoginFieldsProps) => {
  return (
    <form className={"flex flex-col gap-6"} onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Let's get started. Fill in the details below to create your account.
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            value={registerFormData.username}
            onChange={(e) =>
              setRegisterFormData((prev) => ({...prev, username: e.target.value}))
            }
            id="username"
            type="text"
            placeholder="TheUser27"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            value={registerFormData.email}
            onChange={(e) =>
              setRegisterFormData((prev) => ({...prev, email: e.target.value}))
            }
            id="email"
            type="email"
            placeholder="m@example.com"
            required
          />
        </Field>
        <div className="flex items-start gap-3">
          <Checkbox id="terms-2" defaultChecked/>
          <div className="grid gap-2">
            <Label htmlFor="terms-2">Accept terms and conditions</Label>
            <p className="text-muted-foreground text-sm">
              By clicking this checkbox, you agree to the terms and conditions.
            </p>
          </div>
          <Field>
            <Button className="cursor-pointer" type="submit">
              Sign Up
            </Button>
          </Field>
          <FieldSeparator>Or signup with</FieldSeparator>
          <Field>
            <Button variant="outline" type="button" className="cursor-pointer">
              <GithubIcon/>
              Register with GitHub
            </Button>
            <FieldDescription className="text-center">
              Don&apos;t have an account?{" "}
              <a href="#" className="underline underline-offset-4">
                Already have an account?
              </a>
            </FieldDescription>
          </Field>
        </div>
      </FieldGroup>
    </form>
  );
};
