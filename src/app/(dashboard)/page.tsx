import { requireAuth } from "@/lib/auth-guard";
import { query } from "@/lib/db/connection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Smartphone, Package, ShoppingCart } from "lucide-react";

interface CountRow {
  count: number;
}

async function getStats() {
  const [clients, models, stock, sales] = await Promise.all([
    query<CountRow>("SELECT COUNT(*)::int AS count FROM clients"),
    query<CountRow>("SELECT COUNT(*)::int AS count FROM mobile_models"),
    query<CountRow>(
      "SELECT COALESCE(SUM(quantity_remaining),0)::int AS count FROM inventory",
    ),
    query<CountRow>("SELECT COUNT(*)::int AS count FROM sales"),
  ]);

  return {
    clients: clients[0]?.count ?? 0,
    models: models[0]?.count ?? 0,
    stock: stock[0]?.count ?? 0,
    sales: sales[0]?.count ?? 0,
  };
}

export default async function HomePage() {
  await requireAuth();
  const stats = await getStats();

  const cards = [
    { title: "Clients", value: stats.clients, icon: Users },
    { title: "Models", value: stats.models, icon: Smartphone },
    { title: "Stock Units", value: stats.stock, icon: Package },
    { title: "Total Sales", value: stats.sales, icon: ShoppingCart },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
