import { requireAuth } from "@/lib/auth-guard";
import * as suppliersRepo from "@/lib/db/repositories/suppliers.repository";
import { DataTable } from "@/components/data-table";
import { supplierColumns } from "./columns";
import { AddSupplierDialog } from "./add-supplier-dialog";

export default async function SuppliersPage() {
  await requireAuth();
  const suppliers = await suppliersRepo.findAllWithBalance();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <AddSupplierDialog />
      </div>
      <DataTable
        columns={supplierColumns}
        data={suppliers}
        filterColumn="name"
        filterPlaceholder="Search by name…"
      />
    </div>
  );
}
