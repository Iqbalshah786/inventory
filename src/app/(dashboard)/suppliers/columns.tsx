"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { SupplierWithBalance } from "@/types";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ViewHistoryDialog } from "./view-history-dialog";

export const supplierColumns: ColumnDef<SupplierWithBalance>[] = [
  {
    accessorKey: "name",
    header: "Supplier Name",
    filterFn: "includesString",
  },
  {
    accessorKey: "balance_aed",
    header: "Balance (AED)",
    cell: ({ row }) => {
      const val = Number(row.getValue("balance_aed"));
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
      const supplierId = row.original.id;
      return (
        <div className="flex items-center gap-1">
          <ViewHistoryDialog supplierId={supplierId} />
          <Button
            variant="ghost"
            size="icon"
            title="Download purchase history"
            onClick={() => {
              window.open(`/api/suppliers/${supplierId}/download`, "_blank");
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
