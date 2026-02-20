// ----- Database types -----

export interface Admin {
  id: number;
  username: string;
  password: string;
}

export interface Supplier {
  id: number;
  name: string;
}

export type ClientType = "regular" | "walkin";

export interface Client {
  id: number;
  name: string;
  client_type: ClientType | null;
}

export interface MobileModel {
  id: number;
  model_name: string;
}

export interface PurchaseLot {
  id: number;
  supplier_id: number | null;
  invoice_no: string | null;
  purchase_date: string; // ISO date string
  total_quantity: number;
  total_usd_amount: number;
  local_cost_aed: number | null;
  fedex_cost_usd: number | null;
}

export interface PurchaseLotItem {
  id: number;
  lot_id: number;
  model_id: number;
  quantity: number;
  unit_price_usd: number;
}

export interface Inventory {
  id: number;
  model_id: number;
  quantity_remaining: number;
  cost_per_item_aed: number | null;
  avg_cost_aed: number | null;
  avg_cost_usd: number | null;
}

export interface Sale {
  id: number;
  client_id: number;
  sale_date: string;
  total_amount_aed: number;
  total_amount_usd: number | null;
  payment_type: string | null;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  model_id: number;
  quantity: number;
  selling_price_aed: number;
  cost_price_aed: number | null;
}

export interface LedgerAccount {
  id: number;
  account_name: string;
  account_type: string | null;
}

export interface LedgerTransaction {
  id: number;
  account_id: number;
  transaction_date: string;
  description: string | null;
  debit_aed: number | null;
  credit_aed: number | null;
  debit_usd: number | null;
  credit_usd: number | null;
  reference_type: string | null;
  reference_id: number | null;
}

// ----- API types -----

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// ----- View / join types -----

export interface ClientWithBalance extends Client {
  balance: number;
  balance_usd: number;
}

export interface SupplierWithBalance {
  id: number;
  name: string;
  balance_aed: number;
  balance_usd: number;
}

export interface ModelWithInventory extends MobileModel {
  quantity: number;
  price_per_piece: number;
  total_cost: number;
}

export interface StockListRow {
  id: number;
  lot_id: number;
  purchase_date: string;
  supplier_name: string | null;
  model_name: string;
  quantity: number;
  buying_price: number;
  fedex_cost: number;
  local_expense: number;
  total_price: number;
}

/** Grouped by purchase lot for the stock listing page */
export interface StockLotRow {
  lot_id: number;
  purchase_date: string;
  supplier_name: string | null;
  total_quantity: number;
  total_usd: number;
  fedex_cost: number;
  local_expense: number;
  items: StockLotItemRow[];
}

export interface StockLotItemRow {
  model_name: string;
  quantity: number;
  buying_price: number;
  line_total: number;
}

export interface SaleRow {
  client_id: number;
  model_id: number;
  quantity: number;
  selling_price: number;
  total: number;
}

export interface StockFormRow {
  model_id: number | "";
  quantity: number | "";
  buyer_price_usd: number | "";
}

export interface SaleFormRow {
  client_id: number | "";
  model_id: number | "";
  quantity: number | "";
  selling_price: number | "";
  description: string;
  total: number;
}
