import { requireAuth } from "@/lib/auth-guard";
import * as stockRepo from "@/lib/db/repositories/stock.repository";
import { StockTable } from "./stock-table";

export default async function StockPage() {
  await requireAuth();
  const stockData = await stockRepo.findAll();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stock Listing</h1>
      </div>
      <StockTable data={stockData} />
    </div>
  );
}
