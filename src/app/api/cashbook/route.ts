import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db/connection";
import { success, error } from "@/lib/utils/api-response";

export interface CashbookRow {
  id: number;
  transaction_date: string;
  description: string | null;
  reference_type: string;
  debit_aed: number;
  credit_aed: number;
}

export interface CashbookResponse {
  opening_balance: number;
  rows: CashbookRow[];
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(error("Unauthorized"), { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // YYYY-MM-DD

    if (!date) {
      return NextResponse.json(error("Date parameter is required"), {
        status: 400,
      });
    }

    // Opening balance = sum of all cash-related transactions BEFORE the selected date
    // received → cash in (debit_aed)
    // paid → cash out (debit_aed stored as debit on supplier account, means cash goes out)
    // expense → cash out (credit_aed stored as credit on expense account, means cash goes out)
    //
    // Opening balance = SUM(received debit_aed) - SUM(paid debit_aed) - SUM(expense credit_aed)
    //   for all records with transaction_date < selected date
    const obResult = await query<{ opening_balance: number }>(
      `SELECT
         COALESCE(
           SUM(CASE WHEN lt.reference_type = 'received' THEN lt.debit_aed ELSE 0 END)
           - SUM(CASE WHEN lt.reference_type = 'paid' THEN lt.debit_aed ELSE 0 END)
           - SUM(CASE WHEN lt.reference_type = 'expense' THEN lt.credit_aed ELSE 0 END),
           0
         ) AS opening_balance
       FROM ledger_transactions lt
       WHERE lt.reference_type IN ('received', 'paid', 'expense')
         AND lt.transaction_date < $1`,
      [date],
    );

    const opening_balance = Number(obResult[0]?.opening_balance ?? 0);

    // Fetch rows for the selected date
    // For display in cashbook columns:
    //   received → debit column (cash in)
    //   paid → credit column (cash out)
    //   expense → credit column (cash out)
    const rows = await query<CashbookRow>(
      `SELECT
         lt.id,
         lt.transaction_date::text AS transaction_date,
         lt.description,
         lt.reference_type,
         CASE
           WHEN lt.reference_type = 'received' THEN COALESCE(lt.debit_aed, 0)
           ELSE 0
         END AS debit_aed,
         CASE
           WHEN lt.reference_type = 'paid' THEN COALESCE(lt.debit_aed, 0)
           WHEN lt.reference_type = 'expense' THEN COALESCE(lt.credit_aed, 0)
           ELSE 0
         END AS credit_aed
       FROM ledger_transactions lt
       WHERE lt.reference_type IN ('received', 'paid', 'expense')
         AND lt.transaction_date = $1
       ORDER BY lt.id ASC`,
      [date],
    );

    return NextResponse.json(
      success<CashbookResponse>({ opening_balance, rows }),
    );
  } catch (err) {
    console.error("Cashbook error:", err);
    return NextResponse.json(error("Failed to fetch cashbook"), {
      status: 500,
    });
  }
}
