"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Client, MobileModel, SaleFormRow } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Save } from "lucide-react";

interface SellerFormProps {
  clients: Client[];
  models: MobileModel[];
}

const emptyRow: SaleFormRow = {
  client_id: "",
  model_id: "",
  quantity: "",
  selling_price: "",
  total: 0,
};

export function SellerForm({ clients, models }: SellerFormProps) {
  const router = useRouter();
  const [rows, setRows] = useState<SaleFormRow[]>([{ ...emptyRow }]);
  const [amountReceived, setAmountReceived] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Determine if selected client is walkin
  const selectedClientId = rows[0]?.client_id;
  const selectedClient = clients.find((c) => c.id === Number(selectedClientId));
  const isWalkin = selectedClient?.client_type === "walkin";

  function updateRow(index: number, field: keyof SaleFormRow, value: string) {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const updated = { ...row };

        if (field === "client_id" || field === "model_id") {
          (updated[field] as number | "") = value ? Number(value) : "";
        } else if (field === "quantity" || field === "selling_price") {
          (updated[field] as number | "") = value ? Number(value) : "";
        }

        // Auto-calculate total
        const qty = Number(updated.quantity) || 0;
        const sp = Number(updated.selling_price) || 0;
        updated.total = qty * sp;

        return updated;
      }),
    );
  }

  // When client changes in first row, propagate to all rows
  function updateClient(value: string) {
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        client_id: value ? Number(value) : "",
      })),
    );
  }

  function addRow() {
    const clientId = rows[0]?.client_id ?? "";
    setRows((prev) => [...prev, { ...emptyRow, client_id: clientId }]);
  }

  function removeRow(index: number) {
    setRows((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
    );
  }

  const totalPurchase = useMemo(
    () => rows.reduce((s, r) => s + r.total, 0),
    [rows],
  );

  async function handleSave() {
    setError("");
    setSaving(true);

    const payload = {
      items: rows.map((r) => ({
        client_id: Number(r.client_id) || 0,
        model_id: Number(r.model_id) || 0,
        quantity: Number(r.quantity) || 0,
        selling_price: Number(r.selling_price) || 0,
      })),
      amount_received:
        isWalkin && amountReceived ? Number(amountReceived) : undefined,
      is_walkin: isWalkin,
    };

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message);
      } else {
        router.push("/clients");
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-end gap-2 rounded-md border p-3">
            {/* Client - only shown on first row to set for all */}
            <div className="min-w-[140px]">
              {idx === 0 && (
                <Label className="mb-1 block text-xs">Client</Label>
              )}
              {idx === 0 ? (
                <Select
                  value={String(row.client_id)}
                  onValueChange={updateClient}
                >
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
              ) : (
                <div className="h-9 flex items-center px-3 text-sm text-muted-foreground">
                  {selectedClient?.name ?? "—"}
                </div>
              )}
            </div>

            <div className="min-w-[140px]">
              {idx === 0 && <Label className="mb-1 block text-xs">Model</Label>}
              <Select
                value={String(row.model_id)}
                onValueChange={(v) => updateRow(idx, "model_id", v)}
              >
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
            </div>

            <div className="w-24">
              {idx === 0 && <Label className="mb-1 block text-xs">Qty</Label>}
              <Input
                type="number"
                min={1}
                placeholder="Qty"
                value={row.quantity}
                onChange={(e) => updateRow(idx, "quantity", e.target.value)}
              />
            </div>

            <div className="w-28">
              {idx === 0 && (
                <Label className="mb-1 block text-xs">Sell Price</Label>
              )}
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="Sell"
                value={row.selling_price}
                onChange={(e) =>
                  updateRow(idx, "selling_price", e.target.value)
                }
              />
            </div>

            <div className="w-28">
              {idx === 0 && <Label className="mb-1 block text-xs">Total</Label>}
              <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm font-medium">
                {row.total.toFixed(2)}
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeRow(idx)}
              disabled={rows.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={addRow}>
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Button>
        </div>
      </div>

      {/* Conditional: show Amount Received only for walkin */}
      {isWalkin && (
        <div className="max-w-sm space-y-2">
          <Label>Amount Received</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={amountReceived}
            onChange={(e) => setAmountReceived(e.target.value)}
            placeholder="0.00"
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between rounded-md border p-4">
        <div className="text-lg font-semibold">
          Total Purchase Amount:{" "}
          <span className="text-primary">{totalPurchase.toFixed(2)} AED</span>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving…" : "Save Sale"}
        </Button>
      </div>
    </div>
  );
}
