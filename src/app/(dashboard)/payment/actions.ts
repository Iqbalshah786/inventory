"use server";

import { revalidatePath } from "next/cache";
import * as ledgerRepo from "@/lib/db/repositories/ledger.repository";
import { convertToUSD } from "@/lib/utils/currency";
import {
  receivedPaymentSchema,
  paidPaymentSchema,
  flattenZodErrors,
} from "@/lib/validations";
import type { ActionState } from "@/lib/validations";

export async function recordReceivedAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    client_id: formData.get("client_id"),
    amount_aed: formData.get("amount_aed"),
  };

  const parsed = receivedPaymentSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: flattenZodErrors(parsed.error) };
  }

  try {
    await ledgerRepo.recordReceived(
      parsed.data.client_id,
      parsed.data.amount_aed,
    );
    revalidatePath("/payment");
    revalidatePath("/clients");
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to record payment";
    return { error: message };
  }
}

export async function recordPaidAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    supplier_id: formData.get("supplier_id"),
    amount_aed: formData.get("amount_aed"),
  };

  const parsed = paidPaymentSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: flattenZodErrors(parsed.error) };
  }

  const amountUsd = convertToUSD(parsed.data.amount_aed);

  try {
    await ledgerRepo.recordPaid(
      parsed.data.supplier_id,
      parsed.data.amount_aed,
      amountUsd,
    );
    revalidatePath("/payment");
    revalidatePath("/suppliers");
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to record payment";
    return { error: message };
  }
}
