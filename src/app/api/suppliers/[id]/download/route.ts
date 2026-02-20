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

  const ledger = await suppliersRepo.findLedgerBySupplierId(supplierId);

  let totalDebit = 0;
  let totalCredit = 0;

  const rows = ledger.map((r) => {
    const debit = Number(r.debit_aed);
    const credit = Number(r.credit_aed);
    totalDebit += debit;
    totalCredit += credit;
    return [r.transaction_date, r.description ?? "", credit || "", debit || ""];
  });

  const balance = totalCredit - totalDebit;

  // Return JSON for in-app viewing
  const url = new URL(_request.url);
  if (url.searchParams.get("format") === "json") {
    return NextResponse.json({
      supplier_name: supplier.name,
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
    ["Supplier Name", supplier.name],
    [],
    ["Transaction Date", "Details (Particulars)", "Credit", "Debit"],
    ...rows,
    [],
    ["", "Balance", "", balance],
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!cols"] = [{ wch: 16 }, { wch: 35 }, { wch: 15 }, { wch: 15 }];

  XLSX.utils.book_append_sheet(wb, ws, "Ledger");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${supplier.name.replace(/"/g, "")}_ledger.xlsx"`,
    },
  });
}
