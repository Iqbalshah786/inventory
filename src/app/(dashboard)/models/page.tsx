import { requireAuth } from "@/lib/auth-guard";
import * as modelsRepo from "@/lib/db/repositories/models.repository";
import { DataTable } from "@/components/data-table";
import { modelColumns } from "./columns";
import { AddModelDialog } from "./add-model-dialog";
import { AddExpenseDialog } from "./add-expense-dialog";

export default async function ModelsPage() {
  await requireAuth();
  const models = await modelsRepo.findAllWithInventory();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mobile Models</h1>
        <div className="flex items-center gap-2">
          <AddExpenseDialog models={models} />
          <AddModelDialog />
        </div>
      </div>
      <DataTable
        columns={modelColumns}
        data={models}
        filterColumn="model_name"
        filterPlaceholder="Filter by model name…"
      />
    </div>
  );
}
