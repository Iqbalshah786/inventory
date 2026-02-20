import { requireAuth } from "@/lib/auth-guard";
import * as clientsRepo from "@/lib/db/repositories/clients.repository";
import * as modelsRepo from "@/lib/db/repositories/models.repository";
import { SellerForm } from "./seller-form";

export default async function SellerPage() {
  await requireAuth();
  // Ensure Walk-in client exists before loading client list
  await clientsRepo.ensureWalkinClient();
  const [clients, models] = await Promise.all([
    clientsRepo.findAll(),
    modelsRepo.findAllWithInventory(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sell</h1>
      <SellerForm clients={clients} models={models} />
    </div>
  );
}
