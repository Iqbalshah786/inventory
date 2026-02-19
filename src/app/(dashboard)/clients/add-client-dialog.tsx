"use client";

import { useActionState, useEffect, useState } from "react";
import { addClientAction } from "./actions";
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

export function AddClientDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addClientAction, null);

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4" noValidate>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" />
            {state?.fieldErrors?.name && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.name}
              </p>
            )}
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Adding…" : "Add Client"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
