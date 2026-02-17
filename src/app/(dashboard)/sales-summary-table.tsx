"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

// ---- types ----

interface SalesSummaryRow {
  sale_id: number;
  client_name: string;
  total_quantity: number;
  total_aed: number;
  sale_date: string;
}

// ---- PDF / print helper ----

function printRow(row: SalesSummaryRow) {
  const companyName = "Your Company Name"; // placeholder

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice #${row.sale_id}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 4px 0; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 10px 14px; text-align: left; }
    th { background: #f5f5f5; }
    .total-row td { font-weight: bold; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${companyName}</h1>
    <p>Sales Invoice</p>
  </div>

  <table>
    <tr><th>Invoice #</th><td>${row.sale_id}</td></tr>
    <tr><th>Client</th><td>${row.client_name}</td></tr>
    <tr><th>Date</th><td>${row.sale_date}</td></tr>
    <tr><th>Total Qty</th><td>${row.total_quantity}</td></tr>
    <tr class="total-row"><th>Total Amount</th><td>${Number(row.total_aed).toFixed(2)} AED</td></tr>
  </table>

  <script>window.onload=function(){window.print();}<\/script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// ---- columns ----

const columns: ColumnDef<SalesSummaryRow>[] = [
  {
    accessorKey: "client_name",
    header: "Client Name",
    filterFn: "includesString",
  },
  {
    accessorKey: "total_quantity",
    header: "Total Qty Sold",
    cell: ({ row }) => row.getValue<number>("total_quantity"),
  },
  {
    accessorKey: "total_aed",
    header: "Total Bill (AED)",
    cell: ({ row }) => {
      const val = Number(row.getValue("total_aed"));
      return <span className="font-medium">{val.toFixed(2)} AED</span>;
    },
  },
  {
    accessorKey: "sale_date",
    header: "Date",
  },
  {
    id: "print",
    header: "Print",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => printRow(row.original)}
        title="Print invoice"
      >
        <Printer className="h-4 w-4" />
      </Button>
    ),
  },
];

// ---- main component ----

export function SalesSummaryTable() {
  const [data, setData] = useState<SalesSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/sales-summary?${params.toString()}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error("Failed to load sales summary", err);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: { globalFilter },
  });

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">From</label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-44"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">To</label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-44"
          />
        </div>
        <div className="flex-1">
          <Input
            placeholder="Search client…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
