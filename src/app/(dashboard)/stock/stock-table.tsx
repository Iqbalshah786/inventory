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

  const filtered = dateFilter
    ? data.filter((r) => r.purchase_date.startsWith(dateFilter))
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
