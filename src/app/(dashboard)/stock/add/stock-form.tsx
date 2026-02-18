"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MobileModel, Supplier, StockFormRow } from "@/types";
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

interface StockFormProps {
  models: MobileModel[];
  suppliers: Supplier[];
}

const emptyRow: StockFormRow = {
  model_id: "",
  quantity: "",
  buyer_price_usd: "",
};

export function StockForm({ models, suppliers }: StockFormProps) {
  const router = useRouter();
  const [rows, setRows] = useState<StockFormRow[]>([{ ...emptyRow }]);
  const [fedexCost, setFedexCost] = useState("");
  const [localExpense, setLocalExpense] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateRow(index: number, field: keyof StockFormRow, value: string) {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]:
                field === "model_id" ? (value ? Number(value) : "") : value,
            }
          : row,
      ),
    );
  }

  function addRow() {
    setRows((prev) => [...prev, { ...emptyRow }]);
  }

  function removeRow(index: number) {
    setRows((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
    );
  }

  async function handleSave() {
    setError("");
    setSaving(true);

    const payload = {
      items: rows.map((r) => ({
        model_id: Number(r.model_id) || 0,
        quantity: Number(r.quantity) || 0,
        buyer_price_usd: Number(r.buyer_price_usd) || 0,
      })),
      fedex_cost_usd: Number(fedexCost) || 0,
      local_expense_aed: Number(localExpense) || 0,
      amount_paid: amountPaid ? Number(amountPaid) : undefined,
      supplier_id: supplierId ? Number(supplierId) : undefined,
    };

    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message);
      } else {
        router.push("/stock");
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

      {/* Supplier selection */}
      <div className="max-w-sm space-y-2">
        <Label>Supplier</Label>
        <Select value={supplierId} onValueChange={setSupplierId}>
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
      </div>

      <div className="space-y-3">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-end gap-3 rounded-md border p-3">
            <div className="flex-1 min-w-[160px]">
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

            <div className="w-28">
              {idx === 0 && (
                <Label className="mb-1 block text-xs">Quantity</Label>
              )}
              <Input
                type="number"
                min={1}
                placeholder="Qty"
                value={row.quantity}
                onChange={(e) => updateRow(idx, "quantity", e.target.value)}
              />
            </div>

            <div className="w-36">
              {idx === 0 && (
                <Label className="mb-1 block text-xs">Buyer Price (USD)</Label>
              )}
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="Price USD"
                value={row.buyer_price_usd}
                onChange={(e) =>
                  updateRow(idx, "buyer_price_usd", e.target.value)
                }
              />
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>FedEx Cost (USD)</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={fedexCost}
            onChange={(e) => setFedexCost(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label>Local Expense (AED)</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={localExpense}
            onChange={(e) => setLocalExpense(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label>Amount Paid (optional)</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving…" : "Save Stock"}
        </Button>
      </div>
    </div>
  );
}
