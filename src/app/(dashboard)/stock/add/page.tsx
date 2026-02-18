import { requireAuth } from "@/lib/auth-guard";
import * as modelsRepo from "@/lib/db/repositories/models.repository";
import * as suppliersRepo from "@/lib/db/repositories/suppliers.repository";
import { StockForm } from "./stock-form";

export default async function StockAddPage() {
  await requireAuth();
  const [models, suppliers] = await Promise.all([
    modelsRepo.findAll(),
    suppliersRepo.findAll(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Add Stock</h1>
      <StockForm models={models} suppliers={suppliers} />
    </div>
  );
}
