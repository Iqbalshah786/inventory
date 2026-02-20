"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { ClientWithBalance } from "@/types";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ViewLedgerDialog } from "./view-ledger-dialog";

export const clientColumns: ColumnDef<ClientWithBalance>[] = [
  {
    accessorKey: "name",
    header: "Name",
    filterFn: "includesString",
  },
  {
    accessorKey: "balance",
    header: "Balance (AED)",
    cell: ({ row }) => {
      const val = Number(row.getValue("balance"));
      return <span className="font-medium">{val.toFixed(2)} AED</span>;
    },
  },
  {
    accessorKey: "balance_usd",
    header: "Balance (USD)",
    cell: ({ row }) => {
      const val = Number(row.getValue("balance_usd"));
      return <span className="font-medium">{val.toFixed(2)} USD</span>;
    },
  },
  {
    id: "actions",
    header: "Details",
    cell: ({ row }) => {
      const clientId = row.original.id;
      return (
        <div className="flex items-center gap-1">
          <ViewLedgerDialog clientId={clientId} />
          <Button
            variant="ghost"
            size="icon"
            title="Download ledger"
            onClick={() => {
              window.open(`/api/clients/${clientId}/download`, "_blank");
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
