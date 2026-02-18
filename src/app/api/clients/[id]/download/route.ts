import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as clientsRepo from "@/lib/db/repositories/clients.repository";
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
  const clientId = Number(id);
  if (!clientId) {
    return NextResponse.json({ error: "Invalid client id" }, { status: 400 });
  }

  const client = await clientsRepo.findById(clientId);
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const history = await clientsRepo.findPurchaseHistory(clientId);

  const wsData = [
    ["Client Name", client.name],
    [],
    ["Sale #", "Date", "Model", "Quantity", "Price/Piece (AED)", "Total (AED)"],
    ...history.map((r) => [
      r.sale_id,
      r.sale_date,
      r.model_name,
      r.quantity,
      Number(r.selling_price_aed),
      Number(r.line_total_aed),
    ]),
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-size columns
  ws["!cols"] = [
    { wch: 10 },
    { wch: 12 },
    { wch: 25 },
    { wch: 10 },
    { wch: 18 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Purchase History");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${client.name.replace(/"/g, "")}_history.xlsx"`,
    },
  });
}
