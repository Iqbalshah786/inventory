"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { StockListRow } from "@/types";

export const stockColumns: ColumnDef<StockListRow>[] = [
  {
    accessorKey: "purchase_date",
    header: "Date",
    cell: ({ row }) => {
      const d = row.getValue("purchase_date") as string;
      return new Date(d).toLocaleDateString();
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
    cell: ({ row }) => `${Number(row.getValue("fedex_cost")).toFixed(2)} AED`,
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
