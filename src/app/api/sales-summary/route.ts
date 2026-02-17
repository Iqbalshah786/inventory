import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db/connection";
import { success, error } from "@/lib/utils/api-response";

export interface SalesSummaryRow {
  sale_id: number;
  client_name: string;
  total_quantity: number;
  total_aed: number;
  sale_date: string;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(error("Unauthorized"), { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (from) {
      params.push(from);
      conditions.push(`s.sale_date >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      conditions.push(`s.sale_date <= $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = await query<SalesSummaryRow>(
      `SELECT
         s.id        AS sale_id,
         c.name      AS client_name,
         COALESCE(SUM(si.quantity), 0)::int AS total_quantity,
         s.total_amount_aed AS total_aed,
         s.sale_date::text   AS sale_date
       FROM sales s
       JOIN clients c ON c.id = s.client_id
       LEFT JOIN sale_items si ON si.sale_id = s.id
       ${where}
       GROUP BY s.id, c.name, s.total_amount_aed, s.sale_date
       ORDER BY s.sale_date DESC, s.id DESC`,
      params,
    );

    return NextResponse.json(success(rows));
  } catch (err) {
    console.error("Sales summary error:", err);
    return NextResponse.json(error("Failed to fetch sales summary"), {
      status: 500,
    });
  }
}
