"use server";

import { revalidatePath } from "next/cache";
import * as suppliersRepo from "@/lib/db/repositories/suppliers.repository";
import { z } from "zod/v4";

const supplierSchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
});

export async function addSupplierAction(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const raw = { name: formData.get("name") };

  const parsed = supplierSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await suppliersRepo.create(parsed.data.name);
    revalidatePath("/suppliers");
    return { success: true };
  } catch {
    return { error: "Failed to add supplier" };
  }
}
