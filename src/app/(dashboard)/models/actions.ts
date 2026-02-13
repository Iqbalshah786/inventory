"use server";

import { revalidatePath } from "next/cache";
import { modelSchema } from "@/lib/validations";
import * as modelsRepo from "@/lib/db/repositories/models.repository";

export async function addModelAction(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const raw = {
    model_name: formData.get("model_name"),
  };

  const parsed = modelSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await modelsRepo.create(parsed.data.model_name);
    revalidatePath("/models");
    return { success: true };
  } catch {
    return { error: "Failed to add model" };
  }
}
