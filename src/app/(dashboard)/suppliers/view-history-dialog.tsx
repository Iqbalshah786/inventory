"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye } from "lucide-react";

interface HistoryRow {
  lot_id: number;
  purchase_date: string;
  model_name: string;
  quantity: number;
  unit_price_usd: number;
  line_total_usd: number;
  fedex_cost_usd: number;
  local_cost_aed: number;
}

interface HistoryData {
  supplier_name: string;
  rows: HistoryRow[];
}

export function ViewHistoryDialog({ supplierId }: { supplierId: number }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (data) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/suppliers/${supplierId}/download?format=json`,
      );
      const json = await res.json();
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [supplierId, data]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) fetchData();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="View purchase history">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {data
              ? `${data.supplier_name} — Purchase History`
              : "Supplier History"}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        )}

        {data && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price (USD)</TableHead>
                <TableHead className="text-right">Line Total (USD)</TableHead>
                <TableHead className="text-right">FedEx (USD)</TableHead>
                <TableHead className="text-right">Local (AED)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    No purchase history
                  </TableCell>
                </TableRow>
              )}
              {data.rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>{r.lot_id}</TableCell>
                  <TableCell>{r.purchase_date}</TableCell>
                  <TableCell>{r.model_name}</TableCell>
                  <TableCell className="text-right">{r.quantity}</TableCell>
                  <TableCell className="text-right">
                    {r.unit_price_usd.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.line_total_usd.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.fedex_cost_usd.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.local_cost_aed.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
