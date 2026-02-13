"use server";

import { signIn, signOut } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function loginAction(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const raw = {
    username: formData.get("username"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await signIn("credentials", {
      username: parsed.data.username,
      password: parsed.data.password,
      redirectTo: "/",
    });
  } catch (err) {
    // Next.js redirect() throws a special error — always re-throw it
    if (isRedirectError(err)) {
      throw err;
    }
    if (err instanceof AuthError) {
      return { error: "Invalid username or password" };
    }
    throw err;
  }

  return null;
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
