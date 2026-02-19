"use server";

import { revalidatePath } from "next/cache";
import { clientSchema, flattenZodErrors } from "@/lib/validations";
import type { ActionState } from "@/lib/validations";
import * as clientsRepo from "@/lib/db/repositories/clients.repository";

export async function addClientAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    name: formData.get("name"),
  };

  const parsed = clientSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: flattenZodErrors(parsed.error) };
  }

  try {
    await clientsRepo.create(parsed.data.name, "regular");
    revalidatePath("/clients");
    return { success: true };
  } catch {
    return { error: "Failed to add client" };
  }
}
