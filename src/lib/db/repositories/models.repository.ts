import { query, execute, getClient } from "@/lib/db/connection";
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

/**
 * Add an expense to a model.
 * This adds the amount to the model's total cost in inventory,
 * recalculates avg_cost_aed = total_cost / quantity,
 * and records the expense in ledger_transactions.
 */
export async function addExpense(
  modelId: number,
  amountAed: number,
): Promise<void> {
  const client = await getClient();
  try {
    await client.query("BEGIN");

    // Get current inventory for the model
    const invRes = await client.query(
      "SELECT id, quantity_remaining, avg_cost_aed FROM inventory WHERE model_id = $1",
      [modelId],
    );

    if (invRes.rows.length === 0) {
      throw new Error("No inventory found for this model");
    }

    const inv = invRes.rows[0] as {
      id: number;
      quantity_remaining: number;
      avg_cost_aed: number;
    };

    const currentTotal = inv.quantity_remaining * inv.avg_cost_aed;
    const newTotal = currentTotal + amountAed;
    const newAvg =
      inv.quantity_remaining > 0 ? newTotal / inv.quantity_remaining : 0;

    // Update inventory avg_cost_aed
    await client.query(
      "UPDATE inventory SET avg_cost_aed = $1 WHERE model_id = $2",
      [newAvg, modelId],
    );

    // Get model name for ledger description
    const modelRes = await client.query(
      "SELECT model_name FROM mobile_models WHERE id = $1",
      [modelId],
    );
    const modelName =
      (modelRes.rows[0] as { model_name: string })?.model_name ??
      `Model ${modelId}`;

    // Ensure expense ledger account
    await client.query(
      `INSERT INTO ledger_accounts (account_name, account_type)
       SELECT 'Expenses', 'expense'
       WHERE NOT EXISTS (
         SELECT 1 FROM ledger_accounts WHERE account_name = 'Expenses' AND account_type = 'expense'
       )`,
    );

    const acctRes = await client.query(
      "SELECT id FROM ledger_accounts WHERE account_name = 'Expenses' AND account_type = 'expense'",
    );
    const acctId: number = (acctRes.rows[0] as { id: number }).id;

    // Record expense in ledger_transactions (credit column for costs)
    await client.query(
      `INSERT INTO ledger_transactions
        (account_id, transaction_date, description, debit_aed, credit_aed, reference_type, reference_id)
       VALUES ($1, CURRENT_DATE, $2, 0, $3, 'expense', $4)`,
      [acctId, `Expense for ${modelName}`, amountAed, modelId],
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
