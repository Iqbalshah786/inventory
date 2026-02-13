import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/** Server-side guard — call at the top of protected pages */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}
