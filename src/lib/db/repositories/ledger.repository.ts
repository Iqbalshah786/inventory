import { query } from "@/lib/db/connection";
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
