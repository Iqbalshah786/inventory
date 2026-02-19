"use client";

import { useActionState, useEffect, useState } from "react";
import { addExpenseAction } from "./actions";
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
import { DollarSign } from "lucide-react";
import type { ModelWithInventory } from "@/types";

interface AddExpenseDialogProps {
  models: ModelWithInventory[];
}

export function AddExpenseDialog({ models }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addExpenseAction, null);

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <DollarSign className="mr-2 h-4 w-4" /> Expense
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Expense to Model</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4" noValidate>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="model_id">Model</Label>
            <Select name="model_id">
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.model_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.model_id && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.model_id}
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
            />
            {state?.fieldErrors?.amount_aed && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.amount_aed}
              </p>
            )}
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Saving…" : "Add Expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
