"use client";

import { useState, useMemo, Fragment } from "react";
import type { StockListRow, StockLotRow } from "@/types";
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
import { Printer, ChevronRight, ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import {
  printStockReceipt,
  type PrintableStock,
} from "@/lib/utils/print-invoice";

// ---- helpers ----

function formatDate(value: unknown): string {
  if (value instanceof Date) {
    const d = value;
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  }
  const s = String(value);
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  }
  return s;
}

function toDateString(value: unknown): string {
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(value);
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

/** Group flat rows into lot-level rows */
function groupByLot(rows: StockListRow[]): StockLotRow[] {
  const map = new Map<number, StockLotRow>();
  for (const r of rows) {
    let lot = map.get(r.lot_id);
    if (!lot) {
      lot = {
        lot_id: r.lot_id,
        purchase_date: r.purchase_date,
        supplier_name: r.supplier_name,
        total_quantity: 0,
        total_usd: 0,
        fedex_cost: Number(r.fedex_cost),
        local_expense: Number(r.local_expense),
        items: [],
      };
      map.set(r.lot_id, lot);
    }
    lot.total_quantity += Number(r.quantity);
    const lineTotal = Number(r.quantity) * Number(r.buying_price);
    lot.total_usd += lineTotal;
    lot.items.push({
      model_name: r.model_name,
      quantity: Number(r.quantity),
      buying_price: Number(r.buying_price),
      line_total: lineTotal,
    });
  }
  return Array.from(map.values());
}

// ---- sub-row component ----

function ItemDetailsRow({
  row,
  colSpan,
}: {
  row: Row<StockLotRow>;
  colSpan: number;
}) {
  const lot = row.original;
  const items = lot.items;

  return (
    <TableRow className="bg-muted/40">
      <TableCell colSpan={colSpan} className="p-0">
        <div className="px-8 py-3 space-y-3">
          {/* Supplier info */}
          <div className="flex gap-6 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">
                Supplier:{" "}
              </span>
              <span>{lot.supplier_name ?? "—"}</span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">FedEx: </span>
              <span>${Number(lot.fedex_cost).toFixed(2)}</span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">
                Local Expense:{" "}
              </span>
              <span>{Number(lot.local_expense).toFixed(2)} AED</span>
            </div>
          </div>

          {/* Items table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="pb-1 text-left font-medium">Model</th>
                <th className="pb-1 text-center font-medium">Qty</th>
                <th className="pb-1 text-right font-medium">
                  Price/Piece (USD)
                </th>
                <th className="pb-1 text-right font-medium">Total (USD)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-t border-border/50">
                  <td className="py-1">{item.model_name}</td>
                  <td className="py-1 text-center">{item.quantity}</td>
                  <td className="py-1 text-right">
                    ${Number(item.buying_price).toFixed(2)}
                  </td>
                  <td className="py-1 text-right">
                    ${Number(item.line_total).toFixed(2)}
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

const columns: ColumnDef<StockLotRow>[] = [
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
    accessorKey: "supplier_name",
    header: "Supplier",
    cell: ({ row }) => row.original.supplier_name ?? "—",
    filterFn: "includesString",
  },
  {
    accessorKey: "total_quantity",
    header: "Total Quantity",
    cell: ({ row }) => row.getValue<number>("total_quantity"),
  },
  {
    accessorKey: "total_usd",
    header: "Total (USD)",
    cell: ({ row }) => {
      const val = Number(row.getValue("total_usd"));
      return <span className="font-medium">${val.toFixed(2)}</span>;
    },
  },
  {
    accessorKey: "purchase_date",
    header: "Date",
    cell: ({ row }) => formatDate(row.getValue("purchase_date")),
  },
  {
    id: "print",
    header: "Print",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => printStockReceipt(row.original as PrintableStock)}
        title="Print receipt"
      >
        <Printer className="h-4 w-4" />
      </Button>
    ),
  },
];

// ---- main component ----

interface StockTableProps {
  data: StockListRow[];
}

export function StockTable({ data }: StockTableProps) {
  const [dateFilter, setDateFilter] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");

  const filtered = dateFilter
    ? data.filter((r) => toDateString(r.purchase_date) === dateFilter)
    : data;

  const grouped = useMemo(() => groupByLot(filtered), [filtered]);

  const table = useReactTable({
    data: grouped,
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
          <label className="mb-1 block text-sm font-medium">Date</label>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-44"
          />
        </div>
        <div className="flex-1">
          <Input
            placeholder="Search supplier…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Link href="/stock/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Stock
          </Button>
        </Link>
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
            {table.getRowModel().rows.length ? (
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
