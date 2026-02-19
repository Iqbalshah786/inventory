"use client";

import { useActionState, useEffect, useState } from "react";
import { recordReceivedAction } from "./actions";
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
import { ArrowDownLeft } from "lucide-react";
import type { Client } from "@/types";

interface ReceivedDialogProps {
  clients: Client[];
}

export function ReceivedDialog({ clients }: ReceivedDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    recordReceivedAction,
    null,
  );

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <ArrowDownLeft className="h-4 w-4" /> Received
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payment Received from Client</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="client_id">Client</Label>
            <Select name="client_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount_aed">Amount (AED)</Label>
            <Input
              id="amount_aed"
              name="amount_aed"
              type="number"
              min={0.01}
              step="0.01"
              placeholder="0.00"
              required
            />
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Saving…" : "Record Payment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
