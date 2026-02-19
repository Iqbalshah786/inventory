import { query, getClient } from "@/lib/db/connection";
import type { LedgerTransaction } from "@/types";

export async function findByAccountId(
  accountId: number,
): Promise<LedgerTransaction[]> {
  return query<LedgerTransaction>(
    `SELECT * FROM ledger_transactions WHERE account_id = $1 ORDER BY transaction_date DESC`,
    [accountId],
  );
}

export async function findAll(): Promise<LedgerTransaction[]> {
  return query<LedgerTransaction>(
    "SELECT * FROM ledger_transactions ORDER BY transaction_date DESC",
  );
}

/**
 * Record a "received" payment from a client.
 * Credits the client's ledger account.
 */
export async function recordReceived(
  clientId: number,
  amountAed: number,
): Promise<void> {
  const pg = await getClient();
  try {
    await pg.query("BEGIN");

    // Get client name
    const clientRes = await pg.query("SELECT name FROM clients WHERE id = $1", [
      clientId,
    ]);
    if (clientRes.rows.length === 0) throw new Error("Client not found");
    const clientName = (clientRes.rows[0] as { name: string }).name;

    // Ensure ledger account for client
    await pg.query(
      `INSERT INTO ledger_accounts (account_name, account_type)
       SELECT $1, 'client'
       WHERE NOT EXISTS (
         SELECT 1 FROM ledger_accounts WHERE account_name = $2 AND account_type = 'client'
       )`,
      [clientName, clientName],
    );

    const acctRes = await pg.query(
      "SELECT id FROM ledger_accounts WHERE account_name = $1 AND account_type = 'client'",
      [clientName],
    );
    const acctId: number = (acctRes.rows[0] as { id: number }).id;

    // Insert debit transaction for received payment
    await pg.query(
      `INSERT INTO ledger_transactions
        (account_id, transaction_date, description, debit_aed, credit_aed, reference_type, reference_id)
       VALUES ($1, CURRENT_DATE, $2, $3, 0, 'received', $4)`,
      [acctId, `Payment received from ${clientName}`, amountAed, clientId],
    );

    await pg.query("COMMIT");
  } catch (err) {
    await pg.query("ROLLBACK");
    throw err;
  } finally {
    pg.release();
  }
}

/**
 * Record a "paid" payment to a supplier.
 * Credits the supplier's ledger account.
 */
export async function recordPaid(
  supplierId: number,
  amountAed: number,
  amountUsd: number,
): Promise<void> {
  const pg = await getClient();
  try {
    await pg.query("BEGIN");

    // Get supplier name
    const supplierRes = await pg.query(
      "SELECT name FROM suppliers WHERE id = $1",
      [supplierId],
    );
    if (supplierRes.rows.length === 0) throw new Error("Supplier not found");
    const supplierName = (supplierRes.rows[0] as { name: string }).name;

    // Ensure ledger account for supplier
    await pg.query(
      `INSERT INTO ledger_accounts (account_name, account_type)
       SELECT $1, 'supplier'
       WHERE NOT EXISTS (
         SELECT 1 FROM ledger_accounts WHERE account_name = $2 AND account_type = 'supplier'
       )`,
      [supplierName, supplierName],
    );

    const acctRes = await pg.query(
      "SELECT id FROM ledger_accounts WHERE account_name = $1 AND account_type = 'supplier'",
      [supplierName],
    );
    const acctId: number = (acctRes.rows[0] as { id: number }).id;

    // Insert debit transaction for paid payment with both AED and USD
    await pg.query(
      `INSERT INTO ledger_transactions
        (account_id, transaction_date, description, debit_aed, credit_aed, debit_usd, credit_usd, reference_type, reference_id)
       VALUES ($1, CURRENT_DATE, $2, $3, 0, $4, 0, 'paid', $5)`,
      [acctId, `Payment to ${supplierName}`, amountAed, amountUsd, supplierId],
    );

    await pg.query("COMMIT");
  } catch (err) {
    await pg.query("ROLLBACK");
    throw err;
  } finally {
    pg.release();
  }
}
