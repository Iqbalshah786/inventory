"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { ModelWithInventory } from "@/types";

export const modelColumns: ColumnDef<ModelWithInventory>[] = [
  {
    accessorKey: "model_name",
    header: "Model Name",
    filterFn: "includesString",
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => Number(row.getValue("quantity")),
  },
  {
    accessorKey: "price_per_piece",
    header: "Price Per Piece",
    cell: ({ row }) => {
      const val = Number(row.getValue("price_per_piece"));
      return `${val.toFixed(2)} AED`;
    },
  },
  {
    accessorKey: "total_cost",
    header: "Total Cost",
    cell: ({ row }) => {
      const val = Number(row.getValue("total_cost"));
      return `${val.toFixed(2)} AED`;
    },
  },
];
