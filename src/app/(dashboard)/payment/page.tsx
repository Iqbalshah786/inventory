import { requireAuth } from "@/lib/auth-guard";
import * as clientsRepo from "@/lib/db/repositories/clients.repository";
import * as suppliersRepo from "@/lib/db/repositories/suppliers.repository";
import { AED_PER_USD } from "@/lib/utils/currency";
import { ReceivedDialog } from "./received-dialog";
import { PaidDialog } from "./paid-dialog";

export default async function PaymentPage() {
  await requireAuth();
  const [allClients, suppliers] = await Promise.all([
    clientsRepo.findAll(),
    suppliersRepo.findAll(),
  ]);
  // Exclude walk-in clients from the payment received dropdown
  const clients = allClients.filter((c) => c.client_type !== "walkin");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payment</h1>
      <div className="flex justify-end w-full gap-4">
        <ReceivedDialog clients={clients} />
        <PaidDialog suppliers={suppliers} aedPerUsd={AED_PER_USD} />
      </div>
    </div>
  );
}
