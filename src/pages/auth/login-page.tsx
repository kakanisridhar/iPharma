import { useForm } from "@tanstack/react-form";
import * as v from "valibot";
import { loginToServer } from "@/apis/services/login";
import useAuthOperations from "@/hooks/use-auth-operations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Logo from "@/components/common/logo";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { getSetting } from "@/lib/db";
import { USER_NAME } from "@/config/vars";

function validateField(
  schema: v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
  value: unknown,
): string | undefined {
  const result = v.safeParse(schema, value);
  return result.success ? undefined : result.issues[0].message;
}

const usernameSchema = v.pipe(
  v.string(),
  v.minLength(1, "Username is required"),
);
const passwordSchema = v.pipe(
  v.string(),
  v.minLength(1, "Password is required"),
);

export function Login() {
  const { login } = useAuthOperations();
  const [savedUsername, setSavedUsername] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const { data } = await loginToServer(value);
        await login(data?.access_token, data?.refresh_token);
        toast.success("Login successful!");
      } catch (err: unknown) {
        const message =
          (err as any)?.response?.data?.message ??
          "Login failed. Check your credentials.";
        toast.error(message);
      }
    },
  });

  useEffect(() => {
    getSetting(USER_NAME).then((val) => {
      if (val) {
        setSavedUsername(val);
        form.setFieldValue("username", val);
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access iPharma
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-4"
            >
              <form.Field
                name="username"
                validators={{
                  onChange: ({ value }) => validateField(usernameSchema, value),
                }}
              >
                {(field) => (
                  <Field
                    data-invalid={
                      field.state.meta.isTouched &&
                      field.state.meta.errors.length > 0
                        ? true
                        : undefined
                    }
                  >
                    <FieldTitle>Username</FieldTitle>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter your username"
                      autoComplete="username"
                      readOnly={!!savedUsername}
                      aria-invalid={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                      }
                    />
                    {field.state.meta.isTouched && (
                      <FieldError
                        errors={field.state.meta.errors.map((e) => ({
                          message: String(e),
                        }))}
                      />
                    )}
                  </Field>
                )}
              </form.Field>

              <form.Field
                name="password"
                validators={{
                  onChange: ({ value }) => validateField(passwordSchema, value),
                }}
              >
                {(field) => (
                  <Field
                    data-invalid={
                      field.state.meta.isTouched &&
                      field.state.meta.errors.length > 0
                        ? true
                        : undefined
                    }
                  >
                    <FieldTitle>Password</FieldTitle>
                    <Input
                      id={field.name}
                      type="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      aria-invalid={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                      }
                    />
                    {field.state.meta.isTouched && (
                      <FieldError
                        errors={field.state.meta.errors.map((e) => ({
                          message: String(e),
                        }))}
                      />
                    )}
                  </Field>
                )}
              </form.Field>

              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={!canSubmit || isSubmitting}
                  >
                    {isSubmitting ? "Signing in…" : "Sign in"}
                  </Button>
                )}
              </form.Subscribe>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
