"use client";

import { useActionState, useEffect, useState } from "react";
import { addModelAction } from "./actions";
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

export function AddModelDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addModelAction, null);

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Model
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Model</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="model_name">Model Name</Label>
            <Input id="model_name" name="model_name" required />
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Adding…" : "Add Model"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
