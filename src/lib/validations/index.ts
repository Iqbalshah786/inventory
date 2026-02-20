import { z } from "zod/v4";

// ---- Shared action state used across all server actions ----
export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

// ---- Schemas ----

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const clientSchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
});

export type ClientInput = z.infer<typeof clientSchema>;

export const supplierSchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
});

export type SupplierInput = z.infer<typeof supplierSchema>;

export const modelSchema = z.object({
  model_name: z.string().min(1, "Model name is required").max(150),
});

export type ModelInput = z.infer<typeof modelSchema>;

export const expenseSchema = z.object({
  model_id: z.coerce.number().int().positive("Please select a model"),
  amount_aed: z.coerce.number().positive("Please enter a valid amount"),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;

export const receivedPaymentSchema = z.object({
  client_id: z.coerce.number().int().positive("Please select a client"),
  amount_aed: z.coerce.number().positive("Please enter a valid amount"),
});

export type ReceivedPaymentInput = z.infer<typeof receivedPaymentSchema>;

export const paidPaymentSchema = z.object({
  supplier_id: z.coerce.number().int().positive("Please select a supplier"),
  amount_aed: z.coerce.number().positive("Please enter a valid amount"),
});

export type PaidPaymentInput = z.infer<typeof paidPaymentSchema>;

export const stockItemSchema = z.object({
  model_id: z.coerce.number().int().positive("Model is required"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  buyer_price_usd: z.coerce.number().positive("Price must be positive"),
});

export const stockFormSchema = z.object({
  items: z.array(stockItemSchema).min(1, "At least one item is required"),
  fedex_cost_usd: z.coerce.number().nonnegative().default(0),
  local_expense_aed: z.coerce.number().nonnegative().default(0),
  amount_paid: z.coerce.number().nonnegative().optional(),
  supplier_id: z.coerce
    .number()
    .int()
    .positive("Supplier is required")
    .optional(),
});

export type StockFormInput = z.infer<typeof stockFormSchema>;

export const saleItemSchema = z.object({
  client_id: z.coerce.number().int().positive("Client is required"),
  model_id: z.coerce.number().int().positive("Model is required"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  selling_price: z.coerce.number().positive("Selling price required"),
});

export const saleFormSchema = z.object({
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
  amount_received: z.coerce.number().nonnegative().optional(),
  is_walkin: z.boolean().default(false),
  description: z.string().optional(),
});

export type SaleFormInput = z.infer<typeof saleFormSchema>;

// ---- Helper to flatten Zod errors to a Record<string, string> ----
export function flattenZodErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}
