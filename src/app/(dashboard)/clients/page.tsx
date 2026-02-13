import { requireAuth } from "@/lib/auth-guard";
import * as clientsRepo from "@/lib/db/repositories/clients.repository";
import { DataTable } from "@/components/data-table";
import { clientColumns } from "./columns";
import { AddClientDialog } from "./add-client-dialog";

export default async function ClientsPage() {
  await requireAuth();
  const clients = await clientsRepo.findAllWithBalance();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clients</h1>
        <AddClientDialog />
      </div>
      <DataTable
        columns={clientColumns}
        data={clients}
        filterColumn="name"
        filterPlaceholder="Search by name…"
      />
    </div>
  );
}
