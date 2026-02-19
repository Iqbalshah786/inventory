"use server";

import { revalidatePath } from "next/cache";
import * as suppliersRepo from "@/lib/db/repositories/suppliers.repository";
import { supplierSchema, flattenZodErrors } from "@/lib/validations";
import type { ActionState } from "@/lib/validations";

export async function addSupplierAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const raw = { name: formData.get("name") };

  const parsed = supplierSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: flattenZodErrors(parsed.error) };
  }

  try {
    await suppliersRepo.create(parsed.data.name);
    revalidatePath("/suppliers");
    return { success: true };
  } catch {
    return { error: "Failed to add supplier" };
  }
}
