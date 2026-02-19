"use server";

import { revalidatePath } from "next/cache";
import * as ledgerRepo from "@/lib/db/repositories/ledger.repository";
import { convertToUSD } from "@/lib/utils/currency";

export async function recordReceivedAction(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const clientId = Number(formData.get("client_id"));
  const amountAed = Number(formData.get("amount_aed"));

  if (!clientId || clientId <= 0) {
    return { error: "Please select a client" };
  }
  if (!amountAed || amountAed <= 0) {
    return { error: "Please enter a valid amount" };
  }

  try {
    await ledgerRepo.recordReceived(clientId, amountAed);
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
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const supplierId = Number(formData.get("supplier_id"));
  const amountAed = Number(formData.get("amount_aed"));

  if (!supplierId || supplierId <= 0) {
    return { error: "Please select a supplier" };
  }
  if (!amountAed || amountAed <= 0) {
    return { error: "Please enter a valid amount" };
  }

  const amountUsd = convertToUSD(amountAed);

  try {
    await ledgerRepo.recordPaid(supplierId, amountAed, amountUsd);
    revalidatePath("/payment");
    revalidatePath("/suppliers");
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to record payment";
    return { error: message };
  }
}
