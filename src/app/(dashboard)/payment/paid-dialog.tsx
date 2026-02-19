"use client";

import { useActionState, useEffect, useState } from "react";
import { recordPaidAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpRight } from "lucide-react";
import type { Supplier } from "@/types";

interface PaidDialogProps {
  suppliers: Supplier[];
  aedPerUsd: number;
}

export function PaidDialog({ suppliers, aedPerUsd }: PaidDialogProps) {
  const [open, setOpen] = useState(false);
  const [amountAed, setAmountAed] = useState("");
  const [state, formAction, pending] = useActionState(recordPaidAction, null);

  const usdValue =
    amountAed && Number(amountAed) > 0
      ? (Number(amountAed) / aedPerUsd).toFixed(2)
      : "0.00";

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
      setAmountAed("");
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <ArrowUpRight className="h-4 w-4" /> Paid
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payment to Supplier</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4" noValidate>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="supplier_id">Supplier</Label>
            <Select name="supplier_id">
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.supplier_id && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.supplier_id}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount_aed">Amount (AED)</Label>
            <Input
              id="amount_aed"
              name="amount_aed"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amountAed}
              onChange={(e) => setAmountAed(e.target.value)}
            />
            {state?.fieldErrors?.amount_aed && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.amount_aed}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Auto-converted (USD)</Label>
            <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm font-medium">
              {usdValue} USD
            </div>
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Saving…" : "Record Payment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
