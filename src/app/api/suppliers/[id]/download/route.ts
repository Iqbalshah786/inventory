import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as suppliersRepo from "@/lib/db/repositories/suppliers.repository";
import * as XLSX from "xlsx";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supplierId = Number(id);
  if (!supplierId) {
    return NextResponse.json({ error: "Invalid supplier id" }, { status: 400 });
  }

  const supplier = await suppliersRepo.findById(supplierId);
  if (!supplier) {
    return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
  }

  const history = await suppliersRepo.findPurchaseHistory(supplierId);

  // Return JSON for in-app viewing
  const url = new URL(_request.url);
  if (url.searchParams.get("format") === "json") {
    return NextResponse.json({
      supplier_name: supplier.name,
      rows: history.map((r) => ({
        lot_id: r.lot_id,
        purchase_date: r.purchase_date,
        model_name: r.model_name,
        quantity: r.quantity,
        unit_price_usd: Number(r.unit_price_usd),
        line_total_usd: Number(r.line_total_usd),
        fedex_cost_usd: Number(r.fedex_cost_usd),
        local_cost_aed: Number(r.local_cost_aed),
      })),
    });
  }

  const wsData = [
    ["Supplier Name", supplier.name],
    [],
    [
      "Lot #",
      "Date",
      "Model",
      "Quantity",
      "Unit Price (USD)",
      "Line Total (USD)",
      "FedEx (USD)",
      "Local Expense (AED)",
    ],
    ...history.map((r) => [
      r.lot_id,
      r.purchase_date,
      r.model_name,
      r.quantity,
      Number(r.unit_price_usd),
      Number(r.line_total_usd),
      Number(r.fedex_cost_usd),
      Number(r.local_cost_aed),
    ]),
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!cols"] = [
    { wch: 8 },
    { wch: 12 },
    { wch: 25 },
    { wch: 10 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Purchase History");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${supplier.name.replace(/"/g, "")}_history.xlsx"`,
    },
  });
}
