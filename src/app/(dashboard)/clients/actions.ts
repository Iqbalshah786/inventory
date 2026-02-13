"use server";

import { revalidatePath } from "next/cache";
import { clientSchema } from "@/lib/validations";
import * as clientsRepo from "@/lib/db/repositories/clients.repository";

export async function addClientAction(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const raw = {
    name: formData.get("name"),
    client_type: formData.get("client_type"),
  };

  const parsed = clientSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await clientsRepo.create(parsed.data.name, parsed.data.client_type);
    revalidatePath("/clients");
    return { success: true };
  } catch {
    return { error: "Failed to add client" };
  }
}
