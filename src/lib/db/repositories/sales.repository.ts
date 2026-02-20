import { getClient } from "@/lib/db/connection";
import type { SaleFormInput } from "@/lib/validations";

export async function createSale(input: SaleFormInput): Promise<number> {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    const totalAed = input.items.reduce(
      (s, i) => s + i.quantity * i.selling_price,
      0,
    );

    const paymentType = input.is_walkin ? "cash" : "credit";

    // 1. Insert sale header
    const saleRes = await client.query(
      `INSERT INTO sales (client_id, sale_date, total_amount_aed, payment_type)
       VALUES ($1, CURRENT_DATE, $2, $3)
       RETURNING id`,
      [input.items[0].client_id, totalAed, paymentType],
    );
    const saleId: number = saleRes.rows[0].id;

    for (const item of input.items) {
      // 2. Get avg cost from inventory
      const invRes = await client.query(
        "SELECT avg_cost_aed FROM inventory WHERE model_id = $1",
        [item.model_id],
      );
      const costPriceAed = invRes.rows[0]?.avg_cost_aed ?? 0;

      // 3. Insert sale item
      await client.query(
        `INSERT INTO sale_items (sale_id, model_id, quantity, selling_price_aed, cost_price_aed)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          saleId,
          item.model_id,
          item.quantity,
          item.selling_price,
          costPriceAed,
        ],
      );

      // 4. Reduce inventory
      await client.query(
        `UPDATE inventory SET quantity_remaining = quantity_remaining - $1 WHERE model_id = $2`,
        [item.quantity, item.model_id],
      );
    }

    // 5. Ledger: client account
    const clientId = input.items[0].client_id;

    // Get client name
    const clientNameRes = await client.query(
      "SELECT name FROM clients WHERE id = $1",
      [clientId],
    );
    const clientName = clientNameRes.rows[0]?.name ?? `Client ${clientId}`;

    // Ensure ledger account
    await client.query(
      `INSERT INTO ledger_accounts (account_name, account_type)
       SELECT $1, 'client'
       WHERE NOT EXISTS (
         SELECT 1 FROM ledger_accounts WHERE account_name = $2 AND account_type = 'client'
       )`,
      [clientName, clientName],
    );

    const clientAcctRes = await client.query(
      "SELECT id FROM ledger_accounts WHERE account_name = $1 AND account_type = 'client'",
      [clientName],
    );
    const clientAcctId: number = clientAcctRes.rows[0].id;

    // Credit client with total sale
    const saleDescription = input.description?.trim()
      ? `Sale #${saleId} - ${input.description.trim()}`
      : `Sale #${saleId}`;
    await client.query(
      `INSERT INTO ledger_transactions
        (account_id, transaction_date, description, debit_aed, credit_aed, reference_type, reference_id)
       VALUES ($1, CURRENT_DATE, $2, 0, $3, 'sale', $4)`,
      [clientAcctId, saleDescription, totalAed, saleId],
    );

    // 6. If walkin and amount_received — record cash in
    if (input.is_walkin && input.amount_received && input.amount_received > 0) {
      await client.query(
        `INSERT INTO ledger_accounts (account_name, account_type)
         SELECT 'Cash', 'cash'
         WHERE NOT EXISTS (
           SELECT 1 FROM ledger_accounts WHERE account_name = 'Cash' AND account_type = 'cash'
         )`,
      );

      const cashRes = await client.query(
        "SELECT id FROM ledger_accounts WHERE account_name = 'Cash' AND account_type = 'cash'",
      );
      const cashAcctId: number = cashRes.rows[0].id;

      await client.query(
        `INSERT INTO ledger_transactions
          (account_id, transaction_date, description, debit_aed, credit_aed, reference_type, reference_id)
         VALUES ($1, CURRENT_DATE, $2, 0, $3, 'sale', $4)`,
        [
          cashAcctId,
          `Cash received sale #${saleId}`,
          input.amount_received,
          saleId,
        ],
      );

      // Debit client account for payment received
      await client.query(
        `INSERT INTO ledger_transactions
          (account_id, transaction_date, description, debit_aed, credit_aed, reference_type, reference_id)
         VALUES ($1, CURRENT_DATE, $2, $3, 0, 'payment', $4)`,
        [
          clientAcctId,
          `Payment for sale #${saleId}`,
          input.amount_received,
          saleId,
        ],
      );
    }

    await client.query("COMMIT");
    return saleId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
