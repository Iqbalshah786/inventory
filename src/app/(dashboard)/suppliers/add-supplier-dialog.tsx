"use client";

import { useActionState, useEffect, useState } from "react";
import { addSupplierAction } from "./actions";
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
import { Plus } from "lucide-react";

export function AddSupplierDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addSupplierAction, null);

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Supplier
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4" noValidate>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Supplier Name</Label>
            <Input id="name" name="name" />
            {state?.fieldErrors?.name && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.name}
              </p>
            )}
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Adding…" : "Add Supplier"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
