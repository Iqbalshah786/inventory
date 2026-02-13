import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saleFormSchema } from "@/lib/validations";
import { createSale } from "@/lib/db/repositories/sales.repository";
import { success, error } from "@/lib/utils/api-response";

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

    const saleId = await createSale(parsed.data);
    return NextResponse.json(success({ saleId }, "Sale recorded successfully"));
  } catch (err) {
    console.error("Sale creation error:", err);
    return NextResponse.json(error("Failed to create sale"), { status: 500 });
  }
}
