"use server";

import { revalidatePath } from "next/cache";
import {
  modelSchema,
  expenseSchema,
  flattenZodErrors,
} from "@/lib/validations";
import type { ActionState } from "@/lib/validations";
import * as modelsRepo from "@/lib/db/repositories/models.repository";

export async function addModelAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    model_name: formData.get("model_name"),
  };

  const parsed = modelSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: flattenZodErrors(parsed.error) };
  }

  try {
    await modelsRepo.create(parsed.data.model_name);
    revalidatePath("/models");
    return { success: true };
  } catch {
    return { error: "Failed to add model" };
  }
}

export async function addExpenseAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    model_id: formData.get("model_id"),
    amount_aed: formData.get("amount_aed"),
  };

  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: flattenZodErrors(parsed.error) };
  }

  try {
    await modelsRepo.addExpense(parsed.data.model_id, parsed.data.amount_aed);
    revalidatePath("/models");
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to add expense";
    return { error: message };
  }
}
