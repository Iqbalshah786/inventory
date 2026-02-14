"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { StockListRow } from "@/types";

export const stockColumns: ColumnDef<StockListRow>[] = [
  {
    accessorKey: "purchase_date",
    header: "Date",
    cell: ({ row }) => {
      const raw = row.getValue("purchase_date");
      const d = raw instanceof Date ? raw : new Date(raw as string);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    },
  },
  {
    accessorKey: "model_name",
    header: "Model",
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
  },
  {
    accessorKey: "buying_price",
    header: "Buying Price",
    cell: ({ row }) => `$${Number(row.getValue("buying_price")).toFixed(2)}`,
  },
  {
    accessorKey: "fedex_cost",
    header: "FedEx Cost",
    cell: ({ row }) => `$${Number(row.getValue("fedex_cost")).toFixed(2)}`,
  },
  {
    accessorKey: "local_expense",
    header: "Local Expense",
    cell: ({ row }) =>
      `${Number(row.getValue("local_expense")).toFixed(2)} AED`,
  },
  {
    accessorKey: "total_price",
    header: "Total Price",
    cell: ({ row }) => `$${Number(row.getValue("total_price")).toFixed(2)}`,
  },
];
