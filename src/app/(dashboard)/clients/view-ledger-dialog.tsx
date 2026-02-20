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

interface LedgerRow {
  transaction_date: string;
  description: string;
  credit: number;
  debit: number;
}

interface LedgerData {
  client_name: string;
  rows: LedgerRow[];
  balance: number;
}

export function ViewLedgerDialog({ clientId }: { clientId: number }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (data) return; // already loaded
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/download?format=json`);
      const json = await res.json();
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [clientId, data]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) fetchData();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="View ledger">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {data ? `${data.client_name} — Ledger` : "Client Ledger"}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        )}

        {data && (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Details (Particulars)</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No transactions
                    </TableCell>
                  </TableRow>
                )}
                {data.rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.transaction_date}</TableCell>
                    <TableCell>{r.description}</TableCell>
                    <TableCell className="text-right">
                      {r.credit ? r.credit.toFixed(2) : ""}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.debit ? r.debit.toFixed(2) : ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end border-t pt-3">
              <span className="font-semibold">
                Balance: {data.balance.toFixed(2)} AED
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
