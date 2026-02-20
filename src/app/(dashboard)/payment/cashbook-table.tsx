"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";

interface CashbookRow {
  id: number;
  transaction_date: string;
  description: string | null;
  reference_type: string;
  debit_aed: number;
  credit_aed: number;
}

interface CashbookData {
  opening_balance: number;
  rows: CashbookRow[];
}

export function CashbookTable() {
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [data, setData] = useState<CashbookData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (selectedDate: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cashbook?date=${selectedDate}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data as CashbookData);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  function handleDateChange(value: string) {
    setDate(value);
    if (value) {
      fetchData(value);
    }
  }

  // Calculations
  const openingBalance = data?.opening_balance ?? 0;
  const rows = data?.rows ?? [];

  const totalDebit = rows.reduce((s, r) => s + Number(r.debit_aed), 0);
  const totalCredit = rows.reduce((s, r) => s + Number(r.credit_aed), 0);

  // Opening balance shown in debit or credit column
  const obDebit = openingBalance > 0 ? openingBalance : 0;
  const obCredit = openingBalance < 0 ? Math.abs(openingBalance) : 0;

  // Closing balance = (obDebit + totalDebit) - (obCredit + totalCredit)
  const closingBalance = obDebit + totalDebit - (obCredit + totalCredit);
  const cbDebit = closingBalance > 0 ? closingBalance : 0;
  const cbCredit = closingBalance < 0 ? Math.abs(closingBalance) : 0;

  // Grand totals for display (sum all debit column entries, all credit column entries)
  const grandDebit = obDebit + totalDebit + cbDebit;
  const grandCredit = obCredit + totalCredit + cbCredit;

  async function handleDownloadExcel() {
    const XLSX = await import("xlsx");

    const excelRows: Record<string, string | number>[] = [];

    // Opening balance row
    excelRows.push({
      Date: date,
      Particulars: "Opening Balance",
      "Debit (AED)": obDebit || "",
      "Credit (AED)": obCredit || "",
    });

    // Data rows
    for (const r of rows) {
      excelRows.push({
        Date: r.transaction_date,
        Particulars: r.description ?? "",
        "Debit (AED)": Number(r.debit_aed) || "",
        "Credit (AED)": Number(r.credit_aed) || "",
      });
    }

    // Closing balance row
    excelRows.push({
      Date: "",
      Particulars: "Closing Balance",
      "Debit (AED)": cbDebit || "",
      "Credit (AED)": cbCredit || "",
    });

    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cashbook");
    XLSX.writeFile(wb, `cashbook-${date}.xlsx`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <Label htmlFor="cashbook-date">Date</Label>
          <Input
            id="cashbook-date"
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-44"
          />
        </div>

        {data && rows.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleDownloadExcel}>
            <Download className="mr-2 h-4 w-4" /> Download Excel
          </Button>
        )}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {data && !loading && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead>Particulars</TableHead>
                <TableHead className="text-right w-[150px]">
                  Debit (AED)
                </TableHead>
                <TableHead className="text-right w-[150px]">
                  Credit (AED)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Opening Balance row */}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell>{date}</TableCell>
                <TableCell>Opening Balance</TableCell>
                <TableCell className="text-right">
                  {obDebit ? obDebit.toFixed(2) : ""}
                </TableCell>
                <TableCell className="text-right">
                  {obCredit ? obCredit.toFixed(2) : ""}
                </TableCell>
              </TableRow>

              {/* Transaction rows */}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-6"
                  >
                    No transactions for this date.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.transaction_date}</TableCell>
                    <TableCell>{row.description ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {Number(row.debit_aed)
                        ? Number(row.debit_aed).toFixed(2)
                        : ""}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(row.credit_aed)
                        ? Number(row.credit_aed).toFixed(2)
                        : ""}
                    </TableCell>
                  </TableRow>
                ))
              )}

              {/* Closing Balance row */}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell />
                <TableCell>Closing Balance</TableCell>
                <TableCell className="text-right">
                  {cbDebit ? cbDebit.toFixed(2) : ""}
                </TableCell>
                <TableCell className="text-right">
                  {cbCredit ? cbCredit.toFixed(2) : ""}
                </TableCell>
              </TableRow>

              {/* Grand Total row
              <TableRow className="bg-primary/10 font-bold">
                <TableCell />
                <TableCell>Total</TableCell>
                <TableCell className="text-right">
                  {grandDebit.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {grandCredit.toFixed(2)}
                </TableCell>
              </TableRow> */}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
