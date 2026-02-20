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
import {
  printSaleInvoice,
  type PrintableSale,
} from "@/lib/utils/print-invoice";

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
  description: string | null;
  items: SaleItemDetail[];
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
    cell: ({ row }) => {
      const orig = row.original;
      const printable: PrintableSale = {
        sale_id: orig.sale_id,
        client_name: orig.client_name,
        total_quantity: orig.total_quantity,
        total_aed: orig.total_aed,
        sale_date: orig.sale_date,
        description: orig.description ?? undefined,
        items: orig.items,
      };
      return (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => printSaleInvoice(printable)}
          title="Print invoice"
        >
          <Printer className="h-4 w-4" />
        </Button>
      );
    },
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
