import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stockFormSchema } from "@/lib/validations";
import { createStock } from "@/lib/db/repositories/stock.repository";
import { success, error } from "@/lib/utils/api-response";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(error("Unauthorized"), { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = stockFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        error(parsed.error.issues[0]?.message ?? "Validation failed"),
        { status: 400 },
      );
    }

    const lotId = await createStock(parsed.data);
    return NextResponse.json(success({ lotId }, "Stock added successfully"));
  } catch (err) {
    console.error("Stock creation error:", err);
    return NextResponse.json(error("Failed to create stock"), { status: 500 });
  }
}
