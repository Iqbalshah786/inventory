"use client";

import { useState } from "react";
import type { StockListRow } from "@/types";
import { DataTable } from "@/components/data-table";
import { stockColumns } from "./columns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface StockTableProps {
  data: StockListRow[];
}

export function StockTable({ data }: StockTableProps) {
  const [dateFilter, setDateFilter] = useState("");

  // Normalise purchase_date to "YYYY-MM-DD" regardless of what PG/Neon returns
  function toDateString(value: unknown): string {
    if (value instanceof Date) {
      const y = value.getFullYear();
      const m = String(value.getMonth() + 1).padStart(2, "0");
      const d = String(value.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    // Neon may return a string like "2026-02-13" already
    const s = String(value);
    // Try parsing if it's not already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, "0");
      const d = String(parsed.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    return s;
  }

  const filtered = dateFilter
    ? data.filter((r) => toDateString(r.purchase_date) === dateFilter)
    : data;

  function downloadCsv() {
    const headers = [
      "Date",
      "Model",
      "Quantity",
      "Buying Price",
      "FedEx Cost",
      "Local Expense",
      "Total Price",
    ];
    const csvRows = [
      headers.join(","),
      ...filtered.map((r) =>
        [
          r.purchase_date,
          `"${r.model_name}"`,
          r.quantity,
          r.buying_price,
          r.fedex_cost,
          r.local_expense,
          r.total_price,
        ].join(","),
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-auto"
        />
        <Button variant="outline" onClick={downloadCsv}>
          <Download className="mr-2 h-4 w-4" /> Download
        </Button>
      </div>
      <DataTable
        columns={stockColumns}
        data={filtered}
        filterColumn="model_name"
        filterPlaceholder="Filter by model…"
      />
    </div>
  );
}
