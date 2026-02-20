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

  const ledger = await clientsRepo.findLedgerByClientId(clientId);

  let totalDebit = 0;
  let totalCredit = 0;

  const rows = ledger.map((r) => {
    const debit = Number(r.debit_aed);
    const credit = Number(r.credit_aed);
    totalDebit += debit;
    totalCredit += credit;
    return [r.transaction_date, r.description ?? "", credit || "", debit || ""];
  });

  const balance = totalDebit - totalCredit;

  // Return JSON for in-app viewing
  const url = new URL(_request.url);
  if (url.searchParams.get("format") === "json") {
    return NextResponse.json({
      client_name: client.name,
      rows: ledger.map((r) => ({
        transaction_date: r.transaction_date,
        description: r.description ?? "",
        credit: Number(r.credit_aed),
        debit: Number(r.debit_aed),
      })),
      balance,
    });
  }

  const wsData = [
    ["Client Name", client.name],
    [],
    ["Transaction Date", "Details (Particulars)", "Credit", "Debit"],
    ...rows,
    [],
    ["", "Balance", "", balance],
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-size columns
  ws["!cols"] = [{ wch: 16 }, { wch: 35 }, { wch: 15 }, { wch: 15 }];

  XLSX.utils.book_append_sheet(wb, ws, "Ledger");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${client.name.replace(/"/g, "")}_ledger.xlsx"`,
    },
  });
}
