"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { ClientWithBalance } from "@/types";
import { Badge } from "@/components/ui/badge";

export const clientColumns: ColumnDef<ClientWithBalance>[] = [
  {
    accessorKey: "name",
    header: "Name",
    filterFn: "includesString",
  },
  {
    accessorKey: "client_type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("client_type") as string;
      return (
        <Badge variant={type === "walkin" ? "secondary" : "default"}>
          {type === "walkin" ? "Walk-in" : "Regular"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "balance",
    header: "Balance",
    cell: ({ row }) => {
      const val = Number(row.getValue("balance"));
      return <span className="font-medium">{val.toFixed(2)} AED</span>;
    },
  },
];
