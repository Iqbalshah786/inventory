import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saleFormSchema } from "@/lib/validations";
import { createSale } from "@/lib/db/repositories/sales.repository";
import { success, error } from "@/lib/utils/api-response";
import { query } from "@/lib/db/connection";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(error("Unauthorized"), { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = saleFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        error(parsed.error.issues[0]?.message ?? "Validation failed"),
        { status: 400 },
      );
    }

    // Aggregate quantities per model from the request
    const qtyByModel = new Map<number, number>();
    for (const item of parsed.data.items) {
      qtyByModel.set(
        item.model_id,
        (qtyByModel.get(item.model_id) ?? 0) + item.quantity,
      );
    }

    // Check stock availability for each model
    for (const [modelId, requiredQty] of qtyByModel) {
      const rows = await query<{
        quantity_remaining: number;
        model_name: string;
      }>(
        `SELECT COALESCE(i.quantity_remaining, 0) AS quantity_remaining, m.model_name
         FROM mobile_models m
         LEFT JOIN inventory i ON i.model_id = m.id
         WHERE m.id = $1`,
        [modelId],
      );
      const row = rows[0];
      if (!row) {
        return NextResponse.json(error(`Model with id ${modelId} not found`), {
          status: 400,
        });
      }
      if (requiredQty > Number(row.quantity_remaining)) {
        return NextResponse.json(
          error(
            `Insufficient stock for "${row.model_name}": available ${Number(row.quantity_remaining)}, requested ${requiredQty}`,
          ),
          { status: 400 },
        );
      }
    }

    const saleId = await createSale(parsed.data);
    return NextResponse.json(success({ saleId }, "Sale recorded successfully"));
  } catch (err) {
    console.error("Sale creation error:", err);
    return NextResponse.json(error("Failed to create sale"), { status: 500 });
  }
}
