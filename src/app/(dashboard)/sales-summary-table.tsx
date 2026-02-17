"use client";

import { useCallback, useEffect, useState, Fragment } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  useReactTable,
  Row,
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
import { Printer, ChevronRight, ChevronDown } from "lucide-react";

// ---- types ----

interface SaleItemDetail {
  model_name: string;
  quantity: number;
  selling_price_aed: number;
  line_total_aed: number;
}

interface SalesSummaryRow {
  sale_id: number;
  client_name: string;
  total_quantity: number;
  total_aed: number;
  sale_date: string;
  items: SaleItemDetail[];
}

// ---- PDF / print helper ----

function printRow(row: SalesSummaryRow) {
  const companyName = "Dhar Al Fakhr"; // placeholder

  const itemRows = row.items
    .map(
      (item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.model_name}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${Number(item.selling_price_aed).toFixed(2)}</td>
      <td style="text-align:right">${Number(item.line_total_aed).toFixed(2)}</td>
    </tr>`,
    )
    .join("");

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
    .info-table { width: 100%; margin-bottom: 20px; }
    .info-table td { padding: 4px 8px; }
    .info-table .label { font-weight: bold; width: 120px; }
    .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px 14px; }
    .items-table th { background: #f5f5f5; text-align: left; }
    .total-row { font-weight: bold; background: #fafafa; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${companyName}</h1>
    <p>Sales Invoice</p>
  </div>

  <table class="info-table">
    <tr><td class="label">Invoice #</td><td>${row.sale_id}</td></tr>
    <tr><td class="label">Client</td><td>${row.client_name}</td></tr>
    <tr><td class="label">Date</td><td>${row.sale_date}</td></tr>
  </table>

  <table class="items-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Model</th>
        <th style="text-align:center">Quantity</th>
        <th style="text-align:right">Price/Piece (AED)</th>
        <th style="text-align:right">Total (AED)</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      <tr class="total-row">
        <td colspan="2">Total</td>
        <td style="text-align:center">${row.total_quantity}</td>
        <td></td>
        <td style="text-align:right">${Number(row.total_aed).toFixed(2)}</td>
      </tr>
    </tbody>
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

// ---- sub-row component ----

function ItemDetailsRow({
  row,
  colSpan,
}: {
  row: Row<SalesSummaryRow>;
  colSpan: number;
}) {
  const items = row.original.items;
  if (!items || items.length === 0) return null;

  return (
    <TableRow className="bg-muted/40">
      <TableCell colSpan={colSpan} className="p-0">
        <div className="px-8 py-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="pb-1 text-left font-medium">Model</th>
                <th className="pb-1 text-center font-medium">Qty</th>
                <th className="pb-1 text-right font-medium">
                  Price/Piece (AED)
                </th>
                <th className="pb-1 text-right font-medium">Total (AED)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-t border-border/50">
                  <td className="py-1">{item.model_name}</td>
                  <td className="py-1 text-center">{item.quantity}</td>
                  <td className="py-1 text-right">
                    {Number(item.selling_price_aed).toFixed(2)}
                  </td>
                  <td className="py-1 text-right">
                    {Number(item.line_total_aed).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ---- columns ----

const columns: ColumnDef<SalesSummaryRow>[] = [
  {
    id: "expand",
    header: "",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => row.toggleExpanded()}
      >
        {row.getIsExpanded() ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    ),
  },
  {
    accessorKey: "client_name",
    header: "Client Name",
    filterFn: "includesString",
  },
  {
    accessorKey: "total_quantity",
    header: "Total Quantity Sold",
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
    getExpandedRowModel: getExpandedRowModel(),
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
                <Fragment key={row.id}>
                  <TableRow>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <ItemDetailsRow row={row} colSpan={columns.length} />
                  )}
                </Fragment>
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
