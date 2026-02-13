import { requireAuth } from "@/lib/auth-guard";
import * as stockRepo from "@/lib/db/repositories/stock.repository";
import { StockTable } from "./stock-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function StockPage() {
  await requireAuth();
  const stockData = await stockRepo.findAll();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stock Listing</h1>
        <Link href="/stock/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Stock
          </Button>
        </Link>
      </div>
      <StockTable data={stockData} />
    </div>
  );
}
