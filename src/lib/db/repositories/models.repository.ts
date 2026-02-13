import { query, execute } from "@/lib/db/connection";
import type { MobileModel, ModelWithInventory } from "@/types";

export async function findAll(): Promise<MobileModel[]> {
  return query<MobileModel>(
    "SELECT id, model_name FROM mobile_models ORDER BY model_name",
  );
}

export async function findAllWithInventory(): Promise<ModelWithInventory[]> {
  const sql = `
    SELECT
      m.id,
      m.model_name,
      COALESCE(i.quantity_remaining, 0) AS quantity,
      COALESCE(i.avg_cost_aed, 0) AS price_per_piece,
      COALESCE(i.quantity_remaining * i.avg_cost_aed, 0) AS total_cost
    FROM mobile_models m
    LEFT JOIN inventory i ON i.model_id = m.id
    ORDER BY m.model_name
  `;
  return query<ModelWithInventory>(sql);
}

export async function create(model_name: string): Promise<number> {
  const result = await execute(
    "INSERT INTO mobile_models (model_name) VALUES ($1) RETURNING id",
    [model_name],
  );
  return (result.rows[0] as { id: number }).id;
}
